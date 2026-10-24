"use client";

import { useState, useTransition } from "react";
import { Pencil, Trash2, Check, X, Plus } from "lucide-react";
import { agregarStatusEventManual, editarStatusEvent, eliminarStatusEvent } from "@/lib/actions";
import { formatFecha, ESTATUS_FLOW } from "@/lib/constants";
import { EmptyState } from "@/components/ui";
import UserSelect from "@/components/UserSelect";

export interface EventoEstatus {
  id: string;
  estatusAnterior: string | null;
  estatusNuevo: string;
  fecha: Date;
  usuario: string | null;
  comentario: string | null;
}

type Duracion = { dias: number; enCurso: boolean };

function dateInputValue(d: Date) {
  return new Date(d).toISOString().slice(0, 10);
}

export default function HistorialEstatusEditable({
  shipmentId,
  eventos,
  duracionPorEvento,
  soloLectura,
}: {
  shipmentId: string;
  eventos: EventoEstatus[];
  duracionPorEvento: Record<string, Duracion>;
  soloLectura: boolean;
}) {
  const [editId, setEditId] = useState<string | null>(null);
  const [agregando, setAgregando] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function guardarEdicion(id: string, formEl: HTMLFormElement) {
    const fd = new FormData(formEl);
    setError(null);
    startTransition(async () => {
      try {
        await editarStatusEvent(id, fd);
        setEditId(null);
      } catch {
        setError("No se pudo guardar. Revisa la fecha y el estatus.");
      }
    });
  }

  function eliminar(id: string) {
    if (!window.confirm("¿Eliminar este movimiento del historial? Esto no se puede deshacer.")) return;
    setError(null);
    startTransition(async () => {
      try {
        await eliminarStatusEvent(id);
      } catch {
        setError("No se pudo eliminar.");
      }
    });
  }

  function agregar(formEl: HTMLFormElement) {
    const fd = new FormData(formEl);
    setError(null);
    startTransition(async () => {
      try {
        await agregarStatusEventManual(shipmentId, fd);
        setAgregando(false);
        formEl.reset();
      } catch {
        setError("No se pudo agregar. Revisa la fecha y el estatus.");
      }
    });
  }

  return (
    <div>
      {error && <p className="px-5 py-2 text-xs text-red-600 bg-red-50">{error}</p>}
      {eventos.length === 0 ? (
        <div className="p-5">
          <EmptyState text="Sin movimientos registrados." />
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {eventos.map((e) => {
            const dur = duracionPorEvento[e.id];
            const editando = editId === e.id;
            return (
              <li key={e.id} className="px-5 py-3">
                {editando ? (
                  <form
                    onSubmit={(ev) => {
                      ev.preventDefault();
                      guardarEdicion(e.id, ev.currentTarget);
                    }}
                    className="grid grid-cols-2 sm:grid-cols-4 gap-2 items-end"
                  >
                    <label className="flex flex-col gap-1 text-xs">
                      <span className="text-ink-muted">Etapa</span>
                      <select name="estatus" defaultValue={e.estatusNuevo} className="rounded-md border border-border px-2 py-1.5 text-sm">
                        {ESTATUS_FLOW.map((es) => (
                          <option key={es.key} value={es.key}>
                            {es.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="flex flex-col gap-1 text-xs">
                      <span className="text-ink-muted">Fecha</span>
                      <input type="date" name="fecha" defaultValue={dateInputValue(e.fecha)} className="rounded-md border border-border px-2 py-1.5 text-sm" />
                    </label>
                    <label className="flex flex-col gap-1 text-xs sm:col-span-1">
                      <span className="text-ink-muted">Comentario</span>
                      <input name="comentario" defaultValue={e.comentario ?? ""} className="rounded-md border border-border px-2 py-1.5 text-sm" />
                    </label>
                    <div className="flex items-center gap-1.5">
                      <button type="submit" disabled={pending} className="rounded-md bg-brand-blue-600 hover:bg-brand-blue-700 disabled:opacity-60 text-white p-1.5">
                        <Check size={14} />
                      </button>
                      <button type="button" onClick={() => setEditId(null)} disabled={pending} className="rounded-md border border-border text-ink-secondary p-1.5 hover:bg-surface-muted">
                        <X size={14} />
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm text-ink-primary">
                        {e.estatusAnterior ? `${e.estatusAnterior} → ` : ""}
                        <span className="font-medium">{e.estatusNuevo}</span>
                      </p>
                      <p className="text-xs text-ink-muted mt-0.5">
                        {e.usuario ?? "Sistema"} · {formatFecha(e.fecha)} {e.comentario ? `· ${e.comentario}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {dur && (
                        <span className={`inline-flex items-center gap-1 text-xs font-medium ${dur.enCurso ? "text-brand-orange-700" : "text-ink-secondary"}`}>
                          ⏱ {dur.dias} día{dur.dias === 1 ? "" : "s"} {dur.enCurso ? "(en curso)" : "en esta etapa"}
                        </span>
                      )}
                      {!soloLectura && (
                        <div className="no-print flex items-center gap-1">
                          <button onClick={() => setEditId(e.id)} title="Editar" className="rounded-md border border-border text-ink-secondary p-1.5 hover:bg-surface-muted hover:text-brand-blue-700">
                            <Pencil size={13} />
                          </button>
                          <button onClick={() => eliminar(e.id)} disabled={pending} title="Eliminar" className="rounded-md border border-border text-ink-secondary p-1.5 hover:bg-red-50 hover:text-red-600">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {!soloLectura && (
        <div className="no-print p-5 border-t border-border">
          {agregando ? (
            <form
              onSubmit={(ev) => {
                ev.preventDefault();
                agregar(ev.currentTarget);
              }}
              className="space-y-3"
            >
              <p className="text-xs text-ink-muted">
                Para capturar una etapa pasada que no se registró en su momento (ej. esta unidad ya venía de Flete
                USA cuando se dio de alta). No cambia el estatus actual de la unidad, solo agrega historial.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-ink-secondary">Etapa</span>
                  <select name="estatus" className="rounded-lg border border-border px-3 py-2 text-sm">
                    {ESTATUS_FLOW.map((es) => (
                      <option key={es.key} value={es.key}>
                        {es.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-ink-secondary">Fecha</span>
                  <input type="date" name="fecha" required className="rounded-lg border border-border px-3 py-2 text-sm" />
                </label>
                <UserSelect name="usuario" label="Registrado por" />
              </div>
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-ink-secondary">Comentario (opcional)</span>
                <input name="comentario" className="rounded-lg border border-border px-3 py-2 text-sm" />
              </label>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setAgregando(false)} className="rounded-lg border border-border text-sm px-4 py-2 text-ink-secondary hover:bg-surface-muted">
                  Cancelar
                </button>
                <button type="submit" disabled={pending} className="rounded-lg bg-gray-900 text-white text-sm font-medium px-4 py-2 hover:opacity-90 disabled:opacity-60">
                  Guardar etapa
                </button>
              </div>
            </form>
          ) : (
            <button onClick={() => setAgregando(true)} className="flex items-center gap-1.5 text-sm text-brand-blue-700 hover:underline">
              <Plus size={14} />
              Agregar etapa pasada
            </button>
          )}
        </div>
      )}
    </div>
  );
}
