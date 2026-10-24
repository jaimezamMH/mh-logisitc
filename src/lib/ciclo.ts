import { ESTATUS_FLOW, formatFecha } from "./constants";

export interface EventoConFecha {
  id: string;
  estatusNuevo: string;
  fecha: Date;
}

export interface TimelineStep {
  key: string;
  label: string;
  fechaLabel: string | null;
  estado: "completado" | "actual" | "pendiente" | "cancelado";
}

/**
 * Línea de tiempo de etapas de UNA unidad (para EstatusTimeline): a qué
 * etapa llegó, cuándo, y si ya pasó / es la actual / sigue pendiente.
 * "Pendiente" normalmente no tiene un StatusEvent explícito (es el estatus
 * inicial al crear la unidad), así que usa fechaInicio/createdAt como fallback.
 */
export function calcularTimelineEstatus(
  statusEvents: { estatusNuevo: string; fecha: Date }[],
  estatusActual: string,
  fechaInicio: Date | null,
  createdAt: Date | null
): TimelineStep[] {
  const fechaPorEtapa = new Map<string, Date>();
  for (const ev of [...statusEvents].sort((a, b) => a.fecha.getTime() - b.fecha.getTime())) {
    if (!fechaPorEtapa.has(ev.estatusNuevo)) fechaPorEtapa.set(ev.estatusNuevo, ev.fecha);
  }
  if (!fechaPorEtapa.has("Pendiente")) {
    const fallback = fechaInicio ?? createdAt;
    if (fallback) fechaPorEtapa.set("Pendiente", fallback);
  }

  const cancelado = estatusActual === "Cancelado";
  const flujoPrincipal = ESTATUS_FLOW.filter((e) => e.key !== "Cancelado");
  const indiceActual = flujoPrincipal.findIndex((e) => e.key === estatusActual);

  const steps: TimelineStep[] = flujoPrincipal.map((e, i) => {
    const fecha = fechaPorEtapa.get(e.key) ?? null;
    let estado: TimelineStep["estado"];
    if (cancelado) estado = fecha ? "completado" : "pendiente";
    else if (i < indiceActual) estado = "completado";
    else if (i === indiceActual) estado = "actual";
    else estado = "pendiente";
    return { key: e.key, label: e.label, fechaLabel: fecha ? formatFecha(fecha) : null, estado };
  });

  if (cancelado) {
    const fechaCancelado = fechaPorEtapa.get("Cancelado") ?? null;
    steps.push({
      key: "Cancelado",
      label: "Cancelado",
      fechaLabel: fechaCancelado ? formatFecha(fechaCancelado) : null,
      estado: "cancelado",
    });
  }

  return steps;
}

export interface DuracionEtapa {
  eventoId: string;
  estatus: string;
  dias: number;
  enCurso: boolean;
}

/**
 * A partir del historial de estatus de UNA unidad (en cualquier orden),
 * regresa cuántos días duró en cada etapa: se compara cada evento con el
 * siguiente en el tiempo (o con la fecha de entrega / hoy si es el último).
 */
export function calcularDuracionPorEtapa(
  eventos: EventoConFecha[],
  fechaEntrega: Date | null
): DuracionEtapa[] {
  const asc = [...eventos].sort((a, b) => a.fecha.getTime() - b.fecha.getTime());
  return asc.map((e, i) => {
    const siguienteFecha = asc[i + 1]?.fecha ?? fechaEntrega ?? new Date();
    const dias = Math.max(0, Math.round((siguienteFecha.getTime() - e.fecha.getTime()) / 86400000));
    const enCurso = i === asc.length - 1 && !fechaEntrega;
    return { eventoId: e.id, estatus: e.estatusNuevo, dias, enCurso };
  });
}

/**
 * Igual que calcularDuracionPorEtapa(), pero para cuando se va a PROMEDIAR
 * entre varias unidades (Reportes/Analítica) — si por un movimiento
 * duplicado o un error de captura una unidad tiene la misma etapa repetida
 * más de una vez, aquí solo cuenta la primera, para que una sola unidad
 * nunca aporte más de un dato por etapa al promedio general.
 */
export function calcularDuracionPorEtapaUnica(
  eventos: EventoConFecha[],
  fechaEntrega: Date | null
): DuracionEtapa[] {
  const vistos = new Set<string>();
  const unicas: DuracionEtapa[] = [];
  for (const d of calcularDuracionPorEtapa(eventos, fechaEntrega)) {
    if (vistos.has(d.estatus)) continue;
    vistos.add(d.estatus);
    unicas.push(d);
  }
  return unicas;
}
