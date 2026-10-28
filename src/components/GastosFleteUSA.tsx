"use client";

import { useState, useTransition } from "react";
import { Trash2, Plus } from "lucide-react";
import { agregarGastoFleteUSA, eliminarGastoFleteUSA } from "@/lib/actions";
import { formatFecha, formatMXN } from "@/lib/constants";
import { MoneyInput } from "@/components/ui";

export interface GastoFleteUSAItem {
  id: string;
  concepto: string;
  monto: number;
  fecha: Date;
  paymentOrderId: string | null;
}

const CONCEPTOS = [
  "Viáticos efectivo",
  "Vuelos",
  "Permisos",
  "Seguro",
  "Placas",
  "Gastos generales",
  "Reparación/Refacción",
  "Pago operador",
  "Otro",
] as const;

function dateInputValue(d: Date) {
  return new Date(d).toISOString().slice(0, 10);
}

// Desglose de Flete USA: se elige el concepto (viáticos, vuelos, permisos,
// seguro, placas, gastos generales, reparación, pago operador) y se llena
// el monto — se va agregando uno por uno y todos suman solos al total de
// Flete USA (ver recalcularCostoFleteUSA).
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
  const [agregando, setAgregando] = useState(false);
  const [concepto, setConcepto] = useState<string>(CONCEPTOS[0]);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function agregar(formEl: HTMLFormElement) {
    const fd = new FormData(formEl);
    setError(null);
    startTransition(async () => {
      try {
        await agregarGastoFleteUSA(shipmentId, fd);
        setAgregando(false);
        setConcepto(CONCEPTOS[0]);
        formEl.reset();
      } catch {
        setError("No se pudo agregar. Revisa el monto.");
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

      {gastos.length === 0 ? (
        costoFleteUSA > 0 && (
          <p className="text-xs text-ink-muted">Monto capturado directo (sin desglosar todavía).</p>
        )
      ) : (
        <ul className="space-y-1.5">
          {gastos.map((g) => (
            <li key={g.id} className="flex items-center justify-between gap-2 text-xs">
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

      {!soloLectura && (
        <div className="no-print">
          {agregando ? (
            <form
              onSubmit={(ev) => {
                ev.preventDefault();
                agregar(ev.currentTarget);
              }}
              className="space-y-2 rounded-lg border border-border p-3"
            >
              <div className="grid grid-cols-2 gap-2">
                <label className="flex flex-col gap-1 text-xs">
                  <span className="text-ink-muted">Concepto</span>
                  <select
                    name="tipo"
                    value={concepto}
                    onChange={(e) => setConcepto(e.target.value)}
                    className="rounded-md border border-border px-2 py-1.5 text-sm"
                  >
                    {CONCEPTOS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-xs">
                  <span className="text-ink-muted">Monto</span>
                  <MoneyInput name="monto" className="rounded-md border border-border px-2 py-1.5 text-sm" />
                </label>
              </div>
              {concepto === "Pago operador" && (
                <label className="flex flex-col gap-1 text-xs">
                  <span className="text-ink-muted">Nombre del operador</span>
                  <input name="detalle" className="rounded-md border border-border px-2 py-1.5 text-sm" />
                </label>
              )}
              {concepto === "Otro" && (
                <label className="flex flex-col gap-1 text-xs">
                  <span className="text-ink-muted">Especifica</span>
                  <input name="detalle" className="rounded-md border border-border px-2 py-1.5 text-sm" />
                </label>
              )}
              <label className="flex flex-col gap-1 text-xs">
                <span className="text-ink-muted">Fecha</span>
                <input type="date" name="fecha" defaultValue={dateInputValue(new Date())} className="rounded-md border border-border px-2 py-1.5 text-sm" />
              </label>
              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setAgregando(false)} className="rounded-md border border-border text-xs px-3 py-1.5 text-ink-secondary hover:bg-surface-muted">
                  Cancelar
                </button>
                <button type="submit" disabled={pending} className="rounded-md bg-gray-900 text-white text-xs font-medium px-3 py-1.5 hover:opacity-90 disabled:opacity-60">
                  Agregar
                </button>
              </div>
            </form>
          ) : (
            <button onClick={() => setAgregando(true)} className="flex items-center gap-1.5 text-xs text-brand-blue-700 hover:underline">
              <Plus size={13} />
              Agregar gasto de Flete USA
            </button>
          )}
        </div>
      )}
    </div>
  );
}
