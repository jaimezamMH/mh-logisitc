"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function BackButton() {
  const router = useRouter();
  return (
    <button
      onClick={() => router.back()}
      title="Regresar"
      className="flex items-center justify-center rounded-lg h-9 w-9 shrink-0 text-ink-secondary hover:text-brand-blue-700 hover:bg-surface-muted"
    >
      <ArrowLeft size={18} />
    </button>
  );
}
