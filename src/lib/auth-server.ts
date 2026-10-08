import { cookies } from "next/headers";
import { AUTH_COOKIE, rolDesdeCookie, type AuthRole } from "@/lib/auth";

export async function getAuthRole(): Promise<AuthRole> {
  const store = await cookies();
  return rolDesdeCookie(store.get(AUTH_COOKIE)?.value);
}

export async function esSoloLectura(): Promise<boolean> {
  return (await getAuthRole()) === "view";
}
