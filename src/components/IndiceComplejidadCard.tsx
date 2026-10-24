import { Card, CardHeader, EmptyState } from "@/components/ui";

type Fila = { categoria: string; complejidad: 1 | 2 | 3; n: number };
type Resumen = { 1: number; 2: number; 3: number };

const NIVELES = [
  { nivel: 1 as const, label: "Complejidad 1", hint: "Trayecto corto (≤1500 mi), no necesita cama baja", color: "text-brand-blue-700 bg-brand-blue-50" },
  { nivel: 2 as const, label: "Complejidad 2", hint: "Trayecto largo (>1500 mi), no necesita cama baja", color: "text-brand-orange-700 bg-brand-orange-50" },
  { nivel: 3 as const, label: "Complejidad 3", hint: "Necesita cama baja (excavadora, cargador frontal, accesorios)", color: "text-red-700 bg-red-50" },
];

export default function IndiceComplejidadCard({
  resumen,
  porCategoria,
  subtitle,
}: {
  resumen: Resumen;
  porCategoria: Fila[];
  subtitle: string;
}) {
  const total = resumen[1] + resumen[2] + resumen[3];

  return (
    <Card>
      <CardHeader title="Índice de complejidad de carga" subtitle={subtitle} />
      {total === 0 ? (
        <EmptyState text="Sin unidades con categoría y millas capturadas para clasificar." />
      ) : (
        <>
          <div className="p-5 grid grid-cols-3 gap-4">
            {NIVELES.map((lvl) => (
              <div key={lvl.nivel} className={`rounded-lg p-3 ${lvl.color}`}>
                <p className="text-2xl font-semibold">{resumen[lvl.nivel]}</p>
                <p className="text-xs font-medium mt-0.5">{lvl.label}</p>
                <p className="text-xs opacity-80 mt-1">{lvl.hint}</p>
              </div>
            ))}
          </div>
          <div className="overflow-x-auto border-t border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-ink-muted border-b border-border">
                  <th className="px-5 py-2.5 font-medium">Categoría</th>
                  <th className="px-5 py-2.5 font-medium text-right">Complejidad</th>
                  <th className="px-5 py-2.5 font-medium text-right">Unidades</th>
                </tr>
              </thead>
              <tbody>
                {porCategoria.map((f) => (
                  <tr key={`${f.categoria}::${f.complejidad}`} className="border-b border-border last:border-0 hover:bg-surface-muted">
                    <td className="px-5 py-2.5 font-medium text-ink-primary">{f.categoria}</td>
                    <td className="px-5 py-2.5 text-right">{f.complejidad}</td>
                    <td className="px-5 py-2.5 text-right">{f.n}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Card>
  );
}
