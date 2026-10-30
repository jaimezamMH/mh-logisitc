import { registrarAuditoria } from "@/lib/audit";

// Cliente HTTP para el ERP de Machinery Hunters (Frappe). Solo se usa desde
// el servidor (server actions / route handlers): las llaves viven en
// variables de entorno sin prefijo NEXT_PUBLIC_, así que nunca llegan al
// navegador.
//
//   ERP_URL         ej. https://mhdev.posix.mx (pruebas) — producción usa otra
//   ERP_API_KEY     llave del usuario logistica-api
//   ERP_API_SECRET  secreto del usuario logistica-api
//
// Manejo de errores según el documento de integración:
//   403          → token incorrecto (no se reintenta)
//   417 / 4xx    → error de datos; el mensaje legible viene en `exception`
//                  o en `_server_messages` (no se reintenta)
//   5xx/timeout  → se reintenta con espera creciente, hasta 3 veces

export class ErpError extends Error {
  status: number | null;
  reintentable: boolean;
  constructor(mensaje: string, status: number | null, reintentable: boolean) {
    super(mensaje);
    this.name = "ErpError";
    this.status = status;
    this.reintentable = reintentable;
  }
}

function configERP() {
  const url = process.env.ERP_URL?.trim().replace(/\/+$/, "");
  const key = process.env.ERP_API_KEY?.trim();
  const secret = process.env.ERP_API_SECRET?.trim();
  if (!url || !key || !secret) {
    throw new ErpError(
      "La integración con el ERP no está configurada (faltan ERP_URL, ERP_API_KEY o ERP_API_SECRET).",
      null,
      false
    );
  }
  if (!url.startsWith("https://")) {
    throw new ErpError("ERP_URL debe ser https://", null, false);
  }
  return { url, authorization: `token ${key}:${secret}` };
}

export function erpConfigurado(): boolean {
  try {
    configERP();
    return true;
  } catch {
    return false;
  }
}

function quitarHtml(s: string) {
  return s.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

// Frappe manda los mensajes para el usuario en `_server_messages`: un string
// JSON con un arreglo de strings JSON, cada uno con { message }. Si no viene,
// se usa `exception` ("frappe.exceptions.ValidationError: mensaje").
export function mensajeDeErrorFrappe(cuerpo: unknown): string | null {
  if (!cuerpo || typeof cuerpo !== "object") return null;
  const c = cuerpo as Record<string, unknown>;

  if (typeof c._server_messages === "string") {
    try {
      const lista = JSON.parse(c._server_messages) as unknown[];
      const mensajes = lista
        .map((item) => {
          if (typeof item !== "string") return null;
          try {
            const obj = JSON.parse(item) as { message?: unknown };
            return typeof obj.message === "string" ? quitarHtml(obj.message) : quitarHtml(item);
          } catch {
            return quitarHtml(item);
          }
        })
        .filter((m): m is string => !!m);
      if (mensajes.length) return mensajes.join(" · ");
    } catch {
      // formato inesperado — se intenta con exception
    }
  }

  if (typeof c.exception === "string") {
    const sinTipo = c.exception.replace(/^[\w.]+(Error|Exception)[^:]*:\s*/, "");
    return quitarHtml(sinTipo || c.exception);
  }

  if (typeof c.message === "string") return quitarHtml(c.message);
  if (c.message && typeof c.message === "object") {
    const m = c.message as Record<string, unknown>;
    if (typeof m.error === "string") return quitarHtml(m.error);
  }
  return null;
}

const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface OpcionesLlamada {
  metodo: "GET" | "POST";
  // nombre del método de Frappe, ej. "mh.api.log_orden_pago"
  endpoint: string;
  query?: Record<string, string | undefined>;
  body?: unknown;
  // para la bitácora: folio de la orden / unidad relacionada
  referencia?: string | null;
  timeoutMs?: number;
  // reintentos ante 5xx/timeout (el documento pide hasta 3)
  reintentos?: number;
}

// Llama un método del ERP y regresa `message` de la respuesta (así contesta
// Frappe: { "message": ... }).
export async function llamarERP<T>(op: OpcionesLlamada): Promise<T> {
  const { url, authorization } = configERP();
  const qs = op.query
    ? "?" +
      new URLSearchParams(
        Object.entries(op.query).filter((e): e is [string, string] => typeof e[1] === "string")
      ).toString()
    : "";
  const destino = `${url}/api/method/${op.endpoint}${qs === "?" ? "" : qs}`;
  const reintentos = op.reintentos ?? 3;
  const timeoutMs = op.timeoutMs ?? 10000;

  let ultimoError: ErpError | null = null;

  for (let intento = 0; intento <= reintentos; intento++) {
    if (intento > 0) await esperar(500 * 2 ** (intento - 1)); // 0.5s, 1s, 2s

    const inicio = Date.now();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    let status: number | null = null;

    try {
      const res = await fetch(destino, {
        method: op.metodo,
        headers: {
          Authorization: authorization,
          Accept: "application/json",
          ...(op.body !== undefined ? { "Content-Type": "application/json" } : {}),
        },
        body: op.body !== undefined ? JSON.stringify(op.body) : undefined,
        signal: controller.signal,
        cache: "no-store",
      });
      status = res.status;
      const texto = await res.text();
      let cuerpo: unknown = null;
      try {
        cuerpo = texto ? JSON.parse(texto) : null;
      } catch {
        cuerpo = null;
      }

      if (res.ok) {
        await registrarAuditoria({
          accion: `erp.${op.endpoint}`,
          entidad: "ERP",
          entidadId: op.referencia,
          httpStatus: status,
          detalle: `${op.metodo} ok en ${Date.now() - inicio} ms${intento ? ` (intento ${intento + 1})` : ""}`,
        });
        const mensaje = (cuerpo as { message?: T } | null)?.message;
        return mensaje as T;
      }

      const legible = mensajeDeErrorFrappe(cuerpo) ?? texto.slice(0, 300);
      if (status === 401 || status === 403) {
        ultimoError = new ErpError("El ERP rechazó las credenciales de MH Logística (403). Revisa ERP_API_KEY / ERP_API_SECRET.", status, false);
      } else if (status >= 500) {
        ultimoError = new ErpError(`El ERP respondió ${status}${legible ? `: ${legible}` : ""}`, status, true);
      } else {
        ultimoError = new ErpError(legible || `El ERP respondió ${status}`, status, false);
      }
    } catch (err) {
      const abortado = err instanceof Error && err.name === "AbortError";
      ultimoError = new ErpError(
        abortado ? `El ERP no respondió en ${timeoutMs / 1000} s` : `No se pudo conectar con el ERP: ${err instanceof Error ? err.message : "error de red"}`,
        null,
        true
      );
    } finally {
      clearTimeout(timer);
    }

    await registrarAuditoria({
      accion: `erp.${op.endpoint}`,
      entidad: "ERP",
      entidadId: op.referencia,
      httpStatus: ultimoError.status,
      detalle: `${op.metodo} falló (intento ${intento + 1}): ${ultimoError.message}`,
    });

    if (!ultimoError.reintentable) break;
  }

  throw ultimoError ?? new ErpError("Error desconocido con el ERP", null, false);
}
