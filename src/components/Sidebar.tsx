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
} from "lucide-react";

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

export default function Sidebar() {
  const pathname = usePathname();
  if (pathname === "/login") return null;

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

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV.map((item) => {
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

      <div className="px-4 py-4 border-t border-white/10 text-xs text-white/50 flex items-center gap-2">
        <Building2 size={14} />
        Machinery Hunters · 2026
      </div>
    </aside>
  );
}
