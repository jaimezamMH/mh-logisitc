export const AUTH_COOKIE = "mh_auth";
export const AUTH_VALUE = "mh-auth-granted"; // acceso completo (Jaime, Raúl)
export const AUTH_VALUE_VIEW = "mh-auth-view"; // solo lectura (Dirección) — ve todo, no puede modificar nada

export type AuthRole = "full" | "view" | null;

export function rolDesdeCookie(valor: string | undefined): AuthRole {
  if (valor === AUTH_VALUE) return "full";
  if (valor === AUTH_VALUE_VIEW) return "view";
  return null;
}
