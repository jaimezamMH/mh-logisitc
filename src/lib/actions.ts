"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

// Se basa en el folio más alto que exista (no en un conteo), para que no se
// repita un folio si antes se borró alguna unidad u orden a la mitad.
async function nextFolio() {
  const last = await prisma.shipment.findFirst({
    orderBy: { folio: "desc" },
    select: { folio: true },
  });
  const n = last ? parseInt(last.folio.split("-").pop() ?? "0", 10) || 0 : 0;
  return `MH-2026-${String(n + 1).padStart(4, "0")}`;
}

function str(fd: FormData, key: string): string | undefined {
  const v = fd.get(key);
  if (typeof v !== "string") return undefined;
  const trimmed = v.trim();
  return trimmed.length ? trimmed : undefined;
}

function num(fd: FormData, key: string): number {
  const v = fd.get(key);
  if (typeof v !== "string" || v.trim() === "") return 0;
  // admite que Jaime escriba "$1,234.56" o similar, no solo "1234.56"
  const limpio = v.replace(/[^0-9.-]/g, "");
  const n = Number(limpio);
  return Number.isFinite(n) ? n : 0;
}

function dateOrNull(fd: FormData, key: string): Date | null {
  const v = str(fd, key);
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

// ---------------------------------------------------------------------------
// Embarques
// ---------------------------------------------------------------------------

export async function createShipment(formData: FormData) {
  const folio = await nextFolio();

  const shipment = await prisma.shipment.create({
    data: {
      folio,
      equipoDescripcion: str(formData, "equipoDescripcion") ?? "Equipo sin descripción",
      categoria: str(formData, "categoria"),
      tipoUnidad: str(formData, "tipoUnidad"),
      cliente: str(formData, "cliente") ?? "Sin cliente",
      serie: str(formData, "serie") ?? "S/N",
      vendedor: str(formData, "vendedor"),
      estatus: str(formData, "estatus") ?? "Pendiente",
      origenCiudad: str(formData, "origenCiudad"),
      aduana: str(formData, "aduana"),
      destinoCiudad: str(formData, "destinoCiudad"),
      proveedorCompra: str(formData, "proveedorCompra"),
      provFleteUSA: str(formData, "provFleteUSA"),
      provAgenteAduanal: str(formData, "provAgenteAduanal"),
      fechaInicio: dateOrNull(formData, "fechaInicio") ?? new Date(),
      fechaSalidaProgramada: dateOrNull(formData, "fechaSalidaProgramada"),
      fechaCompra: dateOrNull(formData, "fechaCompra"),
    },
  });

  await prisma.statusEvent.create({
    data: {
      shipmentId: shipment.id,
      estatusNuevo: shipment.estatus,
      usuario: str(formData, "vendedor") ?? "Sistema",
      comentario: "Unidad dada de alta",
    },
  });

  revalidatePath("/");
  revalidatePath("/operaciones");
  redirect(`/embarques/${shipment.id}`);
}

// Venta de un servicio logístico suelto (cliente externo que no compra
// equipo con MH, solo contrata el flete/importación/etc.). Se crea igual
// como un Shipment para que automáticamente aparezca en Operaciones con
// su propio estatus y seguimiento, pero con tipoVenta = "Servicio Logístico"
// y precios de venta por concepto (para calcular utilidad).
export async function crearVentaServicio(formData: FormData) {
  const folio = await nextFolio();

  const shipment = await prisma.shipment.create({
    data: {
      folio,
      tipoVenta: "Servicio Logístico",
      equipoDescripcion: str(formData, "equipoDescripcion") ?? "Servicio logístico",
      cliente: str(formData, "cliente") ?? "Sin cliente",
      serie: str(formData, "serie") ?? "S/N",
      vendedor: str(formData, "vendedor"),
      estatus: str(formData, "estatus") ?? "Pendiente",
      origenCiudad: str(formData, "origenCiudad"),
      aduana: str(formData, "aduana"),
      destinoCiudad: str(formData, "destinoCiudad"),
      fechaInicio: dateOrNull(formData, "fechaInicio") ?? new Date(),
      costoFleteUSA: num(formData, "costoFleteUSA"),
      costoImportacion: num(formData, "costoImportacion"),
      costoFleteMx: num(formData, "costoFleteMx"),
      costoPermiso: num(formData, "costoPermiso"),
      precioFleteUSA: num(formData, "precioFleteUSA"),
      precioImportacion: num(formData, "precioImportacion"),
      precioFleteMx: num(formData, "precioFleteMx"),
      precioPermiso: num(formData, "precioPermiso"),
    },
  });

  await prisma.statusEvent.create({
    data: {
      shipmentId: shipment.id,
      estatusNuevo: shipment.estatus,
      usuario: str(formData, "vendedor") ?? "Sistema",
      comentario: "Venta de servicio logístico dada de alta",
    },
  });

  revalidatePath("/");
  revalidatePath("/operaciones");
  revalidatePath("/ventas");
  redirect(`/embarques/${shipment.id}`);
}

export async function updateShipmentEstatus(
  shipmentId: string,
  nuevoEstatus: string,
  usuario: string,
  comentario?: string
) {
  const current = await prisma.shipment.findUnique({ where: { id: shipmentId } });
  if (!current) throw new Error("Embarque no encontrado");

  await prisma.$transaction([
    prisma.shipment.update({
      where: { id: shipmentId },
      data: {
        estatus: nuevoEstatus,
        fechaEntrega: nuevoEstatus === "Entregado" ? new Date() : current.fechaEntrega,
      },
    }),
    prisma.statusEvent.create({
      data: {
        shipmentId,
        estatusAnterior: current.estatus,
        estatusNuevo: nuevoEstatus,
        usuario,
        comentario,
      },
    }),
  ]);

  revalidatePath("/");
  revalidatePath("/operaciones");
  revalidatePath(`/embarques/${shipmentId}`);
  revalidatePath("/reportes");
}

export async function updateShipmentEstatusForm(shipmentId: string, formData: FormData) {
  const nuevoEstatus = str(formData, "estatus");
  const usuario = str(formData, "usuario") ?? "Sistema";
  const comentario = str(formData, "comentario");
  if (!nuevoEstatus) return;
  await updateShipmentEstatus(shipmentId, nuevoEstatus, usuario, comentario);
}

export async function updateShipmentInfo(shipmentId: string, formData: FormData) {
  await prisma.shipment.update({
    where: { id: shipmentId },
    data: {
      equipoDescripcion: str(formData, "equipoDescripcion"),
      categoria: str(formData, "categoria"),
      tipoUnidad: str(formData, "tipoUnidad"),
      cliente: str(formData, "cliente"),
      serie: str(formData, "serie"),
      vendedor: str(formData, "vendedor"),
      origenCiudad: str(formData, "origenCiudad"),
      aduana: str(formData, "aduana"),
      destinoCiudad: str(formData, "destinoCiudad"),
      proveedorCompra: str(formData, "proveedorCompra"),
      provFleteUSA: str(formData, "provFleteUSA"),
      provAgenteAduanal: str(formData, "provAgenteAduanal"),
      fechaInicio: dateOrNull(formData, "fechaInicio"),
      fechaSalidaProgramada: dateOrNull(formData, "fechaSalidaProgramada"),
      fechaCompra: dateOrNull(formData, "fechaCompra"),
      fechaSalidaUSA: dateOrNull(formData, "fechaSalidaUSA"),
      fechaCruce: dateOrNull(formData, "fechaCruce"),
      incidencias: str(formData, "incidencias"),
    },
  });

  revalidatePath(`/embarques/${shipmentId}`);
  revalidatePath("/");
  revalidatePath("/operaciones");
  revalidatePath("/mapa");
}

export async function guardarFotoEquipo(shipmentId: string, dataUrl: string): Promise<void> {
  if (!dataUrl.startsWith("data:image/")) throw new Error("Imagen inválida");
  await prisma.shipment.update({
    where: { id: shipmentId },
    data: { fotoUrl: dataUrl },
  });
  revalidatePath(`/embarques/${shipmentId}`);
  revalidatePath("/operaciones");
  revalidatePath("/");
  revalidatePath("/costos");
}

export async function quitarFotoEquipo(shipmentId: string): Promise<void> {
  await prisma.shipment.update({
    where: { id: shipmentId },
    data: { fotoUrl: null },
  });
  revalidatePath(`/embarques/${shipmentId}`);
  revalidatePath("/operaciones");
  revalidatePath("/");
  revalidatePath("/costos");
}

export async function updateShipmentCosts(shipmentId: string, formData: FormData): Promise<void> {
  const tienePrecios = formData.has("precioFleteUSA");

  await prisma.shipment.update({
    where: { id: shipmentId },
    data: {
      costoFleteUSA: num(formData, "costoFleteUSA"),
      costoImportacion: num(formData, "costoImportacion"),
      costoManiobras: num(formData, "costoManiobras"),
      costoFleteMx: num(formData, "costoFleteMx"),
      costoPermiso: num(formData, "costoPermiso"),
      fleteMexAplica: formData.get("fleteMexAplica") === "on",
      ...(tienePrecios
        ? {
            precioFleteUSA: num(formData, "precioFleteUSA"),
            precioImportacion: num(formData, "precioImportacion"),
            precioFleteMx: num(formData, "precioFleteMx"),
            precioPermiso: num(formData, "precioPermiso"),
          }
        : {}),
    },
  });

  revalidatePath(`/embarques/${shipmentId}`);
  revalidatePath("/costos");
  revalidatePath("/analitica");
  revalidatePath("/ventas");
}

export async function deleteShipment(shipmentId: string) {
  await prisma.shipment.delete({ where: { id: shipmentId } });
  revalidatePath("/");
  revalidatePath("/operaciones");
  redirect("/operaciones");
}

// ---------------------------------------------------------------------------
// Orden de pago
// ---------------------------------------------------------------------------

// Igual que nextFolio(): se basa en el folio más alto existente, no en un
// conteo, para que borrar/cancelar una orden no provoque un folio repetido.
async function nextOrderFolio() {
  const last = await prisma.paymentOrder.findFirst({
    orderBy: { folio: "desc" },
    select: { folio: true },
  });
  const n = last ? parseInt(last.folio.split("-").pop() ?? "0", 10) || 0 : 0;
  return `OP-2026-${String(n + 1).padStart(4, "0")}`;
}

export async function generarOrdenDePago(shipmentId: string, formData: FormData): Promise<void> {
  const generadaPor = str(formData, "generadaPor") ?? "Sin especificar";
  const notas = str(formData, "notas");

  const s = await prisma.shipment.findUnique({ where: { id: shipmentId } });
  if (!s) throw new Error("Embarque no encontrado");

  // Por concepto: solo se incluyen (y se cobran) los conceptos marcados.
  // Si no viene ningún checkbox (formularios viejos), se incluyen todos.
  const CONCEPTOS = [
    { campo: "costoFleteUSA", check: "incluirFleteUSA", label: "Flete USA" },
    { campo: "costoImportacion", check: "incluirImportacion", label: "Importación / Aduana" },
    { campo: "costoManiobras", check: "incluirManiobras", label: "Maniobra/Reparación" },
    { campo: "costoFleteMx", check: "incluirFleteMx", label: "Flete México" },
    { campo: "costoPermiso", check: "incluirPermiso", label: "Permiso/Seguro" },
  ] as const;

  // Los montos que se escriban aquí (aunque el concepto esté desmarcado)
  // se guardan de una vez en el equipo, para no tener que ir a otra
  // pantalla a capturarlos primero.
  const costosActualizados: Record<string, number> = {};
  for (const c of CONCEPTOS) {
    const valor = formData.get(c.campo);
    costosActualizados[c.campo] = typeof valor === "string" && valor.trim() !== ""
      ? num(formData, c.campo)
      : (s[c.campo as keyof typeof s] as number);
  }
  const shipmentActualizado = await prisma.shipment.update({
    where: { id: shipmentId },
    data: costosActualizados,
  });

  const algunoMarcado = CONCEPTOS.some((c) => formData.get(c.check) === "on");
  const incluidos = CONCEPTOS.filter((c) => !algunoMarcado || formData.get(c.check) === "on");

  const montos: Record<string, number> = {
    costoFleteUSA: 0,
    costoImportacion: 0,
    costoManiobras: 0,
    costoFleteMx: 0,
    costoPermiso: 0,
  };
  for (const c of incluidos) montos[c.campo] = shipmentActualizado[c.campo as keyof typeof shipmentActualizado] as number;

  const concepto = incluidos.length === CONCEPTOS.length
    ? "Todos los conceptos"
    : incluidos.length === 1
      ? incluidos[0].label
      : incluidos.map((c) => c.label).join(" + ");

  const total = Object.values(montos).reduce((a, b) => a + b, 0);
  const tipoCambioTexto = str(formData, "tipoCambio");
  const tipoCambio = tipoCambioTexto ? num(formData, "tipoCambio") : null;

  const order = await prisma.paymentOrder.create({
    data: {
      folio: await nextOrderFolio(),
      shipmentId,
      generadaPor,
      notas,
      costoFleteUSA: montos.costoFleteUSA,
      costoImportacion: montos.costoImportacion,
      costoManiobras: montos.costoManiobras,
      costoFleteMx: montos.costoFleteMx,
      costoPermiso: montos.costoPermiso,
      concepto,
      total,
      tipoCambio: tipoCambio && tipoCambio > 0 ? tipoCambio : null,
      banco: str(formData, "banco"),
      direccionBanco: str(formData, "direccionBanco"),
      numeroCuenta: str(formData, "numeroCuenta"),
      clabe: str(formData, "clabe"),
      titular: str(formData, "titular"),
      direccionTitular: str(formData, "direccionTitular"),
    },
  });

  revalidatePath(`/embarques/${shipmentId}`);
  revalidatePath("/costos");
  redirect(`/orden-pago/${order.id}`);
}

export async function marcarOrdenPagada(orderId: string): Promise<void> {
  await prisma.paymentOrder.update({
    where: { id: orderId },
    data: { estatusPago: "Pagado" },
  });
  revalidatePath("/costos");
  revalidatePath(`/orden-pago/${orderId}`);
}

export async function cancelarOrdenDePago(orderId: string): Promise<void> {
  await prisma.paymentOrder.update({
    where: { id: orderId },
    data: { estatusPago: "Cancelada" },
  });
  revalidatePath("/costos");
  revalidatePath(`/orden-pago/${orderId}`);
}

export async function eliminarOrdenDePago(orderId: string): Promise<void> {
  const order = await prisma.paymentOrder.findUnique({ where: { id: orderId } });
  if (!order) return;
  await prisma.paymentOrder.delete({ where: { id: orderId } });
  revalidatePath("/costos");
  revalidatePath(`/embarques/${order.shipmentId}`);
  redirect(`/embarques/${order.shipmentId}`);
}

// ---------------------------------------------------------------------------
// Ventas
// ---------------------------------------------------------------------------

export async function createSale(formData: FormData) {
  await prisma.sale.create({
    data: {
      vendedor: str(formData, "vendedor") ?? "Otro",
      comprador: str(formData, "comprador"),
      tipoUnidad: str(formData, "tipoUnidad"),
      tiempoCicloDias: (() => {
        const v = str(formData, "tiempoCicloDias");
        return v ? Number(v) : null;
      })(),
      fecha: dateOrNull(formData, "fecha"),
      mes: str(formData, "mes"),
      anio: 2026,
      fleteMex: formData.get("fleteMex") === "on",
      shipmentId: str(formData, "shipmentId") || null,
      origenDato: "app",
    },
  });

  revalidatePath("/ventas");
  revalidatePath("/analitica");
}

// ---------------------------------------------------------------------------
// Comentarios / recordatorios
// ---------------------------------------------------------------------------

export async function createComment(formData: FormData) {
  await prisma.comment.create({
    data: {
      shipmentId: str(formData, "shipmentId") || null,
      texto: str(formData, "texto") ?? "",
      tipo: str(formData, "tipo") ?? "comentario",
      autor: str(formData, "autor"),
      fechaRecordatorio: dateOrNull(formData, "fechaRecordatorio"),
    },
  });

  revalidatePath("/");
  revalidatePath("/reportes");
  if (str(formData, "shipmentId")) {
    revalidatePath(`/embarques/${str(formData, "shipmentId")}`);
  }
}

export async function resolveComment(id: string) {
  await prisma.comment.update({ where: { id }, data: { resuelto: true } });
  revalidatePath("/");
  revalidatePath("/reportes");
}

export async function updateComment(formData: FormData) {
  const id = str(formData, "id");
  if (!id) return;
  const comment = await prisma.comment.update({
    where: { id },
    data: { texto: str(formData, "texto") ?? "" },
  });
  revalidatePath("/");
  revalidatePath("/reportes");
  if (comment.shipmentId) {
    revalidatePath(`/embarques/${comment.shipmentId}`);
  }
}

export async function deleteComment(id: string) {
  const comment = await prisma.comment.delete({ where: { id } });
  revalidatePath("/");
  revalidatePath("/reportes");
  if (comment.shipmentId) {
    revalidatePath(`/embarques/${comment.shipmentId}`);
  }
}

// ---------------------------------------------------------------------------
// Importar datos (Excel/CSV)
// ---------------------------------------------------------------------------

export interface ImportShipmentRow {
  semana?: number;
  equipoDescripcion: string;
  categoria?: string;
  tipoUnidad?: string;
  cliente: string;
  serie: string;
  vendedor?: string;
  estatus?: string;
  origenCiudad?: string;
  aduana?: string;
  destinoCiudad?: string;
  proveedorCompra?: string;
  provFleteUSA?: string;
  provAgenteAduanal?: string;
  costoFleteUSA?: number;
  costoImportacion?: number;
  costoManiobras?: number;
  costoFleteMx?: number;
  costoPermiso?: number;
}

export async function importShipments(rows: ImportShipmentRow[]) {
  const last = await prisma.shipment.findFirst({ orderBy: { folio: "desc" }, select: { folio: true } });
  let count = last ? parseInt(last.folio.split("-").pop() ?? "0", 10) || 0 : 0;
  let creados = 0;
  for (const row of rows) {
    if (!row.equipoDescripcion || !row.cliente) continue;
    count += 1;
    await prisma.shipment.create({
      data: {
        folio: `MH-2026-${String(count).padStart(4, "0")}`,
        semana: row.semana,
        equipoDescripcion: row.equipoDescripcion,
        categoria: row.categoria,
        tipoUnidad: row.tipoUnidad,
        cliente: row.cliente,
        serie: row.serie || "S/N",
        vendedor: row.vendedor,
        estatus: row.estatus || "Pendiente",
        origenCiudad: row.origenCiudad,
        aduana: row.aduana,
        destinoCiudad: row.destinoCiudad,
        proveedorCompra: row.proveedorCompra,
        provFleteUSA: row.provFleteUSA,
        provAgenteAduanal: row.provAgenteAduanal,
        costoFleteUSA: row.costoFleteUSA ?? 0,
        costoImportacion: row.costoImportacion ?? 0,
        costoManiobras: row.costoManiobras ?? 0,
        costoFleteMx: row.costoFleteMx ?? 0,
        costoPermiso: row.costoPermiso ?? 0,
      },
    });
    creados += 1;
  }

  revalidatePath("/");
  revalidatePath("/operaciones");
  revalidatePath("/costos");
  revalidatePath("/mapa");
  return creados;
}
