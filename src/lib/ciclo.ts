export interface EventoConFecha {
  id: string;
  estatusNuevo: string;
  fecha: Date;
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
