import Link from "next/link";
import { Trophy } from "lucide-react";
import { Card, SerieTag } from "@/components/ui";

export interface EntregaHoy {
  shipment: {
    id: string;
    folio: string;
    equipoDescripcion: string;
    cliente: string;
    serie: string;
    fotoUrl: string | null;
  };
}

// Tarjeta destacada de las entregas cerradas HOY — "la victoria del día".
// Se usa igual en /reportes (dirección) y en /publico/operacion (equipo de
// ventas); cada quien pasa su propio hrefFor() para que el link de cada
// unidad entregada vaya a la ficha correcta según dónde se esté mostrando.
export default function EntregasHoyBanner({
  entregas,
  hrefFor,
}: {
  entregas: EntregaHoy[];
  hrefFor: (shipment: EntregaHoy["shipment"]) => string;
}) {
  if (entregas.length === 0) return null;

  return (
    <Card className="border-2 border-amber-400/70">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-amber-200/70 bg-amber-50/60 rounded-t-[inherit]">
        <span className="relative flex h-9 w-9 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-50" />
          <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 text-amber-700">
            <Trophy size={18} />
          </span>
        </span>
        <div>
          <p className="font-semibold text-amber-800 text-sm">
            ¡Hoy se entregaron {entregas.length} equipo{entregas.length === 1 ? "" : "s"}!
          </p>
          <p className="text-xs text-ink-muted">Entregas cerradas el día de hoy</p>
        </div>
      </div>
      <ul className="divide-y divide-border">
        {entregas.map((e) => (
          <li key={e.shipment.id}>
            <Link
              href={hrefFor(e.shipment)}
              className="flex items-center gap-3 px-5 py-3 hover:bg-amber-50/60 transition-colors"
            >
              {e.shipment.fotoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={e.shipment.fotoUrl}
                  alt=""
                  className="w-11 h-11 rounded-md object-cover shrink-0 border border-border"
                />
              ) : (
                <div className="w-11 h-11 rounded-md bg-gray-100 shrink-0" />
              )}
              <div className="min-w-0 flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-ink-primary truncate">{e.shipment.equipoDescripcion}</span>
                <span className="text-xs text-ink-muted">{e.shipment.cliente}</span>
                <SerieTag serie={e.shipment.serie} />
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}
