import Link from "next/link";
import TopBar from "@/components/TopBar";
import { Card, CardHeader, EmptyState, StatCard, SerieTag } from "@/components/ui";
import CostosEditableTable from "@/components/CostosEditableTable";
import Buscador from "@/components/Buscador";
import { prisma } from "@/lib/prisma";
import { formatFecha, formatMXN, coincideBusqueda } from "@/lib/constants";
import { cancelarOrdenDePago, eliminarOrdenDePago, marcarOrdenPagada } from "@/lib/actions";
import ConfirmSubmitButton from "@/components/ConfirmSubmitButton";
import { AlertTriangle, FileClock, Layers } from "lucide-react";

export const dynamic = "force-dynamic";

function FiltroPill({
  opciones,
  actual,
  paramName,
  otrosParams,
}: {
  opciones: { valor: string; label: string }[];
  actual: string;
  paramName: string;
  otrosParams?: Record<string, string>;
}) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {opciones.map((o) => {
        const params = new URLSearchParams({ ...otrosParams, [paramName]: o.valor });
        const activo = actual === o.valor;
        return (
          <Link
            key={o.valor}
            href={`/costos?${params.toString()}#${paramName}`}
            className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
              activo
                ? "bg-brand-navy text-white border-brand-navy"
                : "border-border text-ink-secondary hover:bg-surface-muted"
            }`}
          >
            {o.label}
          </Link>
        );
      })}
    </div>
  );
}

export default async function CostosPage({
  searchParams,
}: {
  searchParams: Promise<{ ordenes?: string; unidades?: string; buscar?: string }>;
}) {
  const { ordenes: ordenesFiltroRaw, unidades: unidadesFiltroRaw, buscar } = await searchParams;
  const ordenesFiltro = ordenesFiltroRaw ?? "pendientes";
  const unidadesFiltro = unidadesFiltroRaw ?? "pendientes";

  const [shipmentsTodos, ordenesTodas] = await Promise.all([
    prisma.shipment.findMany({
      orderBy: { updatedAt: "desc" },
      include: { _count: { select: { paymentOrders: true, gastosFleteUSA: true } } },
    }),
    prisma.paymentOrder.findMany({ include: { shipment: true }, orderBy: { fechaGenerada: "desc" } }),
  ]);

  const activos = shipmentsTodos.filter((s) => s.estatus !== "Entregado");
  const sinCostos = activos.filter(
    (s) => s.costoFleteUSA + s.costoImportacion + s.costoManiobras + s.costoFleteMx + s.costoPermiso === 0
  ).length;
  const sinOrden = activos.filter((s) => s._count.paymentOrders === 0).length;

  const ordenes = ordenesTodas.filter((o) => {
    if (buscar && !coincideBusqueda(buscar, [o.shipment.equipoDescripcion, o.shipment.cliente, o.shipment.serie, o.shipment.folio])) {
      return false;
    }
    if (ordenesFiltro === "todas") return true;
    if (ordenesFiltro === "pagadas") return o.estatusPago === "Pagado";
    if (ordenesFiltro === "canceladas") return o.estatusPago === "Cancelada";
    return o.estatusPago === "Pendiente";
  });

  const shipments = shipmentsTodos.filter((s) => {
    if (buscar && !coincideBusqueda(buscar, [s.equipoDescripcion, s.cliente, s.serie, s.folio])) return false;
    if (unidadesFiltro === "todas") return true;
    if (unidadesFiltro === "entregados") return s.estatus === "Entregado";
    return s.estatus !== "Entregado";
  });

  return (
    <>
      <TopBar title="Costos y pagos" subtitle="Captura de costos por unidad y órdenes de pago" />
      <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
        <div className="flex justify-end">
          <Buscador />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            label="Unidades sin costos capturados"
            value={sinCostos}
            icon={AlertTriangle}
            tone="orange"
            hint="De las que aún no se entregan"
          />
          <StatCard
            label="Unidades sin orden generada"
            value={sinOrden}
            icon={FileClock}
            tone="gray"
            hint="De las que aún no se entregan"
          />
          <StatCard
            label="Órdenes de pago generadas"
            value={ordenesTodas.length}
            icon={Layers}
            tone="blue"
          />
        </div>

        <Card id="ordenes">
          <CardHeader
            title="Órdenes de pago generadas"
            subtitle="Requisiciones enviadas a administración"
            action={
              <FiltroPill
                paramName="ordenes"
                actual={ordenesFiltro}
                otrosParams={{ unidades: unidadesFiltro }}
                opciones={[
                  { valor: "pendientes", label: "Pendientes" },
                  { valor: "pagadas", label: "Pagadas" },
                  { valor: "canceladas", label: "Canceladas" },
                  { valor: "todas", label: "Todas" },
                ]}
              />
            }
          />
          {ordenes.length === 0 ? (
            <EmptyState text="No hay órdenes con este filtro." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-ink-muted border-b border-border">
                    <th className="px-5 py-2.5 font-medium">Folio</th>
                    <th className="px-5 py-2.5 font-medium">Unidad</th>
                    <th className="px-5 py-2.5 font-medium">Concepto</th>
                    <th className="px-5 py-2.5 font-medium">Fecha</th>
                    <th className="px-5 py-2.5 font-medium text-right">Total</th>
                    <th className="px-5 py-2.5 font-medium">Estatus</th>
                    <th className="px-5 py-2.5 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {ordenes.map((o) => (
                    <tr key={o.id} className="border-b border-border last:border-0 hover:bg-surface-muted">
                      <td className="px-5 py-2.5">
                        <Link href={`/orden-pago/${o.id}`} className="text-brand-blue-700 hover:underline font-medium">
                          {o.folio}
                        </Link>
                      </td>
                      <td className="px-5 py-2.5 text-ink-primary">
                        {o.shipment.equipoDescripcion}
                        <div className="mt-0.5">
                          <SerieTag serie={o.shipment.serie} />
                        </div>
                      </td>
                      <td className="px-5 py-2.5 text-ink-secondary">{o.concepto ?? "Todos los conceptos"}</td>
                      <td className="px-5 py-2.5 text-ink-muted">{formatFecha(o.fechaGenerada)}</td>
                      <td className="px-5 py-2.5 text-right font-medium text-ink-primary">{formatMXN(o.total)}</td>
                      <td className="px-5 py-2.5">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            o.estatusPago === "Pagado"
                              ? "bg-brand-blue-100 text-brand-blue-900"
                              : o.estatusPago === "Cancelada"
                                ? "bg-gray-200 text-gray-500"
                                : "bg-brand-orange-100 text-brand-orange-700"
                          }`}
                        >
                          {o.estatusPago}
                        </span>
                      </td>
                      <td className="px-5 py-2.5">
                        <div className="flex items-center gap-3">
                          {o.estatusPago === "Pendiente" && (
                            <>
                              <form action={marcarOrdenPagada.bind(null, o.id)}>
                                <button className="text-xs text-gray-400 hover:text-brand-blue-700" title="Marcar como pagada">
                                  Marcar pagada
                                </button>
                              </form>
                              <form action={cancelarOrdenDePago.bind(null, o.id)}>
                                <button className="text-xs text-gray-400 hover:text-red-600" title="Cancelar orden">
                                  Cancelar
                                </button>
                              </form>
                            </>
                          )}
                          <form action={eliminarOrdenDePago.bind(null, o.id)}>
                            <ConfirmSubmitButton
                              confirmText={`¿Eliminar la orden ${o.folio}? Esto no se puede deshacer.`}
                              className="text-xs text-gray-400 hover:text-red-600"
                              title="Eliminar orden"
                            >
                              Eliminar
                            </ConfirmSubmitButton>
                          </form>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card id="unidades">
          <CardHeader
            title="Costos por unidad"
            subtitle="Haz clic en el lápiz para editar los costos de una unidad aquí mismo"
            action={
              <FiltroPill
                paramName="unidades"
                actual={unidadesFiltro}
                otrosParams={{ ordenes: ordenesFiltro }}
                opciones={[
                  { valor: "pendientes", label: "Pendientes" },
                  { valor: "entregados", label: "Entregados" },
                  { valor: "todas", label: "Todas" },
                ]}
              />
            }
          />
          {shipments.length === 0 ? (
            <EmptyState text="No hay unidades con este filtro." />
          ) : (
            <CostosEditableTable
              shipments={shipments.map((s) => ({ ...s, tieneGastosFleteUSA: s._count.gastosFleteUSA > 0 }))}
            />
          )}
        </Card>
      </main>
    </>
  );
}
