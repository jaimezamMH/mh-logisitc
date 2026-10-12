import { prisma } from "@/lib/prisma";
import { ESTATUS_ACTIVOS, MESES, diasEnProceso } from "@/lib/constants";

// Las fechas "solo día" (ej. fechaSalidaProgramada) se guardan como
// medianoche UTC al venir de strings "YYYY-MM-DD". Por eso aquí también
// se usa UTC para definir "hoy": evita que un servidor en otra zona
// horaria (ej. México, UTC-6) deje fuera el rango por unas horas.
function startOfDay(d: Date) {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}
function endOfDay(d: Date) {
  const x = new Date(d);
  x.setUTCHours(23, 59, 59, 999);
  return x;
}

// "Hoy" en hora LOCAL del servidor — a diferencia de startOfDay/endOfDay de
// arriba (UTC, para fechas "solo día"), esto es para comparar contra
// timestamps REALES (fechaGenerada de una orden, fecha de un StatusEvent/
// Comment, fechaRecordatorio). Usar la versión UTC ahí era un bug real: el
// servidor corre en hora de México (UTC-7/UTC-6), así que después de las
// ~17-18h locales el día en UTC ya cambió al de mañana mientras localmente
// sigue siendo "hoy" — con startOfDay/endOfDay (UTC) esas horas de la tarde
// quedaban fuera del rango de "hoy" y los reportes/recordatorios del día
// parecían vacíos aunque sí hubiera movimientos.
function startOfLocalDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function endOfLocalDay(d: Date) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

type ConCostos = {
  costoFleteUSA: number;
  costoImportacion: number;
  costoManiobras: number;
  costoFleteMx: number;
  costoPermiso: number;
  costoRepuveTitulo: number;
};

function costosPorConceptoDe(unidades: ConCostos[]) {
  return unidades.reduce(
    (acc, s) => {
      acc.fleteUSA += s.costoFleteUSA;
      acc.importacion += s.costoImportacion;
      acc.maniobras += s.costoManiobras;
      acc.fleteMx += s.costoFleteMx;
      acc.permiso += s.costoPermiso;
      acc.repuveTitulo += s.costoRepuveTitulo;
      return acc;
    },
    { fleteUSA: 0, importacion: 0, maniobras: 0, fleteMx: 0, permiso: 0, repuveTitulo: 0 }
  );
}

// Cuánto dinero/trabajo se le dio a cada proveedor en un periodo, y qué % del
// total de ese concepto representa — solo cuenta unidades con monto > 0 (no
// tiene caso listar "proveedor sin costo"). Si el monto existe pero no hay
// proveedor capturado, se agrupa bajo "Sin proveedor capturado" para que se
// note el hueco de datos en vez de perderse silenciosamente.
function agruparPorProveedor<T extends Record<string, unknown>>(
  unidades: T[],
  campoProveedor: keyof T,
  campoCosto: keyof T
) {
  const mapa = new Map<string, { monto: number; n: number }>();
  let total = 0;
  for (const s of unidades) {
    const monto = (s[campoCosto] as number) ?? 0;
    if (monto <= 0) continue;
    const proveedor = ((s[campoProveedor] as string | null)?.trim()) || "Sin proveedor capturado";
    const entry = mapa.get(proveedor) ?? { monto: 0, n: 0 };
    entry.monto += monto;
    entry.n += 1;
    mapa.set(proveedor, entry);
    total += monto;
  }
  return Array.from(mapa.entries())
    .map(([proveedor, { monto, n }]) => ({
      proveedor,
      monto,
      n,
      pct: total > 0 ? Math.round((monto / total) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.monto - a.monto);
}

export async function getAgendaHoy() {
  const today = new Date();
  const todayStart = startOfLocalDay(today);
  const todayEnd = endOfLocalDay(today);

  const reuniones = await prisma.comment.findMany({
    where: {
      tipo: "reunion",
      resuelto: false,
      fechaRecordatorio: { gte: todayStart, lte: todayEnd },
    },
    orderBy: { fechaRecordatorio: "asc" },
  });

  return {
    jaime: reuniones.filter((r) => r.autor === "Jaime Zamudio"),
    raul: reuniones.filter((r) => r.autor === "Raúl Favela"),
    otros: reuniones.filter((r) => r.autor !== "Jaime Zamudio" && r.autor !== "Raúl Favela"),
  };
}

export async function getDashboardData() {
  const today = new Date();
  // fechaSalidaProgramada es "solo día" (UTC); fechaRecordatorio es un
  // timestamp real (hora local) — cada uno necesita su propio "hoy".
  const todayStart = startOfDay(today);
  const todayEnd = endOfDay(today);
  const todayStartLocal = startOfLocalDay(today);
  const todayEndLocal = endOfLocalDay(today);

  const [shipments, salidasHoy, recordatoriosHoy, comentariosAbiertos, ordenesPendientes] =
    await Promise.all([
      prisma.shipment.findMany({ orderBy: { updatedAt: "desc" } }),
      prisma.shipment.findMany({
        where: { fechaSalidaProgramada: { gte: todayStart, lte: todayEnd } },
      }),
      prisma.comment.findMany({
        where: {
          tipo: "recordatorio",
          resuelto: false,
          fechaRecordatorio: { gte: todayStartLocal, lte: todayEndLocal },
        },
        include: { shipment: true },
        orderBy: { fechaRecordatorio: "asc" },
      }),
      prisma.comment.findMany({
        where: { resuelto: false },
        include: { shipment: true },
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
      prisma.paymentOrder.findMany({
        where: { estatusPago: "Pendiente" },
        include: { shipment: true },
        orderBy: { fechaGenerada: "desc" },
      }),
    ]);

  const activos = shipments.filter((s) => ESTATUS_ACTIVOS.includes(s.estatus as never));
  const entregadosMes = shipments.filter(
    (s) =>
      s.estatus === "Entregado" &&
      s.fechaEntrega &&
      s.fechaEntrega.getMonth() === today.getMonth() &&
      s.fechaEntrega.getFullYear() === today.getFullYear()
  );

  const porEstatus: Record<string, number> = {};
  for (const s of shipments) {
    porEstatus[s.estatus] = (porEstatus[s.estatus] ?? 0) + 1;
  }

  const totalCostosActivos = activos.reduce(
    (acc, s) =>
      acc +
      s.costoFleteUSA +
      s.costoImportacion +
      s.costoManiobras +
      s.costoFleteMx +
      s.costoPermiso +
      s.costoRepuveTitulo,
    0
  );

  // Desglose por concepto, solo de operaciones que AÚN NO se han entregado.
  const costosPorConcepto = costosPorConceptoDe(activos);

  return {
    totalActivos: activos.length,
    totalEntregadosMes: entregadosMes.length,
    totalUnidades: shipments.length,
    porEstatus,
    activos,
    salidasHoy,
    recordatoriosHoy,
    comentariosAbiertos,
    ordenesPendientes,
    totalCostosActivos,
    costosPorConcepto,
    enAgencia: activos.filter((s) => s.estatus === "Agencia"),
    enFleteMexico: activos.filter((s) => s.estatus === "Flete México"),
    recientes: shipments.slice(0, 8),
  };
}

export async function getShipmentsBoard() {
  const shipments = await prisma.shipment.findMany({
    orderBy: [{ estatus: "asc" }, { updatedAt: "desc" }],
  });
  return shipments;
}

export async function getShipment(id: string) {
  return prisma.shipment.findUnique({
    where: { id },
    include: {
      statusEvents: { orderBy: { fecha: "desc" } },
      comments: { orderBy: { createdAt: "desc" } },
      paymentOrders: { orderBy: { fechaGenerada: "desc" } },
      sales: true,
      gastosFleteUSA: { orderBy: { fecha: "desc" } },
      archivos: { orderBy: { createdAt: "desc" } },
    },
  });
}

export async function getCotizaciones() {
  return prisma.cotizacion.findMany({
    orderBy: { fecha: "desc" },
    include: { shipment: { select: { id: true, folio: true } } },
  });
}

export async function getCotizacion(id: string) {
  return prisma.cotizacion.findUnique({ where: { id } });
}

// Nombres de proveedores/agentes ya usados en el sistema (unidades reales +
// histórico del PDF), para ofrecerlos como sugerencia en vez de escribirlos
// de nuevo cada vez. No es una lista cerrada (se puede seguir escribiendo
// uno nuevo), solo evita repetir texto para los que ya se usan seguido.
export async function getProveedores() {
  const [shipments, historico] = await Promise.all([
    prisma.shipment.findMany({
      select: { proveedorCompra: true, provFleteUSA: true, provAgenteAduanal: true },
    }),
    prisma.costoHistorico.findMany({
      select: { proveedorCompra: true, provFleteUSA: true, provAgenteAduanal: true },
    }),
  ]);

  const todos = [...shipments, ...historico];
  const unico = (campo: "proveedorCompra" | "provFleteUSA" | "provAgenteAduanal") =>
    Array.from(
      new Set(
        todos
          .map((r) => r[campo]?.trim())
          .filter((v): v is string => !!v)
      )
    ).sort((a, b) => a.localeCompare(b, "es"));

  return {
    proveedorCompra: unico("proveedorCompra"),
    provFleteUSA: unico("provFleteUSA"),
    provAgenteAduanal: unico("provAgenteAduanal"),
  };
}

export async function getOrigenPorEstado() {
  const shipments = await prisma.shipment.findMany({
    select: { origenCiudad: true, estatus: true },
  });

  const { estadoDesdeOrigen } = await import("@/lib/usaCanadaMap");
  const conteo = new Map<string, number>();
  for (const s of shipments) {
    const code = estadoDesdeOrigen(s.origenCiudad);
    if (!code) continue;
    conteo.set(code, (conteo.get(code) ?? 0) + 1);
  }
  return conteo;
}

export interface OrigenDetalleUnidad {
  id: string;
  folio: string;
  equipoDescripcion: string;
  cliente: string;
  serie: string;
  estatus: string;
  origenCiudad: string | null;
}

/** Detalle de qué unidades salieron de cada estado/provincia (para el panel del mapa). */
export async function getOrigenDetalle() {
  const shipments = await prisma.shipment.findMany({
    select: {
      id: true,
      folio: true,
      equipoDescripcion: true,
      cliente: true,
      serie: true,
      estatus: true,
      origenCiudad: true,
    },
    orderBy: { equipoDescripcion: "asc" },
  });

  const { estadoDesdeOrigen } = await import("@/lib/usaCanadaMap");
  const porEstado = new Map<string, OrigenDetalleUnidad[]>();
  for (const s of shipments) {
    const code = estadoDesdeOrigen(s.origenCiudad);
    if (!code) continue;
    const lista = porEstado.get(code) ?? [];
    lista.push(s);
    porEstado.set(code, lista);
  }
  return porEstado;
}

export async function getMapShipments() {
  const shipments = await prisma.shipment.findMany({
    where: { estatus: { not: "Entregado" } },
    orderBy: { updatedAt: "desc" },
  });
  return shipments;
}

// ---------------------------------------------------------------------------
// Analítica
// ---------------------------------------------------------------------------

export async function getTiempoPromedioPorEtapa() {
  const { calcularDuracionPorEtapa } = await import("@/lib/ciclo");
  const shipments = await prisma.shipment.findMany({
    select: { fechaEntrega: true, statusEvents: { select: { id: true, estatusNuevo: true, fecha: true } } },
  });

  const porEtapa = new Map<string, { suma: number; n: number }>();
  for (const s of shipments) {
    const duraciones = calcularDuracionPorEtapa(s.statusEvents, s.fechaEntrega);
    for (const d of duraciones) {
      if (d.enCurso) continue; // solo etapas ya concluidas cuentan para el promedio
      if (d.estatus === "Entregado") continue; // etapa final: no "dura", ya se cerró el ciclo
      const entry = porEtapa.get(d.estatus) ?? { suma: 0, n: 0 };
      entry.suma += d.dias;
      entry.n += 1;
      porEtapa.set(d.estatus, entry);
    }
  }

  return Array.from(porEtapa.entries())
    .map(([estatus, { suma, n }]) => ({ estatus, promedioDias: Math.round((suma / n) * 10) / 10, n }))
    .sort((a, b) => b.promedioDias - a.promedioDias);
}

export async function getCicloPromedioPorMes() {
  const sales = await prisma.sale.findMany({
    where: { tiempoCicloDias: { not: null } },
  });

  const porMes = new Map<string, { suma: number; n: number }>();
  for (const m of MESES) porMes.set(m, { suma: 0, n: 0 });

  for (const s of sales) {
    if (!s.mes || s.tiempoCicloDias == null) continue;
    const entry = porMes.get(s.mes) ?? { suma: 0, n: 0 };
    entry.suma += s.tiempoCicloDias;
    entry.n += 1;
    porMes.set(s.mes, entry);
  }

  return MESES.map((mes) => {
    const e = porMes.get(mes)!;
    return {
      mes,
      promedioDias: e.n ? Math.round((e.suma / e.n) * 10) / 10 : null,
      cantidad: e.n,
    };
  }).filter((m) => m.cantidad > 0);
}

export async function getRendimientoProveedores() {
  const [shipments, historico] = await Promise.all([
    prisma.shipment.findMany({
      where: {
        OR: [
          { costoFleteUSA: { gt: 0 } },
          { costoImportacion: { gt: 0 } },
          { costoFleteMx: { gt: 0 } },
        ],
      },
    }),
    prisma.costoHistorico.findMany(),
  ]);

  type Row = {
    proveedor: string;
    rol: "Compra" | "Flete USA" | "Agente Aduanal";
    fleteUSA: number;
    importacion: number;
    fleteMx: number;
    n: number;
  };

  const map = new Map<string, Row>();

  function add(proveedor: string | null | undefined, rol: Row["rol"], fleteUSA: number, importacion: number, fleteMx: number) {
    if (!proveedor || proveedor === "N/A" || proveedor.toLowerCase().includes("sin documentos")) return;
    const key = `${rol}::${proveedor}`;
    const row = map.get(key) ?? { proveedor, rol, fleteUSA: 0, importacion: 0, fleteMx: 0, n: 0 };
    row.fleteUSA += fleteUSA;
    row.importacion += importacion;
    row.fleteMx += fleteMx;
    row.n += 1;
    map.set(key, row);
  }

  for (const s of shipments) {
    add(s.provFleteUSA, "Flete USA", s.costoFleteUSA, 0, 0);
    add(s.provAgenteAduanal, "Agente Aduanal", 0, s.costoImportacion, 0);
  }
  for (const h of historico) {
    add(h.provFleteUSA, "Flete USA", h.costoFleteUSA, 0, 0);
    add(h.provAgenteAduanal, "Agente Aduanal", 0, h.costoImportacion, 0);
  }

  const rows = Array.from(map.values()).map((r) => ({
    ...r,
    promedio:
      r.rol === "Flete USA" ? r.fleteUSA / r.n : r.rol === "Agente Aduanal" ? r.importacion / r.n : r.fleteMx / r.n,
  }));

  rows.sort((a, b) => b.n - a.n);
  return rows;
}

export async function getCostosPromedio2026() {
  const [shipments, historico] = await Promise.all([
    prisma.shipment.findMany(),
    prisma.costoHistorico.findMany(),
  ]);

  const fleteUSA = [
    ...shipments.map((s) => s.costoFleteUSA).filter((v) => v > 0),
    ...historico.map((h) => h.costoFleteUSA).filter((v) => v > 0),
  ];
  const importacion = [
    ...shipments.map((s) => s.costoImportacion).filter((v) => v > 0),
    ...historico.map((h) => h.costoImportacion).filter((v) => v > 0),
  ];
  const fleteMx = [
    ...shipments.map((s) => s.costoFleteMx).filter((v) => v > 0),
    ...historico.map((h) => h.costoFleteMx).filter((v) => v > 0),
  ];
  const maniobras = shipments.map((s) => s.costoManiobras).filter((v) => v > 0);
  const permiso = shipments.map((s) => s.costoPermiso).filter((v) => v > 0);
  const repuveTitulo = shipments.map((s) => s.costoRepuveTitulo).filter((v) => v > 0);

  const avg = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);

  return {
    fleteUSA: { promedio: avg(fleteUSA), n: fleteUSA.length },
    importacion: { promedio: avg(importacion), n: importacion.length },
    fleteMx: { promedio: avg(fleteMx), n: fleteMx.length },
    maniobras: { promedio: avg(maniobras), n: maniobras.length },
    permiso: { promedio: avg(permiso), n: permiso.length },
    repuveTitulo: { promedio: avg(repuveTitulo), n: repuveTitulo.length },
  };
}

export async function getVentasPorVendedor() {
  const sales = await prisma.sale.findMany({ where: { origenDato: "app" } });
  const map = new Map<string, number>();
  for (const s of sales) {
    map.set(s.vendedor, (map.get(s.vendedor) ?? 0) + 1);
  }
  return Array.from(map.entries()).map(([vendedor, cantidad]) => ({ vendedor, cantidad }));
}

export async function getVentas() {
  return prisma.sale.findMany({
    where: { origenDato: "app" },
    orderBy: { createdAt: "desc" },
    include: { shipment: true },
  });
}

// ---------------------------------------------------------------------------
// Servicios logísticos vendidos a clientes externos (no equipo propio de MH)
// ---------------------------------------------------------------------------

export async function getVentasServicioLogistico() {
  const shipments = await prisma.shipment.findMany({
    where: { tipoVenta: "Servicio Logístico" },
    orderBy: { createdAt: "desc" },
  });

  return shipments.map((s) => {
    const conceptos = [
      { label: "Flete USA", costo: s.costoFleteUSA, precio: s.precioFleteUSA },
      { label: "Importación / Aduana", costo: s.costoImportacion, precio: s.precioImportacion },
      { label: "Flete México", costo: s.costoFleteMx, precio: s.precioFleteMx },
      { label: "Permiso/Seguro/Placas", costo: s.costoPermiso, precio: s.precioPermiso },
    ].map((c) => ({ ...c, utilidad: c.precio - c.costo }));

    const totalCosto = conceptos.reduce((a, c) => a + c.costo, 0);
    const totalPrecio = conceptos.reduce((a, c) => a + c.precio, 0);
    const utilidadTotal = totalPrecio - totalCosto;

    return { shipment: s, conceptos, totalCosto, totalPrecio, utilidadTotal };
  });
}

// ---------------------------------------------------------------------------
// Reportes diario / semanal / mensual
// ---------------------------------------------------------------------------

export async function getReporteDiario(fecha: Date = new Date()) {
  // eventos/ordenesGeneradas/comentarios son timestamps reales (no fechas
  // "solo día"), así que "hoy" se calcula en hora local, no UTC.
  const from = startOfLocalDay(fecha);
  const to = endOfLocalDay(fecha);

  const [eventos, ordenesGeneradas, comentarios, unidadesEnOperacion] = await Promise.all([
    prisma.statusEvent.findMany({
      where: { fecha: { gte: from, lte: to } },
      include: { shipment: true },
      orderBy: { fecha: "asc" },
    }),
    prisma.paymentOrder.findMany({
      where: { fechaGenerada: { gte: from, lte: to } },
      include: { shipment: true },
    }),
    prisma.comment.findMany({
      where: { fecha: { gte: from, lte: to } },
      include: { shipment: true },
    }),
    prisma.shipment.findMany({
      where: { estatus: { not: "Entregado" } },
      orderBy: [{ estatus: "asc" }, { updatedAt: "desc" }],
      include: {
        // Los comentarios por unidad en el cierre diario NO se filtran por
        // hoy a propósito: Jaime los usa como notas que se quedan puestas
        // hasta que él mismo las cambie, no que se borren de la vista al
        // día siguiente. Se traen los últimos 3 (mismo tope que ya existía).
        comments: {
          where: { tipo: "comentario" },
          orderBy: { createdAt: "desc" },
          take: 3,
        },
      },
    }),
  ]);

  const entregasHoy = eventos.filter((e) => e.estatusNuevo === "Entregado");
  const totalPagado = ordenesGeneradas.reduce((a, o) => a + o.total, 0);
  const costoTotalUSD = entregasHoy.reduce(
    (a, e) =>
      a +
      e.shipment.costoFleteUSA +
      e.shipment.costoImportacion +
      e.shipment.costoManiobras +
      e.shipment.costoFleteMx +
      e.shipment.costoPermiso +
      e.shipment.costoRepuveTitulo,
    0
  );
  // "Costo por concepto" se saca de las ÓRDENES DE PAGO generadas hoy (no de
  // las unidades entregadas hoy) — así coincide con "Monto solicitado hoy" de
  // arriba, que también es dinero de órdenes. PaymentOrder ya guarda el monto
  // de cada concepto incluido en esa orden, así que se puede sumar directo.
  const costosPorConcepto = costosPorConceptoDe(ordenesGeneradas);

  return {
    fecha,
    eventos,
    ordenesGeneradas,
    comentarios,
    entregasHoy,
    totalPagado,
    costoTotalUSD,
    costosPorConcepto,
    unidadesEnOperacion,
  };
}

export async function getReporteRango(from: Date, to: Date) {
  const { calcularDuracionPorEtapa } = await import("@/lib/ciclo");

  const [eventos, ordenes, entregas] = await Promise.all([
    prisma.statusEvent.findMany({
      where: { fecha: { gte: from, lte: to } },
      include: { shipment: true },
      orderBy: { fecha: "asc" },
    }),
    prisma.paymentOrder.findMany({
      where: { fechaGenerada: { gte: from, lte: to } },
      include: { shipment: true },
    }),
    prisma.shipment.findMany({
      where: { estatus: "Entregado", fechaEntrega: { gte: from, lte: to } },
      include: { statusEvents: { select: { id: true, estatusNuevo: true, fecha: true } } },
    }),
  ]);

  const totalPagado = ordenes.reduce((a, o) => a + o.total, 0);
  const costoTotalUSD = entregas.reduce(
    (a, s) =>
      a + s.costoFleteUSA + s.costoImportacion + s.costoManiobras + s.costoFleteMx + s.costoPermiso + s.costoRepuveTitulo,
    0
  );

  // Costo promedio por unidad ENTREGADA en el periodo, por concepto — este sí
  // se queda basado en las unidades (no en las órdenes), es un dato distinto.
  const costosPorConceptoEntregas = costosPorConceptoDe(entregas);

  // "Costo por concepto" se saca de las ÓRDENES DE PAGO generadas en el
  // periodo (no de las unidades entregadas) — así coincide con "Monto total
  // solicitado" de arriba, que también es dinero de órdenes. PERO los meses
  // históricos (sembrados del PDF) nunca generaron una orden de pago dentro
  // de la app — solo tienen los 5 campos de costo directo en el Shipment —
  // así que si el periodo no tiene NINGUNA orden, se usa el costo de las
  // unidades entregadas como respaldo para no mostrar todo en $0.
  const costosPorConcepto = ordenes.length > 0 ? costosPorConceptoDe(ordenes) : costosPorConceptoEntregas;
  const costosPorConceptoFuente: "ordenes" | "entregas" = ordenes.length > 0 ? "ordenes" : "entregas";

  // Pagos por proveedor — solo de los 2 conceptos que sí tienen proveedor
  // capturado en el sistema (Flete USA y el agente que hace la importación).
  // Flete México y Maniobras/Permiso todavía no tienen un campo de
  // proveedor propio en el modelo de datos, por eso no se desglosan aquí.
  const proveedoresFleteUSA = agruparPorProveedor(entregas, "provFleteUSA", "costoFleteUSA");
  const proveedoresAgenteAduanal = agruparPorProveedor(entregas, "provAgenteAduanal", "costoImportacion");
  const n = entregas.length || 1;
  const costoPromedioPorConcepto = {
    fleteUSA: costosPorConceptoEntregas.fleteUSA / n,
    importacion: costosPorConceptoEntregas.importacion / n,
    maniobras: costosPorConceptoEntregas.maniobras / n,
    fleteMx: costosPorConceptoEntregas.fleteMx / n,
    permiso: costosPorConceptoEntregas.permiso / n,
    repuveTitulo: costosPorConceptoEntregas.repuveTitulo / n,
  };

  // Ciclo promedio (días) de las unidades entregadas en este periodo.
  const ciclos = entregas
    .map((s) => s.tiempoCicloDias ?? diasEnProceso(s.fechaInicio, s.fechaEntrega))
    .filter((d): d is number => d != null);
  const cicloPromedioDias = ciclos.length
    ? Math.round((ciclos.reduce((a, d) => a + d, 0) / ciclos.length) * 10) / 10
    : null;

  // Desglose por etapa (en qué proceso se atoran más), solo de estas unidades.
  const porEtapa = new Map<string, { suma: number; n: number }>();
  for (const s of entregas) {
    const duraciones = calcularDuracionPorEtapa(s.statusEvents, s.fechaEntrega);
    for (const d of duraciones) {
      if (d.enCurso || d.estatus === "Entregado") continue;
      const entry = porEtapa.get(d.estatus) ?? { suma: 0, n: 0 };
      entry.suma += d.dias;
      entry.n += 1;
      porEtapa.set(d.estatus, entry);
    }
  }
  const etapasPromedio = Array.from(porEtapa.entries())
    .map(([estatus, { suma, n }]) => ({ estatus, promedioDias: Math.round((suma / n) * 10) / 10, n }))
    .sort((a, b) => b.promedioDias - a.promedioDias);

  return {
    from,
    to,
    eventos,
    ordenes,
    entregas,
    totalPagado,
    costoTotalUSD,
    costosPorConcepto,
    costosPorConceptoFuente,
    proveedoresFleteUSA,
    proveedoresAgenteAduanal,
    costoPromedioPorConcepto,
    cicloPromedioDias,
    etapasPromedio,
  };
}
