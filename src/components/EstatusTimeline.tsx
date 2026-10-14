import { Zap } from "lucide-react";
import type { TimelineStep } from "@/lib/ciclo";

export type { TimelineStep };

export default function EstatusTimeline({
  steps,
  size = "default",
}: {
  steps: TimelineStep[];
  size?: "default" | "compact";
}) {
  const compact = size === "compact";

  return (
    <div className={compact ? "overflow-x-auto" : "overflow-x-auto px-5 pt-4 pb-2 -mb-1"}>
      <div className="flex items-start min-w-max">
        {steps.map((step, i) => {
          const isLast = i === steps.length - 1;
          const titulo = `${step.label}${step.fechaLabel ? " — " + step.fechaLabel : ""}`;
          const fechaCorta = step.fechaLabel ? step.fechaLabel.replace(/\s\d{4}$/, "") : null;
          const esActual = step.estado === "actual";
          return (
            <div key={step.key} className="flex items-start" title={titulo}>
              <div className={`flex flex-col items-center ${compact ? "w-14 sm:w-16" : "w-[72px] sm:w-24"}`}>
                <div
                  className={`relative flex items-center justify-center ${compact ? "h-4 w-4" : "h-7 w-7"}`}
                >
                  {esActual && (
                    <Zap
                      size={compact ? 10 : 14}
                      className={`mh-zap-pulse absolute text-brand-orange-600 fill-brand-orange-600 ${
                        compact ? "-top-2" : "-top-3.5"
                      }`}
                    />
                  )}
                  <span
                    className={`relative inline-flex rounded-full border-2 ${compact ? "h-2 w-2" : "h-3.5 w-3.5"} ${
                      step.estado === "completado"
                        ? "bg-brand-blue-600 border-brand-blue-600"
                        : esActual
                          ? "mh-node-glow bg-brand-orange-600 border-brand-orange-600"
                          : step.estado === "cancelado"
                            ? "bg-red-500 border-red-500"
                            : "bg-white border-gray-300"
                    }`}
                  />
                </div>
                <span
                  className={`mt-1 ${compact ? "text-[9px]" : "mt-1.5 text-[10px] sm:text-[11px]"} text-center leading-tight whitespace-normal ${
                    esActual
                      ? "font-semibold text-brand-orange-600"
                      : step.estado === "pendiente"
                        ? "font-medium text-ink-muted"
                        : "font-medium text-ink-primary"
                  }`}
                >
                  {step.label}
                </span>
                <span className={`text-ink-muted ${compact ? "text-[9px] leading-none" : "text-[10px]"}`}>
                  {(compact ? fechaCorta : step.fechaLabel) ?? "—"}
                </span>
              </div>

              {!isLast && (
                <div
                  className={`relative shrink-0 ${compact ? "h-2 w-4 sm:w-6 mt-[7px]" : "h-3.5 w-8 sm:w-12 mt-[14px]"}`}
                >
                  <div
                    className={`absolute inset-x-0 top-1/2 -translate-y-1/2 h-0.5 rounded-full ${
                      step.estado === "completado" ? "bg-brand-blue-600" : "bg-gray-200"
                    }`}
                  />
                  {esActual && (
                    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-0.5 overflow-hidden rounded-full">
                      <div className="mh-timeline-bolt h-full w-1/3 bg-gradient-to-r from-transparent via-brand-orange-500 to-brand-orange-600" />
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
