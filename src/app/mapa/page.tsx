import TopBar from "@/components/TopBar";
import { Card, CardHeader } from "@/components/ui";
import { getMapShipments, getOrigenPorEstado, getOrigenDetalle } from "@/lib/queries";
import { ADUANAS } from "@/lib/constants";
import OrigenMap from "@/components/OrigenMap";

export const dynamic = "force-dynamic";

// Posición esquemática (no a escala) de cada aduana a lo largo de la frontera,
// ordenadas de oeste (San Diego) a este (Laredo).
const ADUANA_X: Record<string, number> = {
  "San Diego Ca": 60,
  "Calexico Ca": 190,
  "San Luis Az": 320,
  "El Paso Tx": 470,
  "Laredo Tx": 640,
};

export default async function MapaPage() {
  const shipments = await getMapShipments();
  const [origenPorEstado, origenDetalle] = await Promise.all([getOrigenPorEstado(), getOrigenDetalle()]);

  const porAduana = new Map<string, number>();
  for (const s of shipments) {
    if (!s.aduana) continue;
    porAduana.set(s.aduana, (porAduana.get(s.aduana) ?? 0) + 1);
  }

  const conteoObj = Object.fromEntries(origenPorEstado);
  const detalleObj = Object.fromEntries(origenDetalle);

  return (
    <>
      <TopBar title="Mapa de flujo" subtitle="Unidades activas: de dónde salen y por dónde cruzan (esquemático, no a escala)" />
      <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
        <Card>
          <CardHeader title="Actividad por aduana" subtitle="Unidades activas cruzando por cada punto" />
          <div className="p-5 overflow-x-auto">
            <svg viewBox="0 0 700 180" className="w-full min-w-[640px] h-44">
              <rect x="0" y="20" width="700" height="60" rx="10" fill="var(--brand-blue-50)" />
              <text x="16" y="14" fontSize="11" fill="var(--ink-muted)" fontWeight="600">
                ESTADOS UNIDOS
              </text>
              <rect x="0" y="110" width="700" height="60" rx="10" fill="var(--gray-100)" />
              <text x="16" y="104" fontSize="11" fill="var(--ink-muted)" fontWeight="600">
                MÉXICO
              </text>
              <line x1="0" y1="95" x2="700" y2="95" stroke="var(--brand-navy)" strokeWidth="2" strokeDasharray="6 4" />
              {ADUANAS.filter((a) => a !== "No Importación").map((a) => {
                const x = ADUANA_X[a] ?? 0;
                const n = porAduana.get(a) ?? 0;
                const r = 10 + Math.min(n, 6) * 3;
                return (
                  <g key={a}>
                    <circle cx={x} cy={95} r={r} fill={n > 0 ? "var(--brand-orange-500)" : "var(--gray-300)"} stroke="white" strokeWidth="2" />
                    {n > 0 && (
                      <text x={x} y={99} fontSize="11" fill="white" fontWeight="700" textAnchor="middle">
                        {n}
                      </text>
                    )}
                    <text x={x} y={135} fontSize="10" fill="var(--ink-secondary)" textAnchor="middle">
                      {a.replace(" Ca", "").replace(" Tx", "").replace(" Az", "")}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Mapa de origen: EUA y Canadá"
            subtitle="De dónde ha salido la maquinaria según su origen (histórico completo). Entre más oscuro, más unidades — haz clic en un estado para ver el detalle."
          />
          <div className="p-5">
            <OrigenMap conteo={conteoObj} detalle={detalleObj} />
          </div>
        </Card>
      </main>
    </>
  );
}
