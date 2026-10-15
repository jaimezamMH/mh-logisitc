"use client";

import { useEffect } from "react";

// Recarga la página sola después de `ms` milisegundos — para pantallas que
// se quedan prendidas sin que nadie las toque (ej. /reportes/pantalla), así
// no se quedan mostrando datos viejos por horas.
export default function AutoReload({ ms }: { ms: number }) {
  useEffect(() => {
    const id = setTimeout(() => window.location.reload(), ms);
    return () => clearTimeout(id);
  }, [ms]);

  return null;
}
