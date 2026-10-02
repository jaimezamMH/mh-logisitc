import { ESTADOS_PATHS } from "@/lib/usStatesPaths";

const CODIGOS_VALIDOS = new Set(ESTADOS_PATHS.map((e) => e.code));

const NOMBRE_A_CODIGO: Record<string, string> = {
  alberta: "AB",
  ontario: "ON",
  quebec: "QC",
  montreal: "QC",
  "british columbia": "BC",
  "columbia britanica": "BC",
};

/**
 * A partir de un texto de origen tipo "Phoenix, AZ", "Alberta, Canada" o
 * "Vaughan, Ontario", regresa el código de estado/provincia (o null si no
 * se reconoce esa región en el mapa).
 */
export function estadoDesdeOrigen(origen: string | null | undefined): string | null {
  if (!origen) return null;
  const partes = origen.split(",").map((p) => p.trim());
  const ultima = partes[partes.length - 1];
  if (!ultima) return null;

  // Ya viene como código de 2 letras (AZ, CA, BC, ...)
  if (/^[A-Z]{2}$/.test(ultima) && CODIGOS_VALIDOS.has(ultima)) return ultima;

  const normal = ultima.toLowerCase();
  if (normal === "canada" || normal === "canadá") {
    const primera = (partes[0] ?? "").toLowerCase();
    return NOMBRE_A_CODIGO[primera] ?? null;
  }

  return NOMBRE_A_CODIGO[normal] ?? null;
}
