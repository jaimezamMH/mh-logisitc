import Link from "next/link";
import { notFound } from "next/navigation";
import TopBar from "@/components/TopBar";
import { Card, CardHeader, StatusBadge, EmptyState, SerieTag, ClockBadge, MoneyInput } from "@/components/ui";
import UserSelect from "@/components/UserSelect";
import SelectOrNew from "@/components/SelectOrNew";
import BancoSelect from "@/components/BancoSelect";
import { CostosSyncProvider, SyncedMoneyInput, SyncedTotal, ViaticosFleteUSA, type CostoCampo } from "@/components/CostosSync";
import ConfirmZeroCostButton from "@/components/ConfirmZeroCostButton";
import ConfirmSubmitButton from "@/components/ConfirmSubmitButton";
import FotoEquipo from "@/components/FotoEquipo";
import DocumentosEmbarque from "@/components/DocumentosEmbarque";
import { getShipment, getProveedores } from "@/lib/queries";
import { esSoloLectura } from "@/lib/auth-server";
import {
  updateShipmentEstatusForm,
  updateShipmentInfo,
  updateShipmentCosts,
  generarOrdenDePago,
  cancelarOrdenDePago,
  eliminarOrdenDePago,
  createComment,
  resolveComment,
  deleteShipment,
} from "@/lib/actions";
import { ADUANAS, ESTATUS_FLOW, TIPOS_UNIDAD, VENDEDORES, estatusInfo, formatFecha, formatMXN } from "@/lib/constants";
import { calcularDuracionPorEtapa } from "@/lib/ciclo";
import { Trash2, Printer } from "lucide-react";

export const dynamic = "force-dynamic";

function dateInputValue(d: Date | null | undefined) {
  if (!d) return "";
  return new Date(d).toISOString().slice(0, 10);
}

export default async function EmbarqueDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [shipment, proveedores, soloLectura] = await Promise.all([getShipment(id), getProveedores(), esSoloLectura()]);
  if (!shipment) notFound();

  const totalCostos =
    shipment.costoFleteUSA + shipment.costoImportacion + shipment.costoManiobras + shipment.costoFleteMx + shipment.costoPermiso;

  const esServicio = shipment.tipoVenta === "Servicio Logístico";
  const totalPrecioServicio =
    shipment.precioFleteUSA + shipment.precioImportacion + shipment.precioFleteMx + shipment.precioPermiso;
  const utilidadServicio = totalPrecioServicio - totalCostos;

  const info = estatusInfo(shipment.estatus);

  // Cuántos días duró cada etapa (se usa en el historial de abajo).
  const duracionPorEvento = new Map(
    calcularDuracionPorEtapa(shipment.statusEvents, shipment.fechaEntrega).map((d) => [d.eventoId, d])
  );

  return (
    <>
      <TopBar title={shipment.folio} subtitle={shipment.equipoDescripcion} showBack />
      <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
        <Card className="p-4 md:p-5">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="w-full md:w-64 shrink-0">
              {soloLectura ? (
                shipment.fotoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={shipment.fotoUrl} alt="" className="w-full h-56 md:h-64 object-cover rounded-xl border border-border" />
                ) : (
                  <div className="w-full h-56 md:h-64 rounded-xl bg-gray-100 border border-border" />
                )
              ) : (
                <FotoEquipo shipmentId={shipment.id} fotoUrl={shipment.fotoUrl} />
              )}
            </div>
            <div className="flex-1 flex flex-col justify-between gap-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl font-semibold text-ink-primary">{shipment.equipoDescripcion}</h2>
                    {esServicio && (
                      <span className="rounded-full bg-brand-blue-100 text-brand-blue-900 text-xs font-medium px-2.5 py-1">
                        Servicio Logístico
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-ink-muted flex items-center gap-2 flex-wrap mt-1">
                    <span>{shipment.cliente} {shipment.semana ? `· Semana ${shipment.semana}` : ""}</span>
                    <SerieTag serie={shipment.serie} />
                    <ClockBadge
                      fechaInicio={shipment.fechaInicio}
                      fechaEntrega={shipment.fechaEntrega}
                      tiempoCicloDias={shipment.tiempoCicloDias}
                    />
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge estatus={shipment.estatus} />
                  {!soloLectura && (
                    <form action={deleteShipment.bind(null, shipment.id)}>
                      <ConfirmSubmitButton
                        confirmText={`¿Eliminar la unidad "${shipment.equipoDescripcion}" (serie ${shipment.serie})? Esto no se puede deshacer.`}
                        className="flex items-center gap-1.5 text-xs text-ink-muted hover:text-brand-orange-700 border border-border rounded-lg px-3 py-1.5"
                        title="Eliminar unidad"
                      >
                        <Trash2 size={14} />
                        Eliminar
                      </ConfirmSubmitButton>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Cambiar estatus */}
        {!soloLectura && (
          <Card>
            <CardHeader title="Mover a la siguiente etapa" subtitle={info.descripcion} />
            <form action={updateShipmentEstatusForm.bind(null, shipment.id)} className="p-5 space-y-4">
              <div className="flex flex-wrap gap-2">
                {ESTATUS_FLOW.map((e) => (
                  <button
                    key={e.key}
                    type="submit"
                    name="estatus"
                    value={e.key}
                    className={`rounded-lg px-3 py-2 text-xs font-medium border transition-colors ${
                      e.key === shipment.estatus
                        ? `${e.bg} ${e.text} border-transparent`
                        : "border-border text-ink-secondary hover:bg-surface-muted"
                    }`}
                  >
                    {e.label}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <UserSelect name="usuario" label="Registrado por" />
                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-ink-secondary">Comentario del cambio (opcional)</span>
                  <input name="comentario" className="rounded-lg border border-border px-3 py-2 text-sm" placeholder="Ej. Cruzó en Calexico" />
                </label>
              </div>
            </form>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Información del embarque */}
          <Card>
            <CardHeader title="Información y ruta" />
            {soloLectura ? (
              <dl className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 text-sm">
                {[
                  ["Cliente", shipment.cliente],
                  ["Serie", shipment.serie],
                  ["Categoría", shipment.categoria],
                  ["Tipo de unidad", shipment.tipoUnidad === "CAMION" ? "Camión" : shipment.tipoUnidad === "AMARILLO" ? "Amarilla (maquinaria)" : null],
                  ["Vendedor", shipment.vendedor],
                  ["Origen", shipment.origenCiudad],
                  ["Aduana", shipment.aduana],
                  ["Destino", shipment.destinoCiudad],
                  ["Fecha de inicio", shipment.fechaInicio ? formatFecha(shipment.fechaInicio) : null],
                  ["Salida programada", shipment.fechaSalidaProgramada ? formatFecha(shipment.fechaSalidaProgramada) : null],
                  ["Fecha de cruce", shipment.fechaCruce ? formatFecha(shipment.fechaCruce) : null],
                  ["Proveedor de compra", shipment.proveedorCompra],
                  ["Proveedor flete USA", shipment.provFleteUSA],
                  ["Agente aduanal", shipment.provAgenteAduanal],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-xs text-ink-muted">{label}</dt>
                    <dd className="text-ink-primary">{value || "—"}</dd>
                  </div>
                ))}
                <div className="sm:col-span-2">
                  <dt className="text-xs text-ink-muted">Incidencias / notas</dt>
                  <dd className="text-ink-primary whitespace-pre-wrap">{shipment.incidencias || "—"}</dd>
                </div>
              </dl>
            ) : (
            <form action={updateShipmentInfo.bind(null, shipment.id)} className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="flex flex-col gap-1 text-sm sm:col-span-2">
                <span className="text-ink-secondary">Descripción</span>
                <input name="equipoDescripcion" defaultValue={shipment.equipoDescripcion} className="rounded-lg border border-border px-3 py-2 text-sm" />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-ink-secondary">Cliente</span>
                <input name="cliente" defaultValue={shipment.cliente} className="rounded-lg border border-border px-3 py-2 text-sm" />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-ink-secondary">Serie</span>
                <input name="serie" defaultValue={shipment.serie} className="rounded-lg border border-border px-3 py-2 text-sm" />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-ink-secondary">Categoría</span>
                <input name="categoria" defaultValue={shipment.categoria ?? ""} className="rounded-lg border border-border px-3 py-2 text-sm" />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-ink-secondary">Tipo de unidad</span>
                <select name="tipoUnidad" defaultValue={shipment.tipoUnidad ?? ""} className="rounded-lg border border-border px-3 py-2 text-sm">
                  <option value="">Selecciona…</option>
                  {TIPOS_UNIDAD.map((t) => (
                    <option key={t} value={t}>
                      {t === "CAMION" ? "Camión" : "Amarilla (maquinaria)"}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-ink-secondary">Vendedor</span>
                <SelectOrNew
                  name="vendedor"
                  options={VENDEDORES}
                  defaultValue={shipment.vendedor ?? ""}
                  placeholder="Nombre del vendedor"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-ink-secondary">Origen</span>
                <input name="origenCiudad" defaultValue={shipment.origenCiudad ?? ""} className="rounded-lg border border-border px-3 py-2 text-sm" />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-ink-secondary">Aduana</span>
                <select name="aduana" defaultValue={shipment.aduana ?? ""} className="rounded-lg border border-border px-3 py-2 text-sm">
                  <option value="">Selecciona…</option>
                  {ADUANAS.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-ink-secondary">Destino</span>
                <input name="destinoCiudad" defaultValue={shipment.destinoCiudad ?? ""} className="rounded-lg border border-border px-3 py-2 text-sm" />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-ink-secondary">Fecha de inicio (arranca el reloj)</span>
                <input type="date" name="fechaInicio" defaultValue={dateInputValue(shipment.fechaInicio)} className="rounded-lg border border-border px-3 py-2 text-sm" />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-ink-secondary">Salida programada</span>
                <input type="date" name="fechaSalidaProgramada" defaultValue={dateInputValue(shipment.fechaSalidaProgramada)} className="rounded-lg border border-border px-3 py-2 text-sm" />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-ink-secondary">Fecha de cruce</span>
                <input type="date" name="fechaCruce" defaultValue={dateInputValue(shipment.fechaCruce)} className="rounded-lg border border-border px-3 py-2 text-sm" />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-ink-secondary">Proveedor de compra</span>
                <SelectOrNew
                  name="proveedorCompra"
                  options={proveedores.proveedorCompra}
                  defaultValue={shipment.proveedorCompra ?? ""}
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-ink-secondary">Proveedor flete USA</span>
                <SelectOrNew
                  name="provFleteUSA"
                  options={proveedores.provFleteUSA}
                  defaultValue={shipment.provFleteUSA ?? ""}
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-ink-secondary">Agente aduanal</span>
                <SelectOrNew
                  name="provAgenteAduanal"
                  options={proveedores.provAgenteAduanal}
                  defaultValue={shipment.provAgenteAduanal ?? ""}
                />
              </label>
              <label className="flex flex-col gap-1 text-sm sm:col-span-2">
                <span className="text-ink-secondary">Incidencias / notas</span>
                <textarea name="incidencias" defaultValue={shipment.incidencias ?? ""} className="rounded-lg border border-border px-3 py-2 text-sm min-h-16" />
              </label>
              <div className="sm:col-span-2 flex justify-end">
                <button className="rounded-lg bg-gray-900 text-white text-sm font-medium px-4 py-2 hover:opacity-90">
                  Guardar cambios
                </button>
              </div>
            </form>
            )}
          </Card>

          <Card>
            <CardHeader title="Documentos" subtitle="Factura, pedimento, BL, etc. — quedan guardados aquí para consultarlos cuando se necesiten" />
            <div className="p-5">
              <DocumentosEmbarque shipmentId={shipment.id} documentos={shipment.archivos} soloLectura={soloLectura} />
            </div>
          </Card>

          {/* Costos y orden de pago */}
          {soloLectura ? (
            <div className="space-y-6">
              <Card>
                <CardHeader
                  title="Costos del embarque"
                  subtitle={esServicio ? "Costo real vs. precio al cliente" : "Flete USA, importación, maniobras, flete Mx y permiso"}
                />
                <div className="p-5 space-y-2">
                  {[
                    { label: "Flete USA", costo: shipment.costoFleteUSA, precio: shipment.precioFleteUSA },
                    { label: "Importación", costo: shipment.costoImportacion, precio: shipment.precioImportacion },
                    ...(esServicio ? [] : [{ label: "Maniobra/Reparación", costo: shipment.costoManiobras, precio: 0 }]),
                    { label: "Flete México", costo: shipment.costoFleteMx, precio: shipment.precioFleteMx },
                    { label: "Permiso/Seguro/Placas", costo: shipment.costoPermiso, precio: shipment.precioPermiso },
                  ].map((c) => (
                    <div key={c.label} className="flex items-center justify-between text-sm">
                      <span className="text-ink-secondary">{c.label}</span>
                      <span className="text-ink-primary font-medium">
                        {formatMXN(c.costo)}
                        {esServicio && c.precio > 0 && <span className="text-ink-muted"> · cliente {formatMXN(c.precio)}</span>}
                      </span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <span className="text-sm font-semibold text-ink-primary">Total</span>
                    <span className="text-lg font-semibold text-ink-primary">
                      {formatMXN(totalCostos)}
                      {esServicio && (
                        <span className={`ml-2 text-sm font-medium ${utilidadServicio >= 0 ? "text-brand-blue-700" : "text-red-600"}`}>
                          (utilidad {formatMXN(utilidadServicio)})
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              </Card>

              <Card>
                <CardHeader title="Órdenes de pago" />
                {shipment.paymentOrders.length === 0 ? (
                  <EmptyState text="Sin órdenes de pago generadas." />
                ) : (
                  <ul className="divide-y divide-border">
                    {shipment.paymentOrders.map((o) => (
                      <li key={o.id} className="px-5 py-3 flex items-center justify-between gap-3 text-sm">
                        <div className="min-w-0">
                          <Link href={`/orden-pago/${o.id}`} className="text-brand-blue-700 hover:underline block truncate">
                            {o.folio} · {formatMXN(o.total)}
                          </Link>
                          <p className="text-xs text-ink-muted truncate">{o.concepto ?? "Todos los conceptos"}</p>
                        </div>
                        <span
                          className={
                            o.estatusPago === "Pagado"
                              ? "text-brand-blue-700"
                              : o.estatusPago === "Cancelada"
                                ? "text-gray-400"
                                : "text-brand-orange-700"
                          }
                        >
                          {o.estatusPago}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </div>
          ) : (
          <CostosSyncProvider
            inicial={{
              costoFleteUSA: String(shipment.costoFleteUSA),
              costoImportacion: String(shipment.costoImportacion),
              costoManiobras: String(shipment.costoManiobras),
              costoFleteMx: String(shipment.costoFleteMx),
              costoPermiso: String(shipment.costoPermiso),
            }}
          >
          <div className="space-y-6">
            <Card>
              <CardHeader
                title="Costos del embarque"
                subtitle={
                  esServicio
                    ? "Costo real (lo que pagas) vs. precio al cliente (lo que cobras) — la diferencia es tu utilidad"
                    : "Alimenta aquí flete USA, importación, maniobras, flete Mx y permiso"
                }
              />
              <form action={updateShipmentCosts.bind(null, shipment.id)} className="p-5 space-y-4">
                {esServicio ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 text-xs font-medium text-ink-muted px-1">
                      <span>Concepto</span>
                      <span className="w-24 text-right">Costo real</span>
                      <span className="w-24 text-right">Precio cliente</span>
                      <span className="w-20 text-right">Utilidad</span>
                    </div>
                    {[
                      { campo: "costoFleteUSA", precioCampo: "precioFleteUSA", label: "Flete USA", costo: shipment.costoFleteUSA, precio: shipment.precioFleteUSA },
                      { campo: "costoImportacion", precioCampo: "precioImportacion", label: "Importación", costo: shipment.costoImportacion, precio: shipment.precioImportacion },
                      { campo: "costoFleteMx", precioCampo: "precioFleteMx", label: "Flete México", costo: shipment.costoFleteMx, precio: shipment.precioFleteMx },
                      { campo: "costoPermiso", precioCampo: "precioPermiso", label: "Permiso/Seguro/Placas", costo: shipment.costoPermiso, precio: shipment.precioPermiso },
                    ].map((c) => (
                      <div key={c.campo} className="grid grid-cols-[1fr_auto_auto_auto] gap-2 items-center">
                        <span className="text-sm text-ink-secondary">{c.label}</span>
                        <MoneyInput name={c.campo} defaultValue={c.costo} className="w-24 rounded-md border border-border px-2 py-1.5 text-right text-sm" />
                        <MoneyInput name={c.precioCampo} defaultValue={c.precio} className="w-24 rounded-md border border-brand-blue-200 bg-brand-blue-50 px-2 py-1.5 text-right text-sm" />
                        <span className={`w-20 text-right text-sm font-medium ${c.precio - c.costo >= 0 ? "text-brand-blue-700" : "text-red-600"}`}>
                          {formatMXN(c.precio - c.costo)}
                        </span>
                      </div>
                    ))}
                    <input type="hidden" name="costoManiobras" value={shipment.costoManiobras} />
                    <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 items-center pt-2 border-t border-border">
                      <span className="text-sm font-semibold text-ink-primary">Total</span>
                      <span className="w-24 text-right text-sm font-semibold text-ink-primary">{formatMXN(totalCostos)}</span>
                      <span className="w-24 text-right text-sm font-semibold text-ink-primary">{formatMXN(totalPrecioServicio)}</span>
                      <span className={`w-20 text-right text-sm font-bold ${utilidadServicio >= 0 ? "text-brand-blue-700" : "text-red-600"}`}>
                        {formatMXN(utilidadServicio)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <ViaticosFleteUSA />
                    </div>
                    <label className="flex flex-col gap-1 text-sm">
                      <span className="text-ink-secondary">Flete USA</span>
                      <SyncedMoneyInput campo="costoFleteUSA" />
                    </label>
                    <label className="flex flex-col gap-1 text-sm">
                      <span className="text-ink-secondary">Importación</span>
                      <SyncedMoneyInput campo="costoImportacion" />
                    </label>
                    <label className="flex flex-col gap-1 text-sm">
                      <span className="text-ink-secondary">Maniobra/Reparación</span>
                      <SyncedMoneyInput campo="costoManiobras" />
                    </label>
                    <label className="flex flex-col gap-1 text-sm">
                      <span className="text-ink-secondary">Flete México</span>
                      <SyncedMoneyInput campo="costoFleteMx" />
                    </label>
                    <label className="flex flex-col gap-1 text-sm">
                      <span className="text-ink-secondary">Permiso/Seguro/Placas</span>
                      <SyncedMoneyInput campo="costoPermiso" />
                    </label>
                    <label className="flex items-center gap-2 text-sm mt-5">
                      <input type="checkbox" name="fleteMexAplica" defaultChecked={shipment.fleteMexAplica} />
                      <span className="text-ink-secondary">Aplica flete Mx</span>
                    </label>
                    <div className="col-span-2 flex items-center justify-between pt-2 border-t border-border">
                      <span className="text-sm text-ink-secondary">Total</span>
                      <SyncedTotal className="text-lg font-semibold text-ink-primary" />
                    </div>
                  </div>
                )}
                <div className="flex justify-end">
                  <button className="rounded-lg bg-gray-900 text-white text-sm font-medium px-4 py-2 hover:opacity-90">
                    Guardar costos
                  </button>
                </div>
              </form>
            </Card>

            <Card>
              <CardHeader
                title="Orden de pago"
                subtitle="Puedes escribir/ajustar el monto aquí mismo: se guarda en el equipo al generar la orden"
              />
              <div className="p-5 space-y-4">
                <form action={generarOrdenDePago.bind(null, shipment.id)} className="space-y-3">
                  <div className="space-y-1.5">
                    {[
                      { check: "incluirFleteUSA", campo: "costoFleteUSA", label: "Flete USA" },
                      { check: "incluirImportacion", campo: "costoImportacion", label: "Importación / Aduana" },
                      { check: "incluirManiobras", campo: "costoManiobras", label: "Maniobra/Reparación" },
                      { check: "incluirFleteMx", campo: "costoFleteMx", label: "Flete México" },
                      { check: "incluirPermiso", campo: "costoPermiso", label: "Permiso/Seguro/Placas" },
                    ].map((c) => (
                      <label key={c.check} className="flex items-center justify-between gap-2 text-sm rounded-lg border border-border px-3 py-2">
                        <span className="flex items-center gap-2 text-ink-secondary shrink-0">
                          <input type="checkbox" name={c.check} defaultChecked />
                          {c.label}
                        </span>
                        <SyncedMoneyInput
                          campo={c.campo as CostoCampo}
                          className="w-28 rounded-md border border-border px-2 py-1 text-right text-sm"
                        />
                      </label>
                    ))}
                  </div>
                  <UserSelect name="generadaPor" label="Solicitada por" />

                  <label className="flex flex-col gap-1 text-sm">
                    <span className="text-ink-secondary">Tipo de cambio del día (pesos por dólar)</span>
                    <MoneyInput name="tipoCambio" className="rounded-lg border border-border px-3 py-2 text-sm" />
                    <span className="text-xs text-ink-muted">
                      Opcional — si lo llenas, la orden muestra el total también en pesos, para proveedores mexicanos.
                    </span>
                  </label>

                  <div className="pt-2 border-t border-border">
                    <p className="text-xs font-medium text-ink-muted uppercase tracking-wide mb-2">
                      Datos bancarios para el pago
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <label className="flex flex-col gap-1 text-sm">
                        <span className="text-ink-secondary">Banco</span>
                        <BancoSelect />
                      </label>
                      <label className="flex flex-col gap-1 text-sm">
                        <span className="text-ink-secondary">Dirección del banco</span>
                        <input name="direccionBanco" className="rounded-lg border border-border px-3 py-2 text-sm" />
                      </label>
                      <label className="flex flex-col gap-1 text-sm">
                        <span className="text-ink-secondary">Número de cuenta</span>
                        <input name="numeroCuenta" className="rounded-lg border border-border px-3 py-2 text-sm" />
                      </label>
                      <label className="flex flex-col gap-1 text-sm">
                        <span className="text-ink-secondary">CLABE interbancaria</span>
                        <input name="clabe" className="rounded-lg border border-border px-3 py-2 text-sm" />
                      </label>
                      <label className="flex flex-col gap-1 text-sm">
                        <span className="text-ink-secondary">Nombre del titular</span>
                        <input name="titular" className="rounded-lg border border-border px-3 py-2 text-sm" />
                      </label>
                      <label className="flex flex-col gap-1 text-sm">
                        <span className="text-ink-secondary">Dirección del titular</span>
                        <input name="direccionTitular" className="rounded-lg border border-border px-3 py-2 text-sm" />
                      </label>
                    </div>
                  </div>

                  <input name="notas" placeholder="Notas para administración (opcional)" className="w-full rounded-lg border border-border px-3 py-2 text-sm" />
                  <ConfirmZeroCostButton className="w-full flex items-center justify-center gap-2 rounded-lg bg-brand-orange-500 hover:bg-brand-orange-600 text-white text-sm font-medium py-2.5">
                    <Printer size={16} />
                    Generar e imprimir orden de pago
                  </ConfirmZeroCostButton>
                </form>

                {shipment.paymentOrders.length > 0 && (
                  <ul className="divide-y divide-border border-t border-border pt-2">
                    {shipment.paymentOrders.map((o) => (
                      <li key={o.id} className="flex items-center justify-between py-2 text-sm gap-2">
                        <div className="min-w-0">
                          <Link href={`/orden-pago/${o.id}`} className="text-brand-blue-700 hover:underline block truncate">
                            {o.folio} · {formatMXN(o.total)}
                          </Link>
                          <p className="text-xs text-ink-muted truncate">{o.concepto ?? "Todos los conceptos"}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={
                              o.estatusPago === "Pagado"
                                ? "text-brand-blue-700"
                                : o.estatusPago === "Cancelada"
                                  ? "text-gray-400"
                                  : "text-brand-orange-700"
                            }
                          >
                            {o.estatusPago}
                          </span>
                          {o.estatusPago === "Pendiente" && (
                            <form action={cancelarOrdenDePago.bind(null, o.id)}>
                              <button className="text-xs text-gray-400 hover:text-red-600" title="Cancelar orden">
                                Cancelar
                              </button>
                            </form>
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
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Card>
          </div>
          </CostosSyncProvider>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Comentarios */}
          <Card>
            <CardHeader title="Comentarios" />
            {!soloLectura && (
              <form action={createComment} className="p-5 space-y-3 border-b border-border">
                <input type="hidden" name="shipmentId" value={shipment.id} />
                <textarea name="texto" required placeholder="Escribe un comentario…" className="w-full rounded-lg border border-border px-3 py-2 text-sm min-h-16" />
                <div className="flex gap-3">
                  <input name="autor" placeholder="Tu nombre" className="flex-1 rounded-lg border border-border px-3 py-2 text-sm" />
                  <button className="rounded-lg bg-gray-900 text-white text-sm font-medium px-4 py-2">Agregar</button>
                </div>
              </form>
            )}
            {shipment.comments.length === 0 ? (
              <EmptyState text="Sin comentarios todavía." />
            ) : (
              <ul className="divide-y divide-border">
                {shipment.comments.map((c) => (
                  <li key={c.id} className="px-5 py-3 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm text-ink-primary">{c.texto}</p>
                      <p className="text-xs text-ink-muted mt-0.5">
                        {c.autor ?? "Sin autor"} · {formatFecha(c.createdAt)} {c.tipo === "recordatorio" && "· Recordatorio"}
                      </p>
                    </div>
                    {!soloLectura && !c.resuelto && c.tipo === "recordatorio" && (
                      <form action={resolveComment.bind(null, c.id)}>
                        <button className="text-xs text-brand-blue-700 hover:underline shrink-0">Resolver</button>
                      </form>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* Historial de estatus */}
          <Card>
            <CardHeader title="Historial de estatus" />
            {shipment.statusEvents.length === 0 ? (
              <EmptyState text="Sin movimientos registrados." />
            ) : (
              <ul className="divide-y divide-border">
                {shipment.statusEvents.map((e) => {
                  const dur = duracionPorEvento.get(e.id);
                  return (
                    <li key={e.id} className="px-5 py-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm text-ink-primary">
                          {e.estatusAnterior ? `${e.estatusAnterior} → ` : ""}
                          <span className="font-medium">{e.estatusNuevo}</span>
                        </p>
                        {dur && (
                          <span
                            className={`inline-flex items-center gap-1 text-xs font-medium shrink-0 ${
                              dur.enCurso ? "text-brand-orange-700" : "text-ink-secondary"
                            }`}
                          >
                            ⏱ {dur.dias} día{dur.dias === 1 ? "" : "s"} {dur.enCurso ? "(en curso)" : "en esta etapa"}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-ink-muted mt-0.5">
                        {e.usuario ?? "Sistema"} · {formatFecha(e.fecha)} {e.comentario ? `· ${e.comentario}` : ""}
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>
      </main>
    </>
  );
}
