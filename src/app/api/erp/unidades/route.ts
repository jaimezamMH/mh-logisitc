import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Endpoint para que el ERP (mhdev.posix.mx) dé de alta unidades nuevas
// directo en MH Logística, sin que alguien las tenga que capturar dos
// veces a mano. Abierto a propósito (sin clave) por decisión de Jaime —
// si en algún momento se quiere cerrar, aquí es donde se agregaría la
// verificación de un header con una clave compartida.
//
// POST /api/erp/unidades
// Body (JSON), todo opcional salvo lo indicado:
// {
//   "erpId": "123",                 // recomendado — id de la unidad en el ERP;
//                                    // si ya existe una unidad con ese erpId,
//                                    // se actualiza en vez de crear otra (evita
//                                    // duplicados si el ERP reintenta el envío)
//   "equipoDescripcion": "Grúa Titán 2016 FREIGHTLINER 10 ton",
//   "categoria": "...",
//   "tipoUnidad": "CAMION" | "AMARILLO",
//   "serie": "...",
//   "cliente": "...",
//   "vendedor": "...",
//   "estatus": "Pendiente",
//   "origenCiudad": "Phoenix, AZ",
//   "aduana": "...",
//   "destinoCiudad": "...",
//   "proveedorCompra": "...",
//   "provFleteUSA": "...",
//   "provAgenteAduanal": "...",
//   "fechaInicio": "2026-10-23",     // fecha ISO (yyyy-mm-dd) u otro formato que Date() entienda
//   "fechaSalidaProgramada": "...",
//   "millas": 0,
//   "fotoUrl": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."   // foto del equipo, como data URL (no un link externo)
// }

async function nextFolio() {
  const last = await prisma.shipment.findFirst({
    orderBy: { folio: "desc" },
    select: { folio: true },
  });
  const n = last ? parseInt(last.folio.split("-").pop() ?? "0", 10) || 0 : 0;
  return `MH-2026-${String(n + 1).padStart(4, "0")}`;
}

function str(v: unknown): string | undefined {
  if (typeof v !== "string") return undefined;
  const trimmed = v.trim();
  return trimmed.length ? trimmed : undefined;
}

function num(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

function dateOrNull(v: unknown): Date | null {
  const s = str(v);
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function GET() {
  return NextResponse.json({ ok: true, info: "Endpoint para dar de alta unidades desde el ERP. Usa POST con un JSON." });
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Body inválido — se esperaba JSON." }, { status: 400 });
  }

  const erpId = str(body.erpId);

  const fotoUrl = str(body.fotoUrl);
  if (fotoUrl && !fotoUrl.startsWith("data:image/")) {
    return NextResponse.json(
      { ok: false, error: "fotoUrl inválida — debe ser una data URL (data:image/...), no un link externo." },
      { status: 400 }
    );
  }

  const datos = {
    equipoDescripcion: str(body.equipoDescripcion) ?? "Equipo sin descripción",
    categoria: str(body.categoria) ?? null,
    tipoUnidad: str(body.tipoUnidad) ?? null,
    cliente: str(body.cliente) ?? "Sin cliente",
    serie: str(body.serie) ?? "S/N",
    vendedor: str(body.vendedor) ?? null,
    estatus: str(body.estatus) ?? "Pendiente",
    origenCiudad: str(body.origenCiudad) ?? null,
    aduana: str(body.aduana) ?? null,
    destinoCiudad: str(body.destinoCiudad) ?? null,
    proveedorCompra: str(body.proveedorCompra) ?? null,
    provFleteUSA: str(body.provFleteUSA) ?? null,
    provAgenteAduanal: str(body.provAgenteAduanal) ?? null,
    fechaSalidaProgramada: dateOrNull(body.fechaSalidaProgramada),
    millas: num(body.millas),
    ...(fotoUrl ? { fotoUrl } : {}),
  };

  try {
    let shipment;
    let creada = true;

    if (erpId) {
      const existente = await prisma.shipment.findUnique({ where: { erpId } });
      if (existente) {
        creada = false;
        shipment = await prisma.shipment.update({ where: { erpId }, data: datos });
      }
    }

    if (!shipment) {
      shipment = await prisma.shipment.create({
        data: {
          ...datos,
          folio: await nextFolio(),
          erpId: erpId ?? null,
          fechaInicio: dateOrNull(body.fechaInicio) ?? new Date(),
        },
      });

      await prisma.statusEvent.create({
        data: {
          shipmentId: shipment.id,
          estatusNuevo: shipment.estatus,
          usuario: "ERP",
          comentario: "Unidad dada de alta desde el ERP",
        },
      });
    }

    return NextResponse.json({
      ok: true,
      created: creada,
      mh: { id: shipment.id, folio: shipment.folio, erpId: shipment.erpId },
    });
  } catch (err) {
    const mensaje = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ ok: false, error: mensaje }, { status: 500 });
  }
}
