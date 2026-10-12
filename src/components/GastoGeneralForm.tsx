"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { MoneyInput } from "@/components/ui";

// Renglones dinámicos (descripción + monto) para el desglose de una orden de
// pago general — sin controlar el texto en React, solo se agregan/quitan
// filas; al enviar el formulario, FormData.getAll("gastoDescripcion"/"gastoMonto")
// recoge todas las que queden en pantalla, en el mismo orden.
export default function GastoGeneralForm() {
  const [filas, setFilas] = useState<number[]>([0, 1]);
  const [siguienteId, setSiguienteId] = useState(2);

  function agregarFila() {
    setFilas((f) => [...f, siguienteId]);
    setSiguienteId((id) => id + 1);
  }

  function quitarFila(id: number) {
    setFilas((f) => (f.length > 1 ? f.filter((x) => x !== id) : f));
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-[1fr_auto_auto] gap-2 text-xs font-medium text-ink-muted px-0.5">
        <span>Descripción del gasto</span>
        <span className="w-28 text-right">Monto</span>
        <span className="w-8" />
      </div>
      {filas.map((id) => (
        <div key={id} className="grid grid-cols-[1fr_auto_auto] gap-2 items-center">
          <input
            name="gastoDescripcion"
            placeholder="Ej. Renta de oficina"
            className="rounded-lg border border-border px-3 py-2 text-sm"
          />
          <MoneyInput name="gastoMonto" className="w-28 rounded-lg border border-border px-2 py-2 text-right text-sm" />
          <button
            type="button"
            onClick={() => quitarFila(id)}
            disabled={filas.length === 1}
            title="Quitar este gasto"
            className="shrink-0 flex items-center justify-center rounded-lg h-9 w-9 text-ink-muted hover:text-red-600 disabled:opacity-30"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={agregarFila}
        className="flex items-center gap-1.5 text-xs text-brand-blue-700 font-medium hover:underline"
      >
        <Plus size={14} />
        Agregar otro gasto
      </button>
    </div>
  );
}
