import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatFecha, formatMXN, formatPesos } from "@/lib/constants";
import PrintButton from "@/components/PrintButton";
import { marcarOrdenPagada, cancelarOrdenDePago, eliminarOrdenDePago } from "@/lib/actions";
import ConfirmSubmitButton from "@/components/ConfirmSubmitButton";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function OrdenPagoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await prisma.paymentOrder.findUnique({
    where: { id },
    include: { shipment: true },
  });
  if (!order) notFound();

  const s = order.shipment;

  const lineas = [
    { label: "Flete USA", valor: order.costoFleteUSA },
    { label: "Importación / Aduana", valor: order.costoImportacion },
    { label: "Maniobra/Reparación", valor: order.costoManiobras },
    { label: "Flete México", valor: order.costoFleteMx },
    { label: "Permiso/Seguro", valor: order.costoPermiso },
  ].filter((l) => l.valor > 0);

  return (
    <div className="min-h-screen bg-gray-100 print:bg-white">
      <div className="no-print sticky top-0 z-10 bg-white border-b border-border px-6 h-16 flex items-center justify-between">
        <Link href={`/embarques/${s.id}`} className="flex items-center gap-2 text-sm text-ink-secondary hover:text-ink-primary">
          <ArrowLeft size={16} />
          Volver a la unidad
        </Link>
        <div className="flex items-center gap-3">
          {order.estatusPago === "Pendiente" && (
            <>
              <form action={cancelarOrdenDePago.bind(null, order.id)}>
                <button className="rounded-lg border border-border text-sm px-4 py-2 text-gray-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200">
                  Cancelar orden
                </button>
              </form>
              <form action={marcarOrdenPagada.bind(null, order.id)}>
                <button className="rounded-lg border border-border text-sm px-4 py-2 hover:bg-surface-muted">
                  Marcar como pagada
                </button>
              </form>
            </>
          )}
          <form action={eliminarOrdenDePago.bind(null, order.id)}>
            <ConfirmSubmitButton
              confirmText={`¿Eliminar la orden ${order.folio}? Esto no se puede deshacer.`}
              className="rounded-lg border border-border text-sm px-4 py-2 text-gray-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
            >
              Eliminar
            </ConfirmSubmitButton>
          </form>
          <PrintButton />
        </div>
      </div>

      <div className="max-w-3xl mx-auto bg-white shadow-sm print:shadow-none my-8 print:my-0 p-10 print:p-5 print:text-sm">
        <div className="flex items-start justify-between border-b-4 border-brand-navy pb-6 mb-6 print:pb-3 print:mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="h-10 w-10 rounded-lg bg-brand-orange-500 flex items-center justify-center font-bold text-white">
                MH
              </div>
              <div>
                <p className="font-semibold text-lg text-ink-primary leading-tight">MH Logística</p>
                <p className="text-xs text-ink-muted leading-tight">Machinery Hunters</p>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wide text-ink-muted">Orden de pago</p>
            <p className="text-xl font-bold text-brand-navy">{order.folio}</p>
            <p className="text-xs text-ink-muted mt-1">{formatFecha(order.fechaGenerada)}</p>
            {order.concepto && <p className="text-sm font-medium text-ink-primary mt-1">{order.concepto}</p>}
            <span
              className={`inline-block mt-2 text-xs font-medium rounded-full px-3 py-1 ${
                order.estatusPago === "Pagado"
                  ? "bg-brand-blue-100 text-brand-blue-900"
                  : order.estatusPago === "Cancelada"
                    ? "bg-gray-200 text-gray-500 line-through"
                    : "bg-brand-orange-100 text-brand-orange-700"
              }`}
            >
              {order.estatusPago}
            </span>
          </div>
        </div>

        <div className="flex gap-6 mb-8 print:mb-4">
          {s.fotoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={s.fotoUrl}
              alt={s.equipoDescripcion}
              className="w-32 h-32 print:w-20 print:h-20 object-cover rounded-lg border border-border shrink-0"
            />
          )}
          <div className="grid grid-cols-2 gap-6 text-sm flex-1">
            <div>
              <p className="text-xs uppercase tracking-wide text-ink-muted mb-1">Requisición para</p>
              <p className="font-medium text-ink-primary">Administración — Machinery Hunters</p>
              <p className="text-ink-secondary mt-2">
                Solicitada por: <span className="font-medium text-ink-primary">{order.generadaPor ?? "—"}</span>
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-ink-muted mb-1">Unidad / Embarque</p>
              <p className="font-medium text-ink-primary">{s.equipoDescripcion}</p>
              <p className="text-ink-secondary">
                Cliente: {s.cliente} · Serie: {s.serie}
              </p>
              <p className="text-ink-secondary">
                Folio interno: {s.folio} {s.aduana ? `· Aduana: ${s.aduana}` : ""}
              </p>
            </div>
          </div>
        </div>

        <table className="w-full text-sm mb-6 print:mb-3">
          <thead>
            <tr className="border-b-2 border-brand-navy text-left">
              <th className="py-2 text-ink-secondary font-medium">Concepto</th>
              <th className="py-2 text-ink-secondary font-medium text-right">Monto</th>
            </tr>
          </thead>
          <tbody>
            {lineas.map((l) => (
              <tr key={l.label} className="border-b border-border">
                <td className="py-2.5 text-ink-primary">{l.label}</td>
                <td className="py-2.5 text-right text-ink-primary">{formatMXN(l.valor)}</td>
              </tr>
            ))}
            {order.detalleFleteUSA && (
              <tr className="border-b border-border">
                <td colSpan={2} className="pb-2.5 pt-0.5 text-xs text-ink-muted">
                  Flete USA incluye: {order.detalleFleteUSA.replaceAll(" | ", " · ")}
                </td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr>
              <td className="pt-4 font-semibold text-ink-primary">Total a pagar (USD)</td>
              <td className="pt-4 text-right font-bold text-lg text-brand-navy">{formatMXN(order.total)}</td>
            </tr>
          </tfoot>
        </table>

        {order.tipoCambio && order.tipoCambio > 0 && (
          <div className="mb-8 print:mb-4 rounded-xl bg-brand-blue-50 border border-brand-blue-100 p-5 print:p-3 text-center">
            <p className="text-xs uppercase tracking-wide text-ink-muted mb-1">
              Total en pesos mexicanos · T.C. {order.tipoCambio.toFixed(2)}
            </p>
            <p className="text-4xl print:text-2xl font-extrabold text-brand-navy">{formatPesos(order.total * order.tipoCambio)}</p>
          </div>
        )}

        {(order.banco || order.numeroCuenta || order.clabe || order.titular) && (
          <div className="mb-8 print:mb-4 text-sm border border-border rounded-lg p-4 print:p-3">
            <p className="text-xs uppercase tracking-wide text-ink-muted mb-2 font-semibold">Datos bancarios para el pago</p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2">
              {order.banco && (
                <p>
                  <span className="text-ink-muted">Banco: </span>
                  <span className="text-ink-primary font-medium">{order.banco}</span>
                </p>
              )}
              {order.direccionBanco && (
                <p>
                  <span className="text-ink-muted">Dirección del banco: </span>
                  <span className="text-ink-primary font-medium">{order.direccionBanco}</span>
                </p>
              )}
              {order.numeroCuenta && (
                <p>
                  <span className="text-ink-muted">Número de cuenta: </span>
                  <span className="text-ink-primary font-medium">{order.numeroCuenta}</span>
                </p>
              )}
              {order.clabe && (
                <p>
                  <span className="text-ink-muted">CLABE: </span>
                  <span className="text-ink-primary font-medium">{order.clabe}</span>
                </p>
              )}
              {order.titular && (
                <p>
                  <span className="text-ink-muted">Titular: </span>
                  <span className="text-ink-primary font-medium">{order.titular}</span>
                </p>
              )}
              {order.direccionTitular && (
                <p>
                  <span className="text-ink-muted">Dirección del titular: </span>
                  <span className="text-ink-primary font-medium">{order.direccionTitular}</span>
                </p>
              )}
            </div>
          </div>
        )}

        {order.notas && (
          <div className="mb-8 print:mb-4 text-sm">
            <p className="text-xs uppercase tracking-wide text-ink-muted mb-1">Notas</p>
            <p className="text-ink-primary">{order.notas}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-10 mt-16 pt-8 print:mt-8 print:pt-3">
          <div className="text-center">
            <div className="border-t border-gray-400 pt-2">
              <p className="text-sm font-medium text-ink-primary">Gabriel Buchanan</p>
              <p className="text-xs text-ink-muted">Gte. General — Dirección</p>
            </div>
          </div>
          <div className="text-center">
            <div className="border-t border-gray-400 pt-2">
              <p className="text-sm font-medium text-ink-primary">Perla Sanchez</p>
              <p className="text-xs text-ink-muted">Gte. Admón — Administración</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
