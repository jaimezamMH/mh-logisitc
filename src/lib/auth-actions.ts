"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_COOKIE, DURACION_SESION_SEG, crearValorSesion, igualesSeguro } from "@/lib/auth";

export async function loginAction(formData: FormData) {
  const password = formData.get("password");
  const next = formData.get("next");
  // solo rutas internas ("/algo"), nunca "//otro-sitio.com"
  const siguiente = typeof next === "string" && next.startsWith("/") && !next.startsWith("//") ? next : "/";

  const clave = typeof password === "string" ? password : "";
  const claveCompleta = process.env.APP_PASSWORD;
  const claveLectura = process.env.APP_PASSWORD_VIEW;

  let rol: "full" | "view";
  if (claveCompleta && igualesSeguro(clave, claveCompleta)) {
    rol = "full";
  } else if (claveLectura && igualesSeguro(clave, claveLectura)) {
    rol = "view"; // Dirección: acceso de solo lectura
  } else {
    redirect(`/login?error=1&next=${encodeURIComponent(siguiente)}`);
  }

  const store = await cookies();
  store.set(AUTH_COOKIE, crearValorSesion(rol), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: DURACION_SESION_SEG,
  });

  redirect(siguiente);
}

export async function logoutAction() {
  const store = await cookies();
  store.delete(AUTH_COOKIE);
  redirect("/login");
}
