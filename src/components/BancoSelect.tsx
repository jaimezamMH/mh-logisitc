"use client";

import { useState } from "react";
import { Plus, List } from "lucide-react";
import { BANCOS_MEXICO, BANCOS_USA } from "@/lib/constants";

export default function BancoSelect({
  nombreBanco = "banco",
  nombreMoneda = "monedaCuenta",
  defaultBanco = "",
  defaultMoneda = "MXN",
}: {
  nombreBanco?: string;
  nombreMoneda?: string;
  defaultBanco?: string;
  defaultMoneda?: string;
}) {
  const [moneda, setMoneda] = useState(defaultMoneda);
  const options = moneda === "USD" ? BANCOS_USA : BANCOS_MEXICO;
  const yaEnLista = defaultBanco === "" || (options as readonly string[]).includes(defaultBanco);
  const [modoNuevo, setModoNuevo] = useState(!yaEnLista);

  return (
    <div className="flex flex-col gap-1.5">
      <select
        name={nombreMoneda}
        value={moneda}
        onChange={(e) => setMoneda(e.target.value)}
        className="rounded-lg border border-border px-3 py-2 text-sm"
      >
        <option value="MXN">Cuenta en pesos (MXN)</option>
        <option value="USD">Cuenta en dólares (USD)</option>
      </select>
      <div className="flex items-center gap-1.5">
        {modoNuevo ? (
          <input
            name={nombreBanco}
            defaultValue={defaultBanco}
            placeholder="Nombre del banco"
            className="flex-1 min-w-0 rounded-lg border border-border px-3 py-2 text-sm"
          />
        ) : (
          <select
            key={moneda}
            name={nombreBanco}
            defaultValue={defaultBanco}
            className="flex-1 min-w-0 rounded-lg border border-border px-3 py-2 text-sm"
          >
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
    </div>
  );
}
