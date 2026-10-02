import ical from "node-ical";

export interface EventoCalendario {
  id: string;
  titulo: string;
  inicio: Date;
  fin: Date | null;
}

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function endOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

/**
 * Lee un calendario de Google (link privado/público en formato iCal) y
 * regresa los eventos de HOY. Si no hay link configurado o falla la
 * conexión, regresa una lista vacía (no debe tronar el dashboard por esto).
 */
async function getEventosCalendarioHoy(url: string | undefined): Promise<EventoCalendario[]> {
  if (!url) return [];

  try {
    const datos = (await ical.async.fromURL(url)) as Record<string, any>;
    const hoy = new Date();
    const inicioHoy = startOfDay(hoy);
    const finHoy = endOfDay(hoy);
    const eventos: EventoCalendario[] = [];

    for (const key of Object.keys(datos)) {
      const item = datos[key];
      if (item.type !== "VEVENT") continue;

      const titulo = item.summary ? String(item.summary) : "Evento";

      if (item.rrule) {
        // Evento recurrente: buscamos si tiene alguna ocurrencia hoy.
        const ocurrencias = item.rrule.between(inicioHoy, finHoy, true);
        for (const fecha of ocurrencias) {
          eventos.push({ id: `${key}-${fecha.toISOString()}`, titulo, inicio: fecha, fin: null });
        }
        continue;
      }

      const inicio = item.start ? new Date(item.start) : null;
      if (!inicio) continue;
      if (inicio >= inicioHoy && inicio <= finHoy) {
        eventos.push({
          id: key,
          titulo,
          inicio,
          fin: item.end ? new Date(item.end) : null,
        });
      }
    }

    return eventos.sort((a, b) => a.inicio.getTime() - b.inicio.getTime());
  } catch (err) {
    console.error("No se pudo leer el calendario:", err);
    return [];
  }
}

export function getEventosCalendarioJaimeHoy(): Promise<EventoCalendario[]> {
  return getEventosCalendarioHoy(process.env.CALENDARIO_JAIME_ICS_URL);
}

export function getEventosCalendarioRaulHoy(): Promise<EventoCalendario[]> {
  return getEventosCalendarioHoy(process.env.CALENDARIO_RAUL_ICS_URL);
}
