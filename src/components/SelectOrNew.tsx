"use client";

import { useState } from "react";
import { Plus, List } from "lucide-react";

export default function SelectOrNew({
  name,
  options,
  defaultValue = "",
  placeholder,
}: {
  name: string;
  options: readonly string[];
  defaultValue?: string;
  placeholder?: string;
}) {
  const yaEnLista = defaultValue === "" || options.includes(defaultValue);
  const [modoNuevo, setModoNuevo] = useState(!yaEnLista);

  return (
    <div className="flex items-center gap-1.5">
      {modoNuevo ? (
        <input
          name={name}
          defaultValue={defaultValue}
          autoFocus
          placeholder={placeholder ?? "Escribe el nombre nuevo"}
          className="flex-1 min-w-0 rounded-lg border border-border px-3 py-2 text-sm"
        />
      ) : (
        <select name={name} defaultValue={defaultValue} className="flex-1 min-w-0 rounded-lg border border-border px-3 py-2 text-sm">
          <option value="">Sin asignar</option>
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      )}
      <button
        type="button"
        title={modoNuevo ? "Elegir de la lista" : "Agregar uno nuevo"}
        onClick={() => setModoNuevo((m) => !m)}
        className="shrink-0 flex items-center justify-center rounded-lg h-9 w-9 border border-border text-ink-secondary hover:bg-surface-muted hover:text-brand-blue-700"
      >
        {modoNuevo ? <List size={14} /> : <Plus size={14} />}
      </button>
    </div>
  );
}
