"use client";

import { Printer } from "lucide-react";

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="flex items-center gap-2 rounded-lg bg-brand-blue-600 hover:bg-brand-blue-700 text-white text-sm font-medium px-4 py-2"
    >
      <Printer size={16} />
      Imprimir / Guardar PDF
    </button>
  );
}
