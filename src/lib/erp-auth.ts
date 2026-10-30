import { createHash, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

// Protección de los endpoints /api/erp/* que llama el ERP:
//   - header Authorization: Bearer <MH_LOGISTICA_TOKEN> (32+ caracteres),
//     comparado en tiempo constante; sin token o incorrecto → 401
//   - límite de peticiones por minuto por IP
//   - sin CORS (no se manda Access-Control-Allow-Origin: nadie puede
//     llamarlos desde un navegador de otro sitio)
//   - límite de tamaño del body

export const LIMITE_BODY_BYTES = 4 * 1024 * 1024; // la foto en base64 pesa hasta ~1.5 MB

export function respuestaError(status: number, error: string) {
  return NextResponse.json({ ok: false, error }, { status, headers: { "Cache-Control": "no-store" } });
}

const sha256 = (s: string) => createHash("sha256").update(s).digest();

function tokenValido(req: NextRequest): boolean | "sin-configurar" {
  const esperado = process.env.MH_LOGISTICA_TOKEN?.trim();
  if (!esperado || esperado.length < 32) return "sin-configurar";
  const header = req.headers.get("authorization") ?? "";
  const m = /^Bearer\s+(.+)$/i.exec(header.trim());
  if (!m) return false;
  // se comparan los hash (mismo largo siempre) para que timingSafeEqual no
  // revele el largo del token
  return timingSafeEqual(sha256(m[1].trim()), sha256(esperado));
}

// Límite de peticiones en memoria (por instancia del servidor). En Vercel
// cada instancia lleva su propia cuenta, así que es una protección básica;
// para algo más estricto conviene además una regla de rate limit en el
// firewall de Vercel para /api/erp/*.
const VENTANA_MS = 60_000;
const MAX_POR_VENTANA = 120;
const contadores = new Map<string, { inicio: number; n: number }>();

function excedeLimite(clave: string): boolean {
  const ahora = Date.now();
  const c = contadores.get(clave);
  if (!c || ahora - c.inicio > VENTANA_MS) {
    contadores.set(clave, { inicio: ahora, n: 1 });
    if (contadores.size > 5000) {
      for (const [k, v] of contadores) if (ahora - v.inicio > VENTANA_MS) contadores.delete(k);
    }
    return false;
  }
  c.n += 1;
  return c.n > MAX_POR_VENTANA;
}

export function ipDe(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "desconocida";
}

// Regresa una respuesta de error si la petición no pasa; null si todo bien.
export function verificarPeticionERP(req: NextRequest): NextResponse | null {
  if (excedeLimite(`${ipDe(req)}:${req.nextUrl.pathname}`)) {
    return respuestaError(429, "Demasiadas peticiones; intenta de nuevo en un minuto.");
  }
  const valido = tokenValido(req);
  if (valido === "sin-configurar") {
    return respuestaError(503, "La integración con el ERP no está configurada en MH Logística.");
  }
  if (!valido) return respuestaError(401, "Token inválido o ausente.");
  return null;
}

// Lee el body respetando el límite de tamaño y lo parsea como JSON.
export async function leerJSON(req: NextRequest): Promise<{ ok: true; body: unknown } | { ok: false; res: NextResponse }> {
  const largo = Number(req.headers.get("content-length") ?? "0");
  if (largo > LIMITE_BODY_BYTES) {
    return { ok: false, res: respuestaError(413, "El body excede el límite de 4 MB.") };
  }
  const tipo = req.headers.get("content-type") ?? "";
  if (!tipo.toLowerCase().includes("application/json")) {
    return { ok: false, res: respuestaError(415, "Se esperaba Content-Type: application/json.") };
  }
  const texto = await req.text();
  if (Buffer.byteLength(texto, "utf8") > LIMITE_BODY_BYTES) {
    return { ok: false, res: respuestaError(413, "El body excede el límite de 4 MB.") };
  }
  try {
    return { ok: true, body: JSON.parse(texto) };
  } catch {
    return { ok: false, res: respuestaError(400, "Body inválido — se esperaba JSON.") };
  }
}

// Convierte los errores de zod en un mensaje legible para el usuario del ERP.
export function mensajeValidacion(issues: { path: PropertyKey[]; message: string }[]): string {
  return issues
    .slice(0, 5)
    .map((i) => `${i.path.map(String).join(".") || "body"}: ${i.message}`)
    .join("; ");
}
