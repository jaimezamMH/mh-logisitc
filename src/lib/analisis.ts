// Texto de análisis automático (no IA, lógica determinista) para el
// "Equipos en operación" del cierre diario — compartido entre /reportes y
// la vista pública de solo lectura en /publico/operacion.
export function analisisMovimientoHoy(
  estatusActual: string,
  eventosHoy: { estatusAnterior: string | null; estatusNuevo: string }[]
) {
  if (eventosHoy.length === 0) {
    return `Sigue en ${estatusActual}, sin cambios hoy.`;
  }
  const primero = eventosHoy[0];
  const ultimo = eventosHoy[eventosHoy.length - 1];
  if (eventosHoy.length === 1) {
    if (!primero.estatusAnterior) return `Se dio de alta hoy, estatus inicial ${primero.estatusNuevo}.`;
    return `Hoy avanzó de ${primero.estatusAnterior} a ${primero.estatusNuevo}.`;
  }
  const inicial = primero.estatusAnterior ?? primero.estatusNuevo;
  return `Hoy avanzó de ${inicial} a ${ultimo.estatusNuevo} (${eventosHoy.length} movimientos en el día).`;
}
