import { createHmac, timingSafeEqual } from "node:crypto";

export const AUTH_COOKIE = "mh_auth";

// "full" = acceso completo (Jaime, Raúl); "view" = solo lectura (Dirección)
export type AuthRole = "full" | "view" | null;

export const DURACION_SESION_SEG = 60 * 60 * 24 * 180; // 180 días

// La cookie antes guardaba un texto fijo ("mh-auth-granted"), así que
// cualquiera podía crearla a mano en el navegador y entrar sin clave. Ahora
// va firmada con HMAC-SHA256: "<rol>.<expira>.<firma>". La llave es
// AUTH_SECRET; si no existe se deriva de APP_PASSWORD (que ya vive solo en
// el servidor), así que cambiar la clave de acceso también cierra todas las
// sesiones abiertas.
function llaveFirma(): string | null {
  const base = process.env.AUTH_SECRET || process.env.APP_PASSWORD;
  return base ? `mh-logistica-sesion:${base}` : null;
}

function firmar(datos: string, llave: string) {
  return createHmac("sha256", llave).update(datos).digest("base64url");
}

export function crearValorSesion(rol: "full" | "view"): string {
  const llave = llaveFirma();
  if (!llave) throw new Error("Falta APP_PASSWORD / AUTH_SECRET en el servidor");
  const expira = Math.floor(Date.now() / 1000) + DURACION_SESION_SEG;
  const datos = `${rol}.${expira}`;
  return `${datos}.${firmar(datos, llave)}`;
}

export function rolDesdeCookie(valor: string | undefined): AuthRole {
  const llave = llaveFirma();
  if (!valor || !llave) return null;
  const partes = valor.split(".");
  if (partes.length !== 3) return null;
  const [rol, expiraTxt, firma] = partes;
  if (rol !== "full" && rol !== "view") return null;
  const expira = Number(expiraTxt);
  if (!Number.isFinite(expira) || expira * 1000 < Date.now()) return null;

  const esperada = Buffer.from(firmar(`${rol}.${expiraTxt}`, llave));
  const recibida = Buffer.from(firma);
  if (esperada.length !== recibida.length || !timingSafeEqual(esperada, recibida)) return null;
  return rol;
}

// Comparación de claves en tiempo constante (no revela cuántos caracteres
// coinciden según lo que tarda en responder).
export function igualesSeguro(a: string, b: string): boolean {
  const ha = createHmac("sha256", "cmp").update(a).digest();
  const hb = createHmac("sha256", "cmp").update(b).digest();
  return timingSafeEqual(ha, hb);
}
