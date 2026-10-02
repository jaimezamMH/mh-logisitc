import Link from "next/link";
import { Truck, Landmark, Wrench, Ship, Signpost, X } from "lucide-react";
import TopBar from "@/components/TopBar";
import { Card, CardHeader, EmptyState, StatusBadge, SerieTag, ClockBadge } from "@/components/ui";
import PrintButton from "@/components/PrintButton";
import ConfirmSubmitButton from "@/components/ConfirmSubmitButton";
import { getReporteDiario, getReporteRango } from "@/lib/queries";
import { formatFecha, formatMXN } from "@/lib/constants";
import { createComment, updateComment, deleteComment } from "@/lib/actions";

const MAX_COMENTARIOS_POR_UNIDAD = 3;

function CostosPorConcepto({ costos }: { costos: { fleteUSA: number; importacion: number; maniobras: number; fleteMx: number; permiso: number } }) {
  const total = costos.fleteUSA + costos.importacion + costos.maniobras + costos.fleteMx + costos.permiso;
  const conceptos = [
    { label: "Flete USA", value: costos.fleteUSA, icon: Truck },
    { label: "Importación / Aduana", value: costos.importacion, icon: Landmark },
    { label: "Maniobra/Reparación", value: costos.maniobras, icon: Wrench },
    { label: "Flete México", value: costos.fleteMx, icon: Ship },
    { label: "Permiso/Seguro", value: costos.permiso, icon: Signpost },
  ];
  return (
    <Card>
      <CardHeader title="Costo por concepto" />
      <div className="p-5 grid grid-cols-2 sm:grid-cols-5 gap-4">
        {conceptos.map((c) => (
          <div key={c.label} className="rounded-lg border border-border p-3">
            <c.icon size={16} className="text-brand-blue-600 mb-1.5" />
            <p className="text-lg font-semibold text-ink-primary">{formatMXN(c.value)}</p>
            <p className="text-xs text-ink-muted mt-0.5">{c.label}</p>
          </div>
        ))}
        <div className="rounded-lg border border-brand-navy bg-brand-navy/5 p-3">
          <p className="text-lg font-semibold text-ink-primary">{formatMXN(total)}</p>
          <p className="text-xs text-ink-muted mt-0.5">Total</p>
        </div>
      </div>
    </Card>
  );
}

function analisisCiclo(etapasPromedio: { estatus: string; promedioDias: number; n: number }[], cicloPromedioDias: number | null) {
  const top = etapasPromedio[0];
  if (!top) return null;
  const pct = cicloPromedioDias && cicloPromedioDias > 0 ? Math.round((top.promedioDias / cicloPromedioDias) * 100) : null;
  let texto = `La etapa que más tiempo tomó fue "${top.estatus}", con un promedio de ${top.promedioDias} días${
    pct ? ` (~${pct}% del ciclo total)` : ""
  }.`;
  if (top.estatus === "Agencia") {
    texto += " Esto confirma que buena parte del tiempo se va en el taller/reparación antes de la entrega final — ahí es donde conviene enfocar esfuerzos para acortar el ciclo.";
  } else {
    texto += " Ahí es donde conviene enfocar esfuerzos para acortar el ciclo total.";
  }
  return texto;
}

function AnalisisDeCiclo({
  cicloPromedioDias,
  etapasPromedio,
}: {
  cicloPromedioDias: number | null;
  etapasPromedio: { estatus: string; promedioDias: number; n: number }[];
}) {
  return (
    <Card>
      <CardHeader title="Análisis de ciclo de entrega" subtitle="De las unidades entregadas en este periodo" />
      <div className="p-5 space-y-4">
        {cicloPromedioDias == null ? (
          <EmptyState text="No hay unidades entregadas en este periodo para calcular el ciclo." />
        ) : (
          <>
            <div>
              <p className="text-3xl font-semibold text-ink-primary">{cicloPromedioDias} días</p>
              <p className="text-xs text-ink-muted">Ciclo promedio de compra a entrega</p>
            </div>

            {etapasPromedio.length > 0 ? (
              <div className="space-y-3">
                {etapasPromedio.map((e, i) => {
                  const max = etapasPromedio[0].promedioDias;
                  const pct = max > 0 ? Math.round((e.promedioDias / max) * 100) : 0;
                  return (
                    <div key={e.estatus}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className={i === 0 ? "font-semibold text-ink-primary" : "text-ink-secondary"}>{e.estatus}</span>
                        <span className="text-ink-muted">{e.promedioDias} días</span>
                      </div>
                      <div className="h-2 rounded-full bg-surface-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full ${i === 0 ? "bg-brand-orange-500" : "bg-brand-blue-400"}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
                <p className="text-sm text-ink-secondary bg-surface-muted rounded-lg px-3 py-2.5">
                  {analisisCiclo(etapasPromedio, cicloPromedioDias)}
                </p>
              </div>
            ) : (
              <p className="text-sm text-ink-muted">
                Todavía no hay suficiente historial de movimiento por etapa en este periodo para identificar en qué proceso se atoran más las unidades — esto se va llenando conforme se muevan las unidades de etapa en etapa desde la app (cada clic en &quot;Mover a la siguiente etapa&quot; queda registrado con fecha real).
              </p>
            )}
          </>
        )}
      </div>
    </Card>
  );
}

export const dynamic = "force-dynamic";

function startOfWeek(d: Date) {
  const x = new Date(d);
  const day = x.getUTCDay() === 0 ? 7 : x.getUTCDay();
  x.setUTCDate(x.getUTCDate() - (day - 1));
  x.setUTCHours(0, 0, 0, 0);
  return x;
}
function endOfWeek(d: Date) {
  const x = startOfWeek(d);
  x.setUTCDate(x.getUTCDate() + 6);
  x.setUTCHours(23, 59, 59, 999);
  return x;
}
function startOfMonth(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}
function endOfMonth(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0, 23, 59, 59, 999));
}
function numeroSemana(d: Date) {
  const inicioAnio = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const dias = Math.floor((d.getTime() - inicioAnio.getTime()) / 86400000);
  return Math.ceil((dias + inicioAnio.getUTCDay() + 1) / 7);
}

const MESES_ES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

function listaSemanas(hoy: Date, cantidad = 26) {
  const semanas = [];
  for (let i = 0; i < cantidad; i++) {
    const inicio = startOfWeek(hoy);
    inicio.setUTCDate(inicio.getUTCDate() - 7 * i);
    const fin = endOfWeek(inicio);
    const value = inicio.toISOString().slice(0, 10);
    const label = `Semana ${numeroSemana(inicio)} · ${formatFecha(inicio)} – ${formatFecha(fin)}`;
    semanas.push({ value, label });
  }
  return semanas;
}

function listaMeses(hoy: Date, cantidad = 18) {
  const meses = [];
  for (let i = 0; i < cantidad; i++) {
    const d = new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth() - i, 1));
    const value = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    const label = `${MESES_ES[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
    meses.push({ value, label });
  }
  return meses;
}

export default async function ReportesPage({
  searchParams,
}: {
  searchParams: Promise<{ vista?: string; semana?: string; mes?: string }>;
}) {
  const { vista = "diario", semana, mes } = await searchParams;
  const hoy = new Date();

  const semanaInicio = semana ? startOfWeek(new Date(`${semana}T12:00:00Z`)) : startOfWeek(hoy);
  const semanaFin = endOfWeek(semanaInicio);

  let mesInicio: Date;
  if (mes && /^\d{4}-\d{2}$/.test(mes)) {
    const [y, m] = mes.split("-").map(Number);
    mesInicio = new Date(Date.UTC(y, m - 1, 1));
  } else {
    mesInicio = startOfMonth(hoy);
  }
  const mesFin = endOfMonth(mesInicio);

  const diario = await getReporteDiario(hoy);
  const semanal = vista === "semanal" ? await getReporteRango(semanaInicio, semanaFin) : null;
  const mensual = vista === "mensual" ? await getReporteRango(mesInicio, mesFin) : null;

  const tabs = [
    { key: "diario", label: "Cierre diario" },
    { key: "semanal", label: "Cierre semanal" },
    { key: "mensual", label: "Cierre mensual" },
  ];

  const activo = vista === "semanal" ? semanal : vista === "mensual" ? mensual : null;

  return (
    <>
      <TopBar title="Reportes" subtitle="Cierre diario, semanal y mensual para dirección" />
      <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
        <div className="no-print flex items-center justify-between flex-wrap gap-3">
          <div className="flex gap-2">
            {tabs.map((t) => (
              <Link
                key={t.key}
                href={`/reportes?vista=${t.key}`}
                className={`rounded-lg px-4 py-2 text-sm font-medium border ${
                  vista === t.key ? "bg-brand-navy text-white border-brand-navy" : "border-border text-ink-secondary hover:bg-surface-muted"
                }`}
              >
                {t.label}
              </Link>
            ))}
          </div>
          <PrintButton />
        </div>

        {vista === "semanal" && (
          <form className="no-print flex items-center gap-2 flex-wrap">
            <input type="hidden" name="vista" value="semanal" />
            <select
              name="semana"
              defaultValue={semanaInicio.toISOString().slice(0, 10)}
              className="rounded-lg border border-border px-3 py-2 text-sm"
            >
              {listaSemanas(hoy).map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            <button className="rounded-lg bg-brand-navy text-white text-sm font-medium px-4 py-2 hover:opacity-90">
              Ver
            </button>
          </form>
        )}

        {vista === "mensual" && (
          <form className="no-print flex items-center gap-2 flex-wrap">
            <input type="hidden" name="vista" value="mensual" />
            <select
              name="mes"
              defaultValue={`${mesInicio.getUTCFullYear()}-${String(mesInicio.getUTCMonth() + 1).padStart(2, "0")}`}
              className="rounded-lg border border-border px-3 py-2 text-sm capitalize"
            >
              {listaMeses(hoy).map((m) => (
                <option key={m.value} value={m.value} className="capitalize">
                  {m.label}
                </option>
              ))}
            </select>
            <button className="rounded-lg bg-brand-navy text-white text-sm font-medium px-4 py-2 hover:opacity-90">
              Ver
            </button>
          </form>
        )}

        {vista === "diario" && (
          <>
            <Card className="border-l-4 border-l-brand-orange-500">
              <div className="p-5">
                <p className="text-xs uppercase tracking-wide text-ink-muted">Resumen para dirección</p>
                <p className="text-lg font-semibold text-ink-primary capitalize">{formatFecha(hoy)}</p>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mt-4">
                  <div>
                    <p className="text-2xl font-semibold text-ink-primary">{diario.eventos.length}</p>
                    <p className="text-xs text-ink-muted">Movimientos de estatus</p>
                  </div>
                  <div>
                    <p className="text-2xl font-semibold text-ink-primary">{diario.entregasHoy.length}</p>
                    <p className="text-xs text-ink-muted">Entregas cerradas hoy</p>
                  </div>
                  <div>
                    <p className="text-2xl font-semibold text-ink-primary">{diario.ordenesGeneradas.length}</p>
                    <p className="text-xs text-ink-muted">Órdenes de pago generadas</p>
                  </div>
                  <div>
                    <p className="text-2xl font-semibold text-ink-primary">{formatMXN(diario.totalPagado)}</p>
                    <p className="text-xs text-ink-muted">Monto solicitado hoy</p>
                  </div>
                  <div>
                    <p className="text-2xl font-semibold text-ink-primary">{formatMXN(diario.costoTotalUSD)}</p>
                    <p className="text-xs text-ink-muted">Costo total en USD (entregas de hoy)</p>
                  </div>
                </div>
              </div>
            </Card>

            <CostosPorConcepto costos={diario.costosPorConcepto} />

            <Card>
              <CardHeader title="Movimientos del día" />
              {diario.eventos.length === 0 ? (
                <EmptyState text="Sin movimientos registrados hoy." />
              ) : (
                <ul className="divide-y divide-border">
                  {diario.eventos.map((e) => (
                    <li key={e.id} className="px-5 py-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm text-ink-primary flex items-center gap-2 flex-wrap">
                          <span>{e.shipment.equipoDescripcion} — {e.shipment.cliente}</span>
                          <SerieTag serie={e.shipment.serie} />
                        </p>
                        <p className="text-xs text-ink-muted">
                          {e.estatusAnterior ? `${e.estatusAnterior} → ` : ""}
                          {e.estatusNuevo} · {e.usuario ?? "Sistema"}
                        </p>
                      </div>
                      <StatusBadge estatus={e.estatusNuevo} />
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card>
              <CardHeader
                title="Equipos en operación"
                subtitle={`${diario.unidadesEnOperacion.length} unidad${diario.unidadesEnOperacion.length === 1 ? "" : "es"} activas por estatus`}
              />
              {diario.unidadesEnOperacion.length === 0 ? (
                <EmptyState text="No hay unidades en operación." />
              ) : (
                <ul className="divide-y divide-border">
                  {diario.unidadesEnOperacion.map((s) => {
                    const comentariosUnidad = diario.comentarios.filter((c) => c.shipmentId === s.id);
                    return (
                      <li key={s.id} className="px-5 py-3 space-y-2">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm text-ink-primary flex items-center gap-2 flex-wrap">
                              <span>
                                {s.equipoDescripcion} — {s.cliente}
                                {s.vendedor && <span className="text-ink-muted"> ({s.vendedor})</span>}
                              </span>
                              <SerieTag serie={s.serie} />
                            </p>
                            <p className="text-xs text-ink-muted flex items-center gap-2">
                              <span>{s.folio}</span>
                              <ClockBadge fechaInicio={s.fechaInicio} fechaEntrega={s.fechaEntrega} tiempoCicloDias={s.tiempoCicloDias} />
                            </p>
                          </div>
                          <StatusBadge estatus={s.estatus} />
                        </div>

                        {comentariosUnidad.length > 0 && (
                          <ul className="space-y-1.5">
                            {comentariosUnidad.map((c) => (
                              <li key={c.id} className="flex items-center gap-1.5">
                                <form action={updateComment} className="flex-1 flex items-center gap-1.5">
                                  <input type="hidden" name="id" value={c.id} />
                                  <input
                                    name="texto"
                                    defaultValue={c.texto}
                                    className="flex-1 min-w-0 text-xs text-ink-secondary bg-surface-muted rounded-lg px-2.5 py-1.5 border-0 focus:outline-none focus:ring-1 focus:ring-brand-blue-400"
                                  />
                                  <button className="no-print text-xs text-brand-blue-700 font-medium shrink-0 hover:underline">
                                    Guardar
                                  </button>
                                </form>
                                <form action={deleteComment.bind(null, c.id)} className="no-print shrink-0">
                                  <ConfirmSubmitButton
                                    confirmText="¿Eliminar este comentario?"
                                    className="text-ink-muted hover:text-red-600 flex items-center"
                                    title="Eliminar comentario"
                                  >
                                    <X size={14} />
                                  </ConfirmSubmitButton>
                                </form>
                              </li>
                            ))}
                          </ul>
                        )}

                        {comentariosUnidad.length < MAX_COMENTARIOS_POR_UNIDAD ? (
                          <form action={createComment} className="no-print flex items-center gap-2">
                            <input type="hidden" name="tipo" value="comentario" />
                            <input type="hidden" name="shipmentId" value={s.id} />
                            <input
                              name="texto"
                              required
                              placeholder="Comentario de hoy sobre esta unidad..."
                              className="flex-1 rounded-lg border border-border px-2.5 py-1.5 text-xs"
                            />
                            <button className="text-xs text-brand-blue-700 font-medium shrink-0 hover:underline">
                              Agregar
                            </button>
                          </form>
                        ) : (
                          <p className="no-print text-xs text-ink-muted italic">
                            Máximo {MAX_COMENTARIOS_POR_UNIDAD} comentarios por unidad — elimina alguno para agregar otro.
                          </p>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>

            <Card>
              <CardHeader title="Comentarios del día" />
              {diario.comentarios.length === 0 ? (
                <EmptyState text="Sin comentarios hoy." />
              ) : (
                <ul className="divide-y divide-border">
                  {diario.comentarios.map((c) => (
                    <li key={c.id} className="px-5 py-3">
                      <p className="text-sm text-ink-primary">{c.texto}</p>
                      <p className="text-xs text-ink-muted">
                        {c.autor ?? "Sin autor"} {c.shipment ? `· ${c.shipment.folio}` : ""}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </>
        )}

        {activo && (
          <>
            <Card className="border-l-4 border-l-brand-blue-600">
              <div className="p-5">
                <p className="text-xs uppercase tracking-wide text-ink-muted">Resumen para dirección</p>
                <p className="text-lg font-semibold text-ink-primary">
                  {formatFecha(activo.from)} — {formatFecha(activo.to)}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mt-4">
                  <div>
                    <p className="text-2xl font-semibold text-ink-primary">{activo.eventos.length}</p>
                    <p className="text-xs text-ink-muted">Movimientos de estatus</p>
                  </div>
                  <div>
                    <p className="text-2xl font-semibold text-ink-primary">{activo.entregas.length}</p>
                    <p className="text-xs text-ink-muted">Unidades entregadas</p>
                  </div>
                  <div>
                    <p className="text-2xl font-semibold text-ink-primary">{activo.ordenes.length}</p>
                    <p className="text-xs text-ink-muted">Órdenes de pago generadas</p>
                  </div>
                  <div>
                    <p className="text-2xl font-semibold text-ink-primary">{formatMXN(activo.totalPagado)}</p>
                    <p className="text-xs text-ink-muted">Monto total solicitado</p>
                  </div>
                  <div>
                    <p className="text-2xl font-semibold text-ink-primary">{formatMXN(activo.costoTotalUSD)}</p>
                    <p className="text-xs text-ink-muted">Costo total en USD (unidades entregadas)</p>
                  </div>
                </div>
              </div>
            </Card>

            <CostosPorConcepto costos={activo.costosPorConcepto} />

            <AnalisisDeCiclo cicloPromedioDias={activo.cicloPromedioDias} etapasPromedio={activo.etapasPromedio} />

            <Card>
              <CardHeader title="Unidades entregadas en el periodo" />
              {activo.entregas.length === 0 ? (
                <EmptyState text="Sin entregas en este periodo." />
              ) : (
                <ul className="divide-y divide-border">
                  {activo.entregas.map((s) => (
                    <li key={s.id} className="px-5 py-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm text-ink-primary flex items-center gap-2">
                          {s.equipoDescripcion}
                          <SerieTag serie={s.serie} />
                        </p>
                        <p className="text-xs text-ink-muted flex items-center gap-2">
                          <span>{s.cliente} · {s.folio}</span>
                          <ClockBadge fechaInicio={s.fechaInicio} fechaEntrega={s.fechaEntrega} tiempoCicloDias={s.tiempoCicloDias} />
                        </p>
                      </div>
                      <p className="text-xs text-ink-muted">{formatFecha(s.fechaEntrega)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </>
        )}
      </main>
    </>
  );
}
