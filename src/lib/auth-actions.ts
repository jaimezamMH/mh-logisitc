"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_COOKIE, AUTH_VALUE, AUTH_VALUE_VIEW } from "@/lib/auth";

export async function loginAction(formData: FormData) {
  const password = formData.get("password");
  const next = formData.get("next");
  const siguiente = typeof next === "string" && next.startsWith("/") ? next : "/";

  let valorCookie: string;
  if (password === process.env.APP_PASSWORD) {
    valorCookie = AUTH_VALUE;
  } else if (process.env.APP_PASSWORD_VIEW && password === process.env.APP_PASSWORD_VIEW) {
    valorCookie = AUTH_VALUE_VIEW; // Dirección: acceso de solo lectura
  } else {
    redirect(`/login?error=1&next=${encodeURIComponent(siguiente)}`);
  }

  const store = await cookies();
  store.set(AUTH_COOKIE, valorCookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 180, // 180 días
  });

  redirect(siguiente);
}

export async function logoutAction() {
  const store = await cookies();
  store.delete(AUTH_COOKIE);
  redirect("/login");
}
