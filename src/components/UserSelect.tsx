"use client";

import { useEffect, useState } from "react";
import { USUARIOS } from "@/lib/constants";

const STORAGE_KEY = "mh-usuario-activo";

export function useUsuarioActivo() {
  const [usuario, setUsuario] = useState<string>(USUARIOS[0]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setUsuario(saved);
    } catch {
      // localStorage no disponible; se ignora
    }
  }, []);

  const update = (value: string) => {
    setUsuario(value);
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // localStorage no disponible; se ignora
    }
  };

  return [usuario, update] as const;
}

export default function UserSelect({
  name = "usuario",
  label,
  className,
}: {
  name?: string;
  label?: string;
  className?: string;
}) {
  const [usuario, setUsuario] = useUsuarioActivo();

  return (
    <label className={`flex flex-col gap-1 text-sm ${className ?? ""}`}>
      {label && <span className="text-ink-secondary">{label}</span>}
      <select
        name={name}
        value={usuario}
        onChange={(e) => setUsuario(e.target.value)}
        className="rounded-lg border border-border bg-white px-3 py-2 text-sm text-ink-primary"
      >
        {USUARIOS.map((u) => (
          <option key={u} value={u}>
            {u}
          </option>
        ))}
      </select>
    </label>
  );
}

export function TopBarUserBadge() {
  const [usuario, setUsuario] = useUsuarioActivo();
  return (
    <div className="no-print flex items-center gap-2 rounded-full bg-surface-muted pl-3 pr-1.5 py-1 text-sm text-ink-secondary">
      <span className="h-2 w-2 rounded-full bg-brand-orange-500 shrink-0" />
      <select
        value={usuario}
        onChange={(e) => setUsuario(e.target.value)}
        title="¿Quién eres?"
        className="bg-transparent text-sm text-ink-secondary focus:outline-none cursor-pointer"
      >
        {USUARIOS.map((u) => (
          <option key={u} value={u}>
            {u}
          </option>
        ))}
      </select>
    </div>
  );
}
