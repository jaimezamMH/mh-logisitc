import TopBar from "@/components/TopBar";
import { Card, CardHeader, EmptyState, StatCard } from "@/components/ui";
import CicloPorMesChart from "@/components/charts/CicloPorMesChart";
import PrintButton from "@/components/PrintButton";
import IndiceComplejidadCard from "@/components/IndiceComplejidadCard";
import TiempoPorEtapaCard from "@/components/TiempoPorEtapaCard";
import {
  getCicloPromedioPorMes,
  getCostosPromedio2026,
  getCostosPromedioPorCategoria,
  getIndiceComplejidad,
  getRendimientoProveedores,
  getTiempoPromedioPorEtapa,
} from "@/lib/queries";
import { formatMXN } from "@/lib/constants";
import { CalendarClock, Truck, Building2, Wrench } from "lucide-react";

export const dynamic = "force-dynamic";

// Texto corto y determinístico (no IA) sobre concentración de proveedores y
// diferencias de costo, para que Jaime tenga una lectura rápida de qué
// conviene revisar — mismo patrón ya usado en Reportes (analisisCiclo).
function analizarConcepto(filas: { proveedor: string; n: number; promedio: number }[], etiqueta: string) {
  if (filas.length === 0) return `${etiqueta}: todavía no hay suficientes costos capturados para analizar.`;
  const totalN = filas.reduce((a, f) => a + f.n, 0);
  const top = filas[0]; // ya viene ordenado por número de movimientos, de mayor a menor
  const pctTop = totalN > 0 ? Math.round((top.n / totalN) * 100) : 0;
  let texto = `${etiqueta}: "${top.proveedor}" concentra ${pctTop}% de los movimientos (${top.n} de ${totalN}), con un costo promedio de ${formatMXN(top.promedio)}.`;

  const conVarios = filas.filter((f) => f.n >= 2);
  if (conVarios.length >= 2) {
    const masBarato = [...conVarios].sort((a, b) => a.promedio - b.promedio)[0];
    const masCaro = [...conVarios].sort((a, b) => b.promedio - a.promedio)[0];
    if (masBarato.proveedor !== masCaro.proveedor && masCaro.promedio > 0) {
      const diffPct = Math.round(((masCaro.promedio - masBarato.promedio) / masCaro.promedio) * 100);
      if (diffPct >= 10) {
        texto += ` "${masBarato.proveedor}" tiene el costo promedio más bajo (${formatMXN(masBarato.promedio)}) frente a "${masCaro.proveedor}" (${formatMXN(masCaro.promedio)}, ${diffPct}% más caro) — vale la pena comparar si se puede mover más volumen al más económico sin sacrificar servicio.`;
      }
    }
  }

  if (pctTop >= 60) {
    texto += ` La dependencia de un solo proveedor es alta; conviene tener al menos una alternativa calificada por si falla o sube precios.`;
  }

  return texto;
}

function TablaRendimientoProveedor({
  titulo,
  subtitulo,
  filas,
}: {
  titulo: string;
  subtitulo: string;
  filas: { proveedor: string; n: number; promedio: number }[];
}) {
  return (
    <Card>
      <CardHeader title={titulo} subtitle={subtitulo} />
      {filas.length === 0 ? (
        <EmptyState text="Aún no hay costos capturados." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-ink-muted border-b border-border">
                <th className="px-5 py-2.5 font-medium">Proveedor</th>
                <th className="px-5 py-2.5 font-medium text-right">Movimientos</th>
                <th className="px-5 py-2.5 font-medium text-right">Costo promedio</th>
              </tr>
            </thead>
            <tbody>
              {filas.slice(0, 25).map((p) => (
                <tr key={p.proveedor} className="border-b border-border last:border-0 hover:bg-surface-muted">
                  <td className="px-5 py-2.5 font-medium text-ink-primary">{p.proveedor}</td>
                  <td className="px-5 py-2.5 text-right">{p.n}</td>
                  <td className="px-5 py-2.5 text-right">{formatMXN(p.promedio)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

export default async function AnaliticaPage() {
  const [ciclo, proveedores, costos, tiempoPorEtapa, costosPorCategoria, complejidad] = await Promise.all([
    getCicloPromedioPorMes(),
    getRendimientoProveedores(),
    getCostosPromedio2026(),
    getTiempoPromedioPorEtapa(),
    getCostosPromedioPorCategoria(),
    getIndiceComplejidad(),
  ]);

  const proveedoresFleteUSA = proveedores.filter((p) => p.rol === "Flete USA");
  const proveedoresAgenteAduanal = proveedores.filter((p) => p.rol === "Agente Aduanal");

  const cicloGeneral = ciclo.length
    ? Math.round((ciclo.reduce((a, c) => a + (c.promedioDias ?? 0) * c.cantidad, 0) / ciclo.reduce((a, c) => a + c.cantidad, 0)) * 10) / 10
    : null;

  return (
    <>
      <TopBar title="Analítica" subtitle="Tiempo de ciclo, proveedores y costos 2026" />
      <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
        <div className="no-print flex justify-end">
          <PrintButton />
        </div>

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

        <TiempoPorEtapaCard
          data={tiempoPorEtapa}
          subtitle="Dónde se detienen más los procesos — el promedio solo cuenta unidades que YA salieron de esa etapa; las que siguen ahí mismo en este momento se muestran aparte, como 'en curso', porque todavía no se sabe cuánto van a durar en total"
          emptyText="Todavía no hay suficientes cambios de estatus capturados en la app para calcular esto. Se va llenando conforme muevan unidades de una etapa a otra."
        />

        <Card>
          <CardHeader
            title="Costo promedio por categoría de equipo"
            subtitle="Flete USA, Importación, Flete México y Maniobra/Reparación promedio, según el tipo de máquina"
          />
          {costosPorCategoria.length === 0 ? (
            <EmptyState text="Aún no hay unidades con categoría y costos capturados." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-ink-muted border-b border-border">
                    <th className="px-5 py-2.5 font-medium">Categoría</th>
                    <th className="px-5 py-2.5 font-medium text-right">Unidades</th>
                    <th className="px-5 py-2.5 font-medium text-right">Flete USA prom.</th>
                    <th className="px-5 py-2.5 font-medium text-right">Importación prom.</th>
                    <th className="px-5 py-2.5 font-medium text-right">Flete Mx prom.</th>
                    <th className="px-5 py-2.5 font-medium text-right">Maniobra prom.</th>
                    <th className="px-5 py-2.5 font-medium text-right">Costo total prom.</th>
                  </tr>
                </thead>
                <tbody>
                  {costosPorCategoria.map((c) => (
                    <tr key={c.categoria} className="border-b border-border last:border-0 hover:bg-surface-muted">
                      <td className="px-5 py-2.5 font-medium text-ink-primary">{c.categoria}</td>
                      <td className="px-5 py-2.5 text-right">{c.n}</td>
                      <td className="px-5 py-2.5 text-right">
                        {c.fleteUSA.n > 0 ? formatMXN(c.fleteUSA.promedio) : "—"}
                      </td>
                      <td className="px-5 py-2.5 text-right">
                        {c.importacion.n > 0 ? formatMXN(c.importacion.promedio) : "—"}
                      </td>
                      <td className="px-5 py-2.5 text-right">
                        {c.fleteMx.n > 0 ? formatMXN(c.fleteMx.promedio) : "—"}
                      </td>
                      <td className="px-5 py-2.5 text-right">
                        {c.maniobras.n > 0 ? formatMXN(c.maniobras.promedio) : "—"}
                      </td>
                      <td className="px-5 py-2.5 text-right font-semibold text-ink-primary">
                        {c.costoTotalPromedio > 0 ? formatMXN(c.costoTotalPromedio) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <IndiceComplejidadCard
          resumen={complejidad.resumen}
          porCategoria={complejidad.porCategoria}
          subtitle="1 = corto y simple · 2 = trayecto largo (>1500 millas) · 3 = necesita cama baja — histórico completo"
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TablaRendimientoProveedor
            titulo="Rendimiento por proveedor — Flete USA"
            subtitulo="Promedio de costo y número de movimientos por proveedor de flete USA"
            filas={proveedoresFleteUSA}
          />
          <TablaRendimientoProveedor
            titulo="Rendimiento por proveedor — Agente Aduanal"
            subtitulo="Promedio de costo y número de movimientos por agente aduanal"
            filas={proveedoresAgenteAduanal}
          />
        </div>

        <Card>
          <CardHeader title="Análisis y oportunidades de mejora" subtitle="Lectura rápida de concentración de proveedores y diferencias de costo" />
          <div className="p-5 space-y-2.5">
            <p className="text-sm text-ink-secondary">{analizarConcepto(proveedoresFleteUSA, "Flete USA")}</p>
            <p className="text-sm text-ink-secondary">{analizarConcepto(proveedoresAgenteAduanal, "Agente Aduanal")}</p>
          </div>
        </Card>
      </main>
    </>
  );
}
