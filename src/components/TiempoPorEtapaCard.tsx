import { Card, CardHeader, EmptyState } from "@/components/ui";
import { estatusInfo } from "@/lib/constants";

type Fila = { estatus: string; promedioDias: number | null; n: number; enCurso?: number };

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

  return (
    <Card>
      <CardHeader title="Tiempo promedio por etapa" subtitle={subtitle} />
      <div className="p-5">
        {data.length === 0 ? (
          <EmptyState text={emptyText} />
        ) : (
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
        )}
      </div>
    </Card>
  );
}
