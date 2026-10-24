import { Card, CardHeader, EmptyState } from "@/components/ui";
import { estatusInfo } from "@/lib/constants";

type Fila = { estatus: string; promedioDias: number | null; n: number; enCurso?: number };

// Texto corto y determinístico (no IA) que explica qué significa el dato
// más alto de la lista — mismo patrón que analisisCiclo() en Reportes.
function analizarTiempoPorEtapa(data: Fila[]) {
  const validas = data.filter((d): d is Fila & { promedioDias: number } => d.promedioDias != null && d.n > 0);
  if (validas.length === 0) return null;
  const top = validas[0]; // ya viene ordenado de mayor a menor promedio
  const segundo = validas[1];

  let texto = `"${top.estatus}" es, por mucho, donde más se tardan los equipos: en promedio ${top.promedioDias} día${top.promedioDias === 1 ? "" : "s"}, contando ${top.n} equipo${top.n === 1 ? "" : "s"} que ya salió de ahí. Es la etapa donde más conviene enfocar esfuerzos para acelerar la entrega.`;
  if (segundo) {
    texto += ` Le sigue "${segundo.estatus}", con ${segundo.promedioDias} día${segundo.promedioDias === 1 ? "" : "s"} en promedio.`;
  }
  return texto;
}

export default function TiempoPorEtapaCard({
  data,
  subtitle,
  emptyText = "Todavía no hay suficientes cambios de estatus capturados para calcular esto.",
}: {
  data: Fila[];
  subtitle: string;
  emptyText?: string;
}) {
  const maxEtapaDias = Math.max(1, ...data.map((e) => e.promedioDias).filter((d): d is number => d != null));
  const analisis = analizarTiempoPorEtapa(data);

  return (
    <Card>
      <CardHeader title="Tiempo promedio por etapa" subtitle={subtitle} />
      <div className="p-5 space-y-4">
        {data.length === 0 ? (
          <EmptyState text={emptyText} />
        ) : (
          <>
            <p className="text-sm text-ink-secondary bg-surface-muted rounded-lg px-3 py-2.5">
              <span className="font-semibold text-ink-primary">¿Cómo leer esto? </span>
              Cada etapa es un paso del proceso (Pendiente → Flete USA → Parking/Patio → Importación/Aduana →
              Agencia → Flete México → Entregado). El número de días es el <span className="font-medium">promedio
              de tiempo</span> que un equipo se quedó en esa etapa antes de pasar a la siguiente — contando solo
              equipos que YA la completaron ("ya resueltas"); los que siguen ahí mismo en este momento no cuentan
              todavía porque no se sabe cuánto van a durar en total. Mientras más larga la barra, más tiempo se
              quedan ahí en promedio: es donde el proceso se "atora" más.
            </p>

            <ul className="space-y-3">
              {data.map((e) => {
                const info = estatusInfo(e.estatus);
                const pct = e.promedioDias != null ? Math.max(6, (e.promedioDias / maxEtapaDias) * 100) : 0;
                return (
                  <li key={e.estatus}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-ink-primary font-medium">{info.label}</span>
                      <span className="text-ink-secondary">
                        {e.promedioDias != null
                          ? `${e.promedioDias} día${e.promedioDias === 1 ? "" : "s"} promedio · ${e.n} ya resuelta${e.n === 1 ? "" : "s"}`
                          : "Sin promedio todavía"}
                        {!!e.enCurso && e.enCurso > 0 && (
                          <span className="text-ink-muted"> · {e.enCurso} en curso ahora</span>
                        )}
                      </span>
                    </div>
                    <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: info.solid }} />
                    </div>
                  </li>
                );
              })}
            </ul>

            {analisis && (
              <p className="text-sm text-ink-secondary bg-brand-blue-50 border border-brand-blue-100 rounded-lg px-3 py-2.5">
                {analisis}
              </p>
            )}
          </>
        )}
      </div>
    </Card>
  );
}
