import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE, rolDesdeCookie } from "@/lib/auth";

// Rutas que son solo para dar de alta/importar datos — no tiene sentido que
// las vea alguien con acceso de solo lectura (Dirección), así que se bloquean
// desde aquí en vez de dejar que carguen y truenen al enviar el formulario.
const RUTAS_SOLO_ESCRITURA = ["/embarques/nuevo", "/importar"];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/login")) {
    return NextResponse.next();
  }

  // Vista pública de solo lectura (estatus de operación) para compartir con
  // equipos externos (ej. Ventas) sin que necesiten ninguna clave de acceso.
  if (pathname.startsWith("/publico")) {
    return NextResponse.next();
  }

  // Endpoints para la integración con el ERP (mhdev.posix.mx) — los llama un
  // servidor, no una persona en el navegador, así que no tienen la cookie de
  // acceso. Van sin la clave de la app a propósito (decisión de Jaime).
  if (pathname.startsWith("/api/erp")) {
    return NextResponse.next();
  }

  const rol = rolDesdeCookie(req.cookies.get(AUTH_COOKIE)?.value);
  if (!rol) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (rol === "view" && RUTAS_SOLO_ESCRITURA.some((r) => pathname.startsWith(r))) {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
