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

// Cohete con estela, para que "viaje" orbitando el mundo del menú — dibujado
// a mano en SVG. Apunta hacia la derecha (estela a la izquierda); al no
// contrarrotar sobre su órbita (ver mh-orbit más abajo), se mantiene siempre
// apuntando en la dirección del movimiento, como si estuviera en vuelo.
function RocketIcon({ size = 40, className, trailId }: { size?: number; className?: string; trailId: string }) {
  return (
    <svg width={size} height={size * 0.4} viewBox="0 0 70 28" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={trailId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.85" />
        </linearGradient>
      </defs>
      {/* estela */}
      <path d="M0 14 L40 9 L40 19 Z" fill={`url(#${trailId})`} />
      {/* aletas */}
      <path d="M42 10 L37 4 L45 9 Z" fill="currentColor" opacity="0.85" />
      <path d="M42 18 L37 24 L45 19 Z" fill="currentColor" opacity="0.85" />
      {/* cuerpo */}
      <path d="M40 14 L58 10 Q67 14 58 18 Z" fill="currentColor" />
      {/* ventana */}
      <circle cx="51" cy="14" r="2.3" fill="#0f2440" opacity="0.6" />
    </svg>
  );
}

// Tres cohetes repartidos cada 120° alrededor del mundo. Cada uno vive en su
// propio "brazo de reloj" (rotación fija de colocación) dentro del contenedor
// que gira sin parar — así quedan espaciados entre sí y, como ninguno se
// contrarrota, los tres se mantienen siempre apuntando en la dirección del
// vuelo durante toda la vuelta.
const COHETES = [
  { angle: 0, color: "text-sky-400", trailId: "mhRocketTrailBlue" },
  { angle: 120, color: "text-brand-orange-500", trailId: "mhRocketTrailOrange" },
  { angle: 240, color: "text-yellow-400", trailId: "mhRocketTrailYellow" },
];
const ORBIT_SEGUNDOS = 7;

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

      {/* Planeta Tierra girando con 3 cohetes orbitando, pasando por detrás y
          por delante del mundo — SVG + CSS, sin librerías */}
      <div className="flex-1 min-h-0 flex items-center justify-center">
        <div className="relative w-36 h-36">
          <Globe size={144} className="relative z-10 shadow-[0_0_32px_rgba(59,130,246,0.35)]" />
          <div className="absolute -inset-4 rounded-full border mh-electric-ring z-10" />
          <div className="absolute inset-0 mh-orbit">
            {COHETES.map((c, i) => (
              <div key={c.angle} className="absolute inset-0" style={{ transform: `rotate(${c.angle}deg)` }}>
                <div
                  className="absolute top-2 left-1/2 -translate-x-1/2 mh-orbit-depth"
                  style={{ animationDelay: `-${(i * ORBIT_SEGUNDOS) / COHETES.length}s` }}
                >
                  <RocketIcon
                    size={34}
                    trailId={c.trailId}
                    className={`${c.color} drop-shadow-[0_2px_5px_rgba(0,0,0,0.5)]`}
                  />
                </div>
              </div>
            ))}
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
