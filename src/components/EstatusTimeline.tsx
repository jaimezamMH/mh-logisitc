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
          return (
            <div key={step.key} className="flex items-start" title={compact ? titulo : undefined}>
              <div className={`flex flex-col items-center ${compact ? "w-10 sm:w-12" : "w-[72px] sm:w-24"}`}>
                <div
                  className={`relative flex items-center justify-center ${compact ? "h-4 w-4" : "h-7 w-7"}`}
                >
                  {step.estado === "actual" && (
                    <Zap
                      size={compact ? 10 : 14}
                      className={`mh-zap-pulse absolute text-brand-orange-500 fill-brand-orange-500 ${
                        compact ? "-top-2" : "-top-3.5"
                      }`}
                    />
                  )}
                  <span
                    className={`relative inline-flex rounded-full border-2 ${compact ? "h-2 w-2" : "h-3.5 w-3.5"} ${
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
                {!compact && (
                  <>
                    <span
                      className={`mt-1.5 text-[10px] sm:text-[11px] font-medium text-center leading-tight ${
                        step.estado === "pendiente" ? "text-ink-muted" : "text-ink-primary"
                      }`}
                    >
                      {step.label}
                    </span>
                    <span className="text-[10px] text-ink-muted">{step.fechaLabel ?? "—"}</span>
                  </>
                )}
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
