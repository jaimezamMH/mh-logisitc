import { prisma } from "@/lib/prisma";

// Integración con el ERP interno (Frappe, mhdev.posix.mx). Al generar una
// orden de pago le mandamos toda la info del equipo (si la orden está
// ligada a uno) y el desglose del pago, para que quede reflejada allá sin
// tener que capturarla dos veces.
const ERP_ENDPOINT = "https://mhdev.posix.mx/api/method/mh.api.log_orden_pago";

export async function enviarOrdenAlERP(orderId: string): Promise<void> {
  const order = await prisma.paymentOrder.findUnique({
    where: { id: orderId },
    include: { shipment: true, gastosGenerales: { orderBy: { createdAt: "asc" } } },
  });
  if (!order) return;

  const s = order.shipment;

  const payload = {
    orden: {
      folio: order.folio,
      fechaGenerada: order.fechaGenerada,
      generadaPor: order.generadaPor,
      concepto: order.concepto,
      total: order.total,
      tipoCambio: order.tipoCambio,
      estatusPago: order.estatusPago,
      notas: order.notas,
      costos: {
        fleteUSA: order.costoFleteUSA,
        importacion: order.costoImportacion,
        maniobras: order.costoManiobras,
        fleteMx: order.costoFleteMx,
        permiso: order.costoPermiso,
        seguro: order.costoSeguro,
        placas: order.costoPlacas,
        repuveTitulo: order.costoRepuveTitulo,
      },
      detalleFleteUSA: order.detalleFleteUSA,
      gastosGenerales: order.gastosGenerales.map((g) => ({ descripcion: g.descripcion, monto: g.monto })),
      datosBancarios: {
        monedaCuenta: order.monedaCuenta,
        banco: order.banco,
        direccionBanco: order.direccionBanco,
        numeroCuenta: order.numeroCuenta,
        clabe: order.clabe,
        titular: order.titular,
        direccionTitular: order.direccionTitular,
      },
    },
    equipo: s
      ? {
          erpId: s.erpId,
          folio: s.folio,
          descripcion: s.equipoDescripcion,
          categoria: s.categoria,
          tipoUnidad: s.tipoUnidad,
          serie: s.serie,
          cliente: s.cliente,
          vendedor: s.vendedor,
          estatus: s.estatus,
          origenCiudad: s.origenCiudad,
          aduana: s.aduana,
          destinoCiudad: s.destinoCiudad,
          proveedorCompra: s.proveedorCompra,
          provFleteUSA: s.provFleteUSA,
          provAgenteAduanal: s.provAgenteAduanal,
          millas: s.millas,
          fechaInicio: s.fechaInicio,
          fechaCompra: s.fechaCompra,
          fechaSalidaUSA: s.fechaSalidaUSA,
          fechaCruce: s.fechaCruce,
          fechaSalidaProgramada: s.fechaSalidaProgramada,
          fechaEntrega: s.fechaEntrega,
        }
      : null,
  };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    let res: Response;
    try {
      res = await fetch(ERP_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!res.ok) {
      const texto = await res.text().catch(() => "");
      throw new Error(`ERP respondió ${res.status}: ${texto.slice(0, 300)}`);
    }

    await prisma.paymentOrder.update({
      where: { id: orderId },
      data: { erpEnviado: true, erpError: null, erpEnviadoAt: new Date() },
    });
  } catch (err) {
    const mensaje = err instanceof Error ? err.message : "Error desconocido";
    await prisma.paymentOrder
      .update({
        where: { id: orderId },
        data: { erpEnviado: false, erpError: mensaje.slice(0, 500) },
      })
      .catch(() => {});
  }
}
