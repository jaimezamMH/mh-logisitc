"use client";

import { createContext, useContext, useState } from "react";
import { MoneyInput } from "@/components/ui";
import { formatMXN } from "@/lib/constants";

export type Costos = {
  costoFleteUSA: string;
  costoImportacion: string;
  costoManiobras: string;
  costoFleteMx: string;
  costoPermiso: string;
  costoSeguro: string;
  costoPlacas: string;
  costoRepuveTitulo: string;
};
export type CostoCampo = keyof Costos;

type CostosContextValue = {
  valores: Costos;
  inicial: Costos;
  setValor: (campo: keyof Costos, v: string) => void;
};

const CostosContext = createContext<CostosContextValue | null>(null);

// Envuelve "Costos del embarque" y "Orden de pago" para que, aunque sean dos
// formularios distintos (cada uno con su propio botón/acción), los 5 montos
// se vean sincronizados en tiempo real mientras se escriben — editar uno
// actualiza el otro al instante, sin tener que guardar primero.
export function CostosSyncProvider({
  children,
  inicial,
}: {
  children: React.ReactNode;
  inicial: Costos;
}) {
  const [valores, setValores] = useState<Costos>(inicial);
  const setValor = (campo: keyof Costos, v: string) => setValores((prev) => ({ ...prev, [campo]: v }));
  return <CostosContext.Provider value={{ valores, inicial, setValor }}>{children}</CostosContext.Provider>;
}

// Campo chico para dar efectivo al chofer (viáticos) ADEMÁS de lo que se le
// carga a la tarjeta en "Flete USA" — no se guarda aparte, nada más suma lo
// que escribas aquí al monto de Flete USA (sobre el valor que ya tenía al
// abrir la página, para que escribir dos veces no sume de más).
export function ViaticosFleteUSA({ className }: { className?: string }) {
  const ctx = useContext(CostosContext);
  if (!ctx) throw new Error("ViaticosFleteUSA debe usarse dentro de CostosSyncProvider");
  const [viaticos, setViaticos] = useState("");

  const onChange = (v: string) => {
    setViaticos(v);
    const base = Number(ctx.inicial.costoFleteUSA.replace(/[^0-9.-]/g, "")) || 0;
    const extra = Number(v.replace(/[^0-9.-]/g, "")) || 0;
    ctx.setValor("costoFleteUSA", String(base + extra));
  };

  return (
    <label className={`flex flex-col gap-1 text-xs ${className ?? ""}`}>
      <span className="text-ink-muted">Viáticos Flete USA (efectivo al chofer, se suma a Flete USA)</span>
      <MoneyInput value={viaticos} onChange={onChange} className="rounded-lg border border-border px-2.5 py-1.5 text-xs" />
    </label>
  );
}

export function SyncedTotal({ className }: { className?: string }) {
  const ctx = useContext(CostosContext);
  if (!ctx) throw new Error("SyncedTotal debe usarse dentro de CostosSyncProvider");
  const total = Object.values(ctx.valores).reduce((a, v) => a + (Number(v.replace(/[^0-9.-]/g, "")) || 0), 0);
  return <span className={className}>{formatMXN(total)}</span>;
}

export function SyncedMoneyInput({
  campo,
  className,
}: {
  campo: keyof Costos;
  className?: string;
}) {
  const ctx = useContext(CostosContext);
  if (!ctx) throw new Error("SyncedMoneyInput debe usarse dentro de CostosSyncProvider");
  return (
    <MoneyInput
      name={campo}
      value={ctx.valores[campo]}
      onChange={(v) => ctx.setValor(campo, v)}
      className={className}
    />
  );
}
