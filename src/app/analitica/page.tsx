import TopBar from "@/components/TopBar";
import { Card, CardHeader, EmptyState, StatCard } from "@/components/ui";
import CicloPorMesChart from "@/components/charts/CicloPorMesChart";
import {
  getCicloPromedioPorMes,
  getCostosPromedio2026,
  getRendimientoProveedores,
  getTiempoPromedioPorEtapa,
} from "@/lib/queries";
import { formatMXN, estatusInfo } from "@/lib/constants";
import { CalendarClock, Truck, Building2, Wrench } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AnaliticaPage() {
  const [ciclo, proveedores, costos, tiempoPorEtapa] = await Promise.all([
    getCicloPromedioPorMes(),
    getRendimientoProveedores(),
    getCostosPromedio2026(),
    getTiempoPromedioPorEtapa(),
  ]);

  const maxEtapaDias = Math.max(1, ...tiempoPorEtapa.map((e) => e.promedioDias));

  const cicloGeneral = ciclo.length
    ? Math.round((ciclo.reduce((a, c) => a + (c.promedioDias ?? 0) * c.cantidad, 0) / ciclo.reduce((a, c) => a + c.cantidad, 0)) * 10) / 10
    : null;

  return (
    <>
      <TopBar title="Analítica" subtitle="Tiempo de ciclo, proveedores y costos 2026" />
      <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard label="Ciclo promedio 2026" value={cicloGeneral ? `${cicloGeneral} días` : "—"} icon={CalendarClock} tone="navy" />
          <StatCard label="Flete USA prom." value={formatMXN(costos.fleteUSA.promedio)} icon={Truck} tone="blue" hint={`${costos.fleteUSA.n} registros`} />
          <StatCard label="Importación prom." value={formatMXN(costos.importacion.promedio)} icon={Building2} tone="orange" hint={`${costos.importacion.n} registros`} />
          <StatCard label="Flete Mx prom." value={formatMXN(costos.fleteMx.promedio)} icon={Truck} tone="gray" hint={`${costos.fleteMx.n} registros`} />
          <StatCard label="Maniobra/Reparación prom." value={formatMXN(costos.maniobras.promedio)} icon={Wrench} tone="gray" hint={`${costos.maniobras.n} registros`} />
        </div>

        <Card>
          <CardHeader title="Promedio de días en tiempo de ciclo por mes" subtitle="Desde que se compra hasta que se entrega" />
          <div className="p-5">
            {ciclo.length === 0 ? <EmptyState text="Aún no hay datos suficientes." /> : <CicloPorMesChart data={ciclo} />}
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Tiempo promedio por etapa"
            subtitle="Dónde se detienen más los procesos, según los cambios de estatus capturados en la app"
          />
          <div className="p-5">
            {tiempoPorEtapa.length === 0 ? (
              <EmptyState text="Todavía no hay suficientes cambios de estatus capturados en la app para calcular esto. Se va llenando conforme muevan unidades de una etapa a otra." />
            ) : (
              <ul className="space-y-3">
                {tiempoPorEtapa.map((e) => {
                  const info = estatusInfo(e.estatus);
                  const pct = Math.max(6, (e.promedioDias / maxEtapaDias) * 100);
                  return (
                    <li key={e.estatus}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-ink-primary font-medium">{info.label}</span>
                        <span className="text-ink-secondary">
                          {e.promedioDias} día{e.promedioDias === 1 ? "" : "s"} promedio · {e.n} movimiento{e.n === 1 ? "" : "s"}
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

        <Card>
          <CardHeader title="Rendimiento por proveedor" subtitle="Promedio de costo y número de movimientos por proveedor" />
          {proveedores.length === 0 ? (
            <EmptyState text="Aún no hay costos capturados." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-ink-muted border-b border-border">
                    <th className="px-5 py-2.5 font-medium">Proveedor</th>
                    <th className="px-5 py-2.5 font-medium">Rol</th>
                    <th className="px-5 py-2.5 font-medium text-right">Movimientos</th>
                    <th className="px-5 py-2.5 font-medium text-right">Costo promedio</th>
                  </tr>
                </thead>
                <tbody>
                  {proveedores.slice(0, 25).map((p) => (
                    <tr key={`${p.rol}-${p.proveedor}`} className="border-b border-border last:border-0 hover:bg-surface-muted">
                      <td className="px-5 py-2.5 font-medium text-ink-primary">{p.proveedor}</td>
                      <td className="px-5 py-2.5 text-ink-secondary">{p.rol}</td>
                      <td className="px-5 py-2.5 text-right">{p.n}</td>
                      <td className="px-5 py-2.5 text-right">{formatMXN(p.promedio)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </main>
    </>
  );
}
