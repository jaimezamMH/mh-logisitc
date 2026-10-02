import { estatusInfo, diasEnProceso } from "@/lib/constants";
import { Clock, Hash } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export function Card({
  children,
  className,
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <div
      id={id}
      className={`bg-surface rounded-xl border border-border shadow-[var(--shadow-card)] ${className ?? ""}`}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  action,
  subtitle,
}: {
  title: string;
  action?: React.ReactNode;
  subtitle?: string;
}) {
  return (
    <div className="flex items-center justify-between px-5 py-4 border-b border-border">
      <div>
        <h2 className="font-semibold text-ink-primary text-sm">{title}</h2>
        {subtitle && <p className="text-xs text-ink-muted mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "blue",
  hint,
}: {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  tone?: "blue" | "orange" | "gray" | "navy";
  hint?: string;
}) {
  const tones: Record<string, string> = {
    blue: "bg-brand-blue-50 text-brand-blue-700",
    orange: "bg-brand-orange-50 text-brand-orange-700",
    gray: "bg-gray-100 text-gray-700",
    navy: "bg-brand-navy text-white",
  };

  return (
    <Card className="p-5 flex items-start justify-between">
      <div>
        <p className="text-xs font-medium text-ink-muted uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-semibold text-ink-primary mt-1">{value}</p>
        {hint && <p className="text-xs text-ink-muted mt-1">{hint}</p>}
      </div>
      {Icon && (
        <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${tones[tone]}`}>
          <Icon size={20} />
        </div>
      )}
    </Card>
  );
}

export function StatusBadge({ estatus }: { estatus: string }) {
  const info = estatusInfo(estatus);
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${info.bg} ${info.text}`}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: info.solid }} />
      {info.label}
    </span>
  );
}

export function EmptyState({ text }: { text: string }) {
  return <p className="text-sm text-ink-muted py-8 text-center">{text}</p>;
}

/** Número de serie del equipo — el identificador que usa Jaime para cada unidad. */
export function SerieTag({ serie, className }: { serie: string; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 font-mono text-xs text-ink-secondary ${className ?? ""}`}>
      <Hash size={11} className="text-ink-muted" />
      {serie}
    </span>
  );
}

/**
 * "Reloj": días desde que se dio de alta la unidad hasta que se entregó
 * (o hasta hoy si sigue en proceso). Se usa el ciclo real capturado por
 * Jaime cuando existe; si no, se calcula con fechaInicio/fechaEntrega.
 */
export function ClockBadge({
  fechaInicio,
  fechaEntrega,
  tiempoCicloDias,
  className,
}: {
  fechaInicio?: Date | string | null;
  fechaEntrega?: Date | string | null;
  tiempoCicloDias?: number | null;
  className?: string;
}) {
  const dias = fechaEntrega && tiempoCicloDias != null ? tiempoCicloDias : diasEnProceso(fechaInicio, fechaEntrega);
  if (dias == null) return null;
  const enCurso = !fechaEntrega;
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium ${
        enCurso ? "text-brand-orange-700" : "text-ink-secondary"
      } ${className ?? ""}`}
      title={enCurso ? "Días transcurridos, aún en proceso" : "Días totales del ciclo (alta → entrega)"}
    >
      <Clock size={12} />
      {dias} día{dias === 1 ? "" : "s"}
      {enCurso && <span className="text-ink-muted">(en curso)</span>}
    </span>
  );
}

/**
 * Campo de texto para montos: se puede escribir directo con el teclado
 * (a diferencia de <input type="number">, que en algunas computadoras
 * solo deja mover el valor con las flechitas del campo).
 */
export function MoneyInput({
  name,
  defaultValue,
  value,
  onChange,
  className,
}: {
  name?: string;
  defaultValue?: number | string;
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
}) {
  return (
    <input
      type="text"
      inputMode="decimal"
      name={name}
      defaultValue={value === undefined ? defaultValue : undefined}
      value={value}
      onChange={onChange ? (e) => onChange(e.target.value) : undefined}
      placeholder="0.00"
      className={
        className ?? "rounded-lg border border-border px-3 py-2 text-sm"
      }
    />
  );
}

export function Pill({ children, tone = "gray" }: { children: React.ReactNode; tone?: "gray" | "blue" | "orange" }) {
  const tones: Record<string, string> = {
    gray: "bg-gray-100 text-gray-700",
    blue: "bg-brand-blue-50 text-brand-blue-700",
    orange: "bg-brand-orange-50 text-brand-orange-700",
  };
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${tones[tone]}`}>{children}</span>;
}
