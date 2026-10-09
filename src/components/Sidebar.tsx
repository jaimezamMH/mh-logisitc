"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Truck,
  Map,
  Wallet,
  BarChart3,
  FileClock,
  FileText,
  Upload,
  Handshake,
  Building2,
  Eye,
} from "lucide-react";
import Globe from "@/components/Globe";

// Retroexcavadora (maquinaria amarilla, vista lateral), para que orbite el
// mundo del menú — dibujada a mano en SVG porque los sets de íconos no
// traen una retroexcavadora así.
function ExcavatorIcon({ size = 34, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size * 0.68} viewBox="0 0 48 33" className={className} aria-hidden="true">
      {/* orugas */}
      <rect x="2" y="25" width="30" height="6" rx="3" fill="#0f2440" />
      {/* cuerpo / cabina */}
      <rect x="8" y="13" width="17" height="12" rx="2" fill="currentColor" />
      <rect x="11" y="16" width="7" height="6" rx="1" fill="#0f2440" opacity="0.5" />
      {/* brazo trasero (pluma + cucharón) */}
      <path d="M23 15 L36 9 L32 18 L42 20" stroke="currentColor" strokeWidth="3.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M42 20 L46 24.5 L39 26.5 Z" fill="currentColor" />
      {/* pala frontal */}
      <path d="M8 19 L2 19 L1 23 L8 23 Z" fill="currentColor" opacity="0.85" />
    </svg>
  );
}

// Grúa móvil tipo Grove, roja con blanco (vista lateral), para el otro lado
// del mundo — también dibujada a mano en SVG.
function CraneIcon({ size = 46, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size * 0.68} viewBox="0 0 48 33" className={className} aria-hidden="true">
      {/* contrapeso trasero */}
      <rect x="1" y="12" width="6" height="5" fill="#ffffff" opacity="0.95" />
      {/* chasis */}
      <rect x="2" y="16" width="30" height="9" rx="1.5" fill="#dc2626" />
      {/* cabina */}
      <rect x="4" y="9" width="10" height="8" rx="1.5" fill="#ffffff" stroke="#dc2626" strokeWidth="1" />
      {/* pluma telescópica */}
      <path d="M20 17 L45 3" stroke="#dc2626" strokeWidth="3.6" strokeLinecap="round" />
      <path d="M20 17 L45 3" stroke="#ffffff" strokeWidth="1.1" strokeLinecap="round" strokeDasharray="2 3.2" />
      {/* ruedas */}
      <circle cx="9" cy="27" r="3.4" fill="#0f2440" />
      <circle cx="18" cy="27" r="3.4" fill="#0f2440" />
      <circle cx="27" cy="27" r="3.4" fill="#0f2440" />
    </svg>
  );
}

const NAV = [
  { href: "/", label: "Inicio", icon: LayoutDashboard },
  { href: "/operaciones", label: "Operaciones", icon: Truck },
  { href: "/mapa", label: "Mapa de flujo", icon: Map },
  { href: "/costos", label: "Costos y pagos", icon: Wallet },
  { href: "/cotizaciones", label: "Cotizaciones", icon: FileText },
  { href: "/ventas", label: "Ventas", icon: Handshake },
  { href: "/analitica", label: "Analítica", icon: BarChart3 },
  { href: "/reportes", label: "Reportes", icon: FileClock },
  { href: "/importar", label: "Importar datos", icon: Upload },
];

export default function Sidebar({ soloLectura = false }: { soloLectura?: boolean }) {
  const pathname = usePathname();
  if (pathname === "/login") return null;

  const items = soloLectura ? NAV.filter((item) => item.href !== "/importar") : NAV;

  return (
    <aside className="no-print hidden md:flex md:w-64 md:flex-col bg-brand-navy text-white shrink-0">
      <div className="flex items-center gap-2 px-5 h-16 border-b border-white/10">
        <div className="h-9 w-9 rounded-lg bg-brand-orange-500 flex items-center justify-center font-bold text-white">
          MH
        </div>
        <div>
          <p className="font-semibold leading-tight">MH Logística</p>
          <p className="text-xs text-white/60 leading-tight">Panel de operaciones</p>
        </div>
      </div>

      {soloLectura && (
        <div className="mx-3 mt-3 flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-2 text-xs text-white/80">
          <Eye size={13} />
          Solo lectura
        </div>
      )}

      <nav className="px-3 py-4 space-y-1">
        {items.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                active
                  ? "bg-white/10 text-white font-medium"
                  : "text-white/70 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon size={18} strokeWidth={2} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Planeta Tierra girando con maquinaria orbitando — SVG + CSS, sin librerías */}
      <div className="flex-1 min-h-0 flex items-center justify-center">
        <div className="relative w-36 h-36">
          <Globe size={144} className="shadow-[0_0_32px_rgba(59,130,246,0.35)]" />
          <div className="absolute -inset-4 rounded-full border border-white/10" />
          <div className="absolute inset-0 mh-orbit">
            <div className="absolute -top-5 left-1/2 -translate-x-1/2 mh-orbit-counter">
              <ExcavatorIcon size={46} className="text-yellow-400 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" />
            </div>
            <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 mh-orbit-counter">
              <CraneIcon size={46} className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" />
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 border-t border-white/10 text-xs text-white/50 flex items-center gap-2 shrink-0">
        <Building2 size={14} />
        Machinery Hunters · 2026
      </div>
    </aside>
  );
}
