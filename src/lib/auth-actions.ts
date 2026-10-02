"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_COOKIE, AUTH_VALUE } from "@/lib/auth";

export async function loginAction(formData: FormData) {
  const password = formData.get("password");
  const next = formData.get("next");
  const siguiente = typeof next === "string" && next.startsWith("/") ? next : "/";

  if (password !== process.env.APP_PASSWORD) {
    redirect(`/login?error=1&next=${encodeURIComponent(siguiente)}`);
  }

  const store = await cookies();
  store.set(AUTH_COOKIE, AUTH_VALUE, {
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
