import { prisma } from "@/lib/prisma";

// Bitácora de auditoría (regla D11 del documento de integración con el ERP):
// quién creó/canceló/eliminó cada orden y cuándo, y cada llamada con el ERP
// con su código de respuesta. Nunca debe recibir tokens, llaves ni CLABE
// completas — por eso el detalle pasa por limpiarDetalle() antes de guardarse.
// Nunca truena: si la bitácora falla, la operación principal sigue.

export interface EntradaAuditoria {
  accion: string;
  entidad?: string;
  entidadId?: string | null;
  usuario?: string | null;
  httpStatus?: number | null;
  detalle?: string | null;
}

// Cualquier secuencia de 10+ dígitos (CLABE, número de cuenta, tarjeta) se
// reduce a sus últimos 4, y se quitan encabezados de autorización.
export function limpiarDetalle(texto: string): string {
  return texto
    .replace(/(authorization|token|secret|api[_-]?key)\s*[:=]\s*\S+/gi, "$1: [oculto]")
    .replace(/\d{10,}/g, (m) => `****${m.slice(-4)}`)
    .slice(0, 1000);
}

export async function registrarAuditoria(e: EntradaAuditoria): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        accion: e.accion,
        entidad: e.entidad ?? null,
        entidadId: e.entidadId ?? null,
        usuario: e.usuario ?? null,
        httpStatus: e.httpStatus ?? null,
        detalle: e.detalle ? limpiarDetalle(e.detalle) : null,
      },
    });
  } catch (err) {
    console.error("[auditoria] no se pudo registrar", e.accion, err instanceof Error ? err.message : err);
  }
}

export function enmascararCuenta(valor: string | null | undefined): string {
  if (!valor) return "";
  const limpio = valor.replace(/\s+/g, "");
  return limpio.length <= 4 ? limpio : `•••• ${limpio.slice(-4)}`;
}
