"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";

// Buscador genérico: escribe y, tras una pequeña pausa, actualiza la URL
// (?buscar=...) sin perder los demás filtros que ya estén activos (estatus,
// periodo, etc.) — la página vuelve a renderizar del lado del servidor ya
// filtrada. No hace falta ningún backend nuevo, solo filtrar la lista que
// cada pantalla ya trae.
export default function Buscador({ placeholder = "Buscar por serie, cliente o equipo…" }: { placeholder?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [valor, setValor] = useState(searchParams.get("buscar") ?? "");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setValor(searchParams.get("buscar") ?? "");
  }, [searchParams]);

  function actualizarUrl(texto: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (texto.trim()) params.set("buscar", texto);
    else params.delete("buscar");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function onChange(texto: string) {
    setValor(texto);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => actualizarUrl(texto), 300);
  }

  function limpiar() {
    setValor("");
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    actualizarUrl("");
  }

  return (
    <div className="relative w-full sm:w-72">
      <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" />
      <input
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-border pl-9 pr-8 py-2 text-sm"
      />
      {valor && (
        <button
          type="button"
          onClick={limpiar}
          title="Limpiar búsqueda"
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink-primary"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
