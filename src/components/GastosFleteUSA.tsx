"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { guardarGastosFleteUSA, eliminarGastoFleteUSA } from "@/lib/actions";
import { formatFecha, formatMXN, FLETE_USA_SLOTS, gastoFleteUSAPerteneceASlot } from "@/lib/constants";
import { MoneyInput } from "@/components/ui";

export interface GastoFleteUSAItem {
  id: string;
  concepto: string;
  monto: number;
  fecha: Date;
  paymentOrderId: string | null;
}

function montoSlotSinPagar(gastos: GastoFleteUSAItem[], slotKey: (typeof FLETE_USA_SLOTS)[number]["key"]) {
  return gastos
    .filter((g) => !g.paymentOrderId && gastoFleteUSAPerteneceASlot(g.concepto, slotKey))
    .reduce((a, g) => a + g.monto, 0);
}

function nombreOperadorActual(gastos: GastoFleteUSAItem[]) {
  const g = gastos.find((g) => !g.paymentOrderId && g.concepto.startsWith("Pago operador:"));
  return g ? g.concepto.replace("Pago operador:", "").trim() : "";
}

// Desglose de Flete USA en 6 conceptos fijos (ver FLETE_USA_SLOTS): un solo
// formulario con una casilla de monto por concepto que se guardan todas
// juntas — no hay que ir agregando una por una. El total se guarda en
// Shipment.costoFleteUSA automáticamente (ver recalcularCostoFleteUSA).
export default function GastosFleteUSA({
  shipmentId,
  gastos,
  costoFleteUSA,
  soloLectura,
}: {
  shipmentId: string;
  gastos: GastoFleteUSAItem[];
  costoFleteUSA: number;
  soloLectura: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [guardado, setGuardado] = useState(false);

  // Gastos que no son ninguno de los 6 conceptos fijos (ej. un monto
  // previo sin desglosar de antes de este cambio) — se muestran aparte.
  const otros = gastos.filter((g) => !FLETE_USA_SLOTS.some((slot) => gastoFleteUSAPerteneceASlot(g.concepto, slot.key)));

  function guardar(formEl: HTMLFormElement) {
    const fd = new FormData(formEl);
    setError(null);
    setGuardado(false);
    startTransition(async () => {
      try {
        await guardarGastosFleteUSA(shipmentId, fd);
        setGuardado(true);
      } catch {
        setError("No se pudo guardar. Revisa los montos.");
      }
    });
  }

  function eliminar(id: string) {
    if (!window.confirm("¿Eliminar este gasto de Flete USA?")) return;
    setError(null);
    startTransition(async () => {
      try {
        await eliminarGastoFleteUSA(id);
      } catch {
        setError("No se pudo eliminar.");
      }
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-ink-primary">Flete USA</span>
        <span className="text-sm font-semibold text-ink-primary">{formatMXN(costoFleteUSA)}</span>
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}
      {guardado && !pending && <p className="text-xs text-brand-blue-700">Guardado.</p>}

      {soloLectura ? (
        <ul className="space-y-1.5">
          {FLETE_USA_SLOTS.map((slot) => {
            const monto = montoSlotSinPagar(gastos, slot.key);
            if (monto <= 0) return null;
            return (
              <li key={slot.key} className="flex items-center justify-between gap-2 text-xs">
                <span className="text-ink-secondary">{slot.label}</span>
                <span className="text-ink-primary font-medium">{formatMXN(monto)}</span>
              </li>
            );
          })}
        </ul>
      ) : (
        <form
          onSubmit={(ev) => {
            ev.preventDefault();
            guardar(ev.currentTarget);
          }}
          className="no-print space-y-2 rounded-lg border border-border p-3"
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {FLETE_USA_SLOTS.map((slot) => (
              <label key={slot.key} className="flex flex-col gap-1 text-xs">
                <span className="text-ink-muted">{slot.label}</span>
                <MoneyInput
                  name={`monto_${slot.key}`}
                  defaultValue={montoSlotSinPagar(gastos, slot.key)}
                  className="rounded-md border border-border px-2 py-1.5 text-sm"
                />
              </label>
            ))}
          </div>
          <label className="flex flex-col gap-1 text-xs">
            <span className="text-ink-muted">Nombre del operador (si aplica pago a operador)</span>
            <input name="nombreOperador" defaultValue={nombreOperadorActual(gastos)} className="rounded-md border border-border px-2 py-1.5 text-sm" />
          </label>
          <div className="flex justify-end pt-1">
            <button type="submit" disabled={pending} className="rounded-md bg-gray-900 text-white text-xs font-medium px-3 py-1.5 hover:opacity-90 disabled:opacity-60">
              Guardar gastos de Flete USA
            </button>
          </div>
        </form>
      )}

      {otros.length > 0 && (
        <ul className="space-y-1.5 pt-1 border-t border-border">
          {otros.map((g) => (
            <li key={g.id} className="flex items-center justify-between gap-2 text-xs pt-1.5">
              <span className="text-ink-secondary truncate">
                {g.concepto} <span className="text-ink-muted">· {formatFecha(g.fecha)}</span>
              </span>
              <span className="flex items-center gap-2 shrink-0">
                <span className="text-ink-primary font-medium">{formatMXN(g.monto)}</span>
                {!soloLectura && !g.paymentOrderId && (
                  <button
                    type="button"
                    onClick={() => eliminar(g.id)}
                    disabled={pending}
                    title="Eliminar"
                    className="no-print text-ink-muted hover:text-red-600"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
                {g.paymentOrderId && <span className="text-ink-muted">(ya en una orden)</span>}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
