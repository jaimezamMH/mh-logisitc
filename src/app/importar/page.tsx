import TopBar from "@/components/TopBar";
import { Card, CardHeader } from "@/components/ui";
import ImportadorExcel from "@/components/ImportadorExcel";

export default function ImportarPage() {
  return (
    <>
      <TopBar title="Importar datos" subtitle="Carga tu Excel real para completar el histórico" />
      <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
        <Card className="bg-brand-blue-50 border-brand-blue-100">
          <div className="p-5 text-sm text-ink-primary space-y-2">
            <p className="font-medium">¿Por qué importar en vez de que yo escriba todo a mano?</p>
            <p className="text-ink-secondary">
              El PDF que me compartiste es una impresión de tus Excel reales; algunas columnas se ven cortadas y no
              quise arriesgarme a transcribir mal números de serie o costos que después usamos para generar órdenes
              de pago. Por eso ya cargué las unidades que están activas hoy y una muestra confirmada del histórico,
              y aquí puedes subir tu archivo Excel/CSV real (no el PDF) para completar el resto de forma exacta, en
              un solo paso. De aquí en adelante, todo se captura directamente en la app — ya no hace falta llevar un
              Excel aparte.
            </p>
          </div>
        </Card>

        <Card>
          <CardHeader title="Subir archivo" subtitle="Acepta .xlsx, .xls o .csv" />
          <div className="p-5">
            <ImportadorExcel />
          </div>
        </Card>
      </main>
    </>
  );
}
