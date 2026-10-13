import { Zap } from "lucide-react";

export interface TimelineStep {
  key: string;
  label: string;
  fechaLabel: string | null;
  estado: "completado" | "actual" | "pendiente" | "cancelado";
}

export default function EstatusTimeline({ steps }: { steps: TimelineStep[] }) {
  return (
    <div className="overflow-x-auto px-5 pt-4 pb-2 -mb-1">
      <div className="flex items-start min-w-max">
        {steps.map((step, i) => {
          const isLast = i === steps.length - 1;
          return (
            <div key={step.key} className="flex items-start">
              <div className="flex flex-col items-center w-[72px] sm:w-24">
                <div className="relative flex items-center justify-center h-7 w-7">
                  {step.estado === "actual" && (
                    <Zap
                      size={14}
                      className="mh-zap-pulse absolute -top-3.5 text-brand-orange-500 fill-brand-orange-500"
                    />
                  )}
                  <span
                    className={`relative inline-flex h-3.5 w-3.5 rounded-full border-2 ${
                      step.estado === "completado"
                        ? "bg-brand-blue-600 border-brand-blue-600"
                        : step.estado === "actual"
                          ? "mh-node-glow bg-brand-orange-500 border-brand-orange-500"
                          : step.estado === "cancelado"
                            ? "bg-red-500 border-red-500"
                            : "bg-white border-gray-300"
                    }`}
                  />
                </div>
                <span
                  className={`mt-1.5 text-[10px] sm:text-[11px] font-medium text-center leading-tight ${
                    step.estado === "pendiente" ? "text-ink-muted" : "text-ink-primary"
                  }`}
                >
                  {step.label}
                </span>
                <span className="text-[10px] text-ink-muted">{step.fechaLabel ?? "—"}</span>
              </div>

              {!isLast && (
                <div className="relative h-3.5 w-8 sm:w-12 mt-[14px] shrink-0">
                  <div
                    className={`absolute inset-x-0 top-1/2 -translate-y-1/2 h-0.5 rounded-full ${
                      step.estado === "completado" ? "bg-brand-blue-600" : "bg-gray-200"
                    }`}
                  />
                  {step.estado === "actual" && (
                    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-0.5 overflow-hidden rounded-full">
                      <div className="mh-timeline-bolt h-full w-1/3 bg-gradient-to-r from-transparent via-brand-orange-400 to-brand-orange-500" />
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
