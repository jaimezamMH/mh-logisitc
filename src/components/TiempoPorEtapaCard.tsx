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

  let texto = `Donde más se atoran: "${top.estatus}" (${top.promedioDias} día${top.promedioDias === 1 ? "" : "s"} prom.)`;
  if (segundo) texto += `, luego "${segundo.estatus}" (${segundo.promedioDias} día${segundo.promedioDias === 1 ? "" : "s"}).`;
  else texto += ".";
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
  // Jaime pidió quitar "Pendiente" de esta vista — no le interesa por ahora.
  const dataFiltrada = data.filter((e) => e.estatus !== "Pendiente");
  const maxEtapaDias = Math.max(1, ...dataFiltrada.map((e) => e.promedioDias).filter((d): d is number => d != null));
  const analisis = analizarTiempoPorEtapa(dataFiltrada);

  return (
    <Card>
      <CardHeader title="Tiempo promedio por etapa" subtitle={subtitle} />
      <div className="p-5 space-y-4">
        {dataFiltrada.length === 0 ? (
          <EmptyState text={emptyText} />
        ) : (
          <>
            <ul className="space-y-3">
              {dataFiltrada.map((e) => {
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

            {analisis && <p className="text-xs text-ink-secondary font-medium">{analisis}</p>}
          </>
        )}
      </div>
    </Card>
  );
}
