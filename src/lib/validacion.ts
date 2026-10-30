import { z } from "zod";

// Validaciones compartidas para lo que entra del ERP (regla D10): tipos,
// montos >= 0 con máximo 2 decimales y fechas ISO 8601.

export const textoCorto = (max = 300) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v.length ? v : undefined))
    .optional();

export const monto = z
  .number({ message: "debe ser un número" })
  .finite()
  .min(0, "no puede ser negativo")
  .refine((n) => Math.abs(Math.round(n * 100) - n * 100) < 1e-6, "máximo 2 decimales");

const ISO = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d{1,6})?)?(Z|[+-]\d{2}:?\d{2})?)?$/;

// "2026-10-29" o "2026-10-29T18:00:00Z" → Date
export const fechaISO = z
  .string()
  .trim()
  .regex(ISO, "debe ser una fecha ISO 8601 (ej. 2026-10-29)")
  .transform((v, ctx) => {
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) {
      ctx.addIssue({ code: "custom", message: "fecha inválida" });
      return z.NEVER;
    }
    return d;
  });

export function redondear2(n: number) {
  return Math.round(n * 100) / 100;
}
