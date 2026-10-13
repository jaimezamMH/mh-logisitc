"use client";

import { useState } from "react";
import { CATEGORIAS_CAMION, CATEGORIAS_AMARILLO, TIPOS_UNIDAD } from "@/lib/constants";

export default function CategoriaTipoSelect({
  tipoUnidadDefault,
  categoriaDefault,
}: {
  tipoUnidadDefault?: string | null;
  categoriaDefault?: string | null;
}) {
  const [tipo, setTipo] = useState(tipoUnidadDefault ?? "");
  const opciones = tipo === "CAMION" ? CATEGORIAS_CAMION : tipo === "AMARILLO" ? CATEGORIAS_AMARILLO : [];
  const categoriaInicialValida =
    tipo === tipoUnidadDefault && categoriaDefault && (opciones as readonly string[]).includes(categoriaDefault);

  return (
    <>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-ink-secondary">Tipo de unidad</span>
        <select
          name="tipoUnidad"
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
          className="rounded-lg border border-border px-3 py-2 text-sm"
        >
          <option value="">Selecciona…</option>
          {TIPOS_UNIDAD.map((t) => (
            <option key={t} value={t}>
              {t === "CAMION" ? "Camión" : "Amarilla (maquinaria)"}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-ink-secondary">Categoría</span>
        <select
          key={tipo}
          name="categoria"
          defaultValue={categoriaInicialValida ? categoriaDefault! : ""}
          disabled={!tipo}
          className="rounded-lg border border-border px-3 py-2 text-sm disabled:bg-gray-50 disabled:text-ink-muted"
        >
          <option value="">{tipo ? "Selecciona…" : "Primero elige el tipo de unidad"}</option>
          {opciones.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>
    </>
  );
}
