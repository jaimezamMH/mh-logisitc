"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { MoneyInput } from "@/components/ui";
import { formatMXN } from "@/lib/constants";

export type Costos = {
  costoFleteUSA: string;
  costoImportacion: string;
  costoBondCanada: string;
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
  const inicialKey = JSON.stringify(inicial);
  // Si otra acción (ej. guardar los gastos de Flete USA) actualiza el
  // embarque y revalida esta página, "inicial" llega con valores frescos —
  // pero useState solo lee su argumento en el primer montaje, así que sin
  // esto el total se quedaría pegado con el número de cuando se abrió la
  // página, aunque ya no sea el real (se vio este bug: Flete USA mostraba
  // el doble después de guardar).
  useEffect(() => {
    setValores(inicial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inicialKey]);
  const setValor = (campo: keyof Costos, v: string) => setValores((prev) => ({ ...prev, [campo]: v }));
  return <CostosContext.Provider value={{ valores, inicial, setValor }}>{children}</CostosContext.Provider>;
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

// Para llevar el valor sincronizado a un <form> que no tiene el input visible
// del campo (ej. "Orden de pago" necesita el valor vivo de Bond/Canadá para
// poder sumarlo a Importación al generar la orden, aunque ese campo solo se
// edite en "Costos del embarque").
export function SyncedHiddenInput({ campo }: { campo: keyof Costos }) {
  const ctx = useContext(CostosContext);
  if (!ctx) throw new Error("SyncedHiddenInput debe usarse dentro de CostosSyncProvider");
  return <input type="hidden" name={campo} value={ctx.valores[campo]} />;
}
