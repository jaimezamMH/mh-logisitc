"use client";

import { useState } from "react";
import Link from "next/link";
import { ESTADOS_PATHS, VIEWBOX } from "@/lib/usStatesPaths";
import { StatusBadge } from "@/components/ui";
import type { OrigenDetalleUnidad } from "@/lib/queries";

function colorPorIntensidad(n: number, max: number) {
  if (n <= 0) return "#e2e8f0"; // gray-200: sin datos
  const t = Math.min(1, n / max);
  const stops: [number, string][] = [
    [0, "#bfdbfe"],
    [0.5, "#3b82f6"],
    [1, "#0f2440"],
  ];
  let lo = stops[0], hi = stops[stops.length - 1];
  for (let i = 0; i < stops.length - 1; i++) {
    if (t >= stops[i][0] && t <= stops[i + 1][0]) {
      lo = stops[i];
      hi = stops[i + 1];
      break;
    }
  }
  const span = hi[0] - lo[0] || 1;
  const localT = (t - lo[0]) / span;
  const hexToRgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [r1, g1, b1] = hexToRgb(lo[1]);
  const [r2, g2, b2] = hexToRgb(hi[1]);
  const mix = (a: number, b: number) => Math.round(a + (b - a) * localT);
  return `rgb(${mix(r1, r2)},${mix(g1, g2)},${mix(b1, b2)})`;
}

export default function OrigenMap({
  conteo,
  detalle,
}: {
  conteo: Record<string, number>;
  detalle: Record<string, OrigenDetalleUnidad[]>;
}) {
  const [seleccionado, setSeleccionado] = useState<string | null>(null);
  const maxOrigen = Math.max(1, ...Object.values(conteo));
  const ordenados = Object.entries(conteo).sort((a, b) => b[1] - a[1]);

  const infoSeleccionado = seleccionado ? ESTADOS_PATHS.find((e) => e.code === seleccionado) : null;
  const unidadesSeleccionado = seleccionado ? detalle[seleccionado] ?? [] : [];

  return (
    <div className="space-y-5">
      <div className="overflow-x-auto rounded-lg border border-border bg-white">
        <svg viewBox={VIEWBOX} className="w-full min-w-[820px]" style={{ height: "clamp(420px, 55vw, 640px)" }}>
          {ESTADOS_PATHS.map((e) => {
            const n = conteo[e.code] ?? 0;
            const activo = seleccionado === e.code;
            return (
              <path
                key={e.code}
                d={e.d}
                fill={colorPorIntensidad(n, maxOrigen)}
                stroke={activo ? "var(--brand-blue-700)" : "white"}
                strokeWidth={activo ? 2.5 : 1}
                fillRule="evenodd"
                onClick={() => setSeleccionado(activo ? null : e.code)}
                className="cursor-pointer transition-[stroke-width]"
              >
                <title>
                  {e.nombre}: {n} unidad{n === 1 ? "" : "es"} (clic para ver el detalle)
                </title>
              </path>
            );
          })}
          {ESTADOS_PATHS.map((e) => {
            const n = conteo[e.code] ?? 0;
            if (n <= 0) return null;
            return (
              <text
                key={`lbl-${e.code}`}
                x={e.cx}
                y={e.cy}
                fontSize="13"
                fontWeight="700"
                fill="white"
                textAnchor="middle"
                className="pointer-events-none select-none"
                style={{ paintOrder: "stroke", stroke: "rgba(0,0,0,0.35)", strokeWidth: 2.5 }}
              >
                {n}
              </text>
            );
          })}
        </svg>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2">
          <p className="text-xs font-medium text-ink-muted uppercase tracking-wide mb-2">
            Ranking de origen — clic para ver detalle
          </p>
          <ul className="space-y-1.5 max-h-[420px] overflow-y-auto pr-2">
            {ordenados.map(([code, n]) => {
              const info = ESTADOS_PATHS.find((e) => e.code === code);
              const activo = seleccionado === code;
              return (
                <li key={code}>
                  <button
                    onClick={() => setSeleccionado(activo ? null : code)}
                    className={`w-full flex items-center justify-between text-sm rounded-lg px-2.5 py-1.5 transition-colors ${
                      activo ? "bg-brand-blue-50 ring-1 ring-brand-blue-500" : "hover:bg-surface-muted"
                    }`}
                  >
                    <span className="text-ink-primary flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: colorPorIntensidad(n, maxOrigen) }}
                      />
                      {info?.nombre ?? code}
                      <span className="text-ink-muted">({code})</span>
                    </span>
                    <span className="font-semibold text-brand-blue-700">{n}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="lg:col-span-3 rounded-lg border border-border bg-surface-muted/60 p-4 min-h-[200px]">
          {!seleccionado ? (
            <p className="text-sm text-ink-muted flex items-center justify-center h-full min-h-[180px] text-center">
              Haz clic en un estado del mapa o de la lista para ver el detalle de sus unidades.
            </p>
          ) : (
            <>
              <div className="flex items-center justify-between mb-3">
                <p className="font-semibold text-ink-primary text-sm">
                  {infoSeleccionado?.nombre ?? seleccionado}
                  <span className="text-ink-muted font-normal"> — {unidadesSeleccionado.length} unidad(es)</span>
                </p>
                <button onClick={() => setSeleccionado(null)} className="text-xs text-ink-muted hover:text-ink-primary">
                  Cerrar
                </button>
              </div>
              <ul className="divide-y divide-border bg-white rounded-lg border border-border overflow-hidden">
                {unidadesSeleccionado.map((u) => (
                  <li key={u.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                    <div className="min-w-0">
                      <Link href={`/embarques/${u.id}`} className="text-sm font-medium text-ink-primary hover:text-brand-blue-700 truncate block">
                        {u.equipoDescripcion}
                      </Link>
                      <p className="text-xs text-ink-muted truncate">
                        {u.cliente} · Serie {u.serie} · {u.origenCiudad}
                      </p>
                    </div>
                    <StatusBadge estatus={u.estatus} />
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
