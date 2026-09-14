"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

export function Dialogo({
  titulo,
  aberto,
  onFechar,
  children,
  rodape,
}: {
  titulo: string;
  aberto: boolean;
  onFechar: () => void;
  children: ReactNode;
  rodape?: ReactNode;
}) {
  useEffect(() => {
    if (!aberto) return;
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") onFechar();
    };
    document.addEventListener("keydown", aoTeclar);
    return () => document.removeEventListener("keydown", aoTeclar);
  }, [aberto, onFechar]);

  if (!aberto) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={titulo}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-6"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onFechar();
      }}
    >
      <div className="surgir w-full max-w-md rounded-t-2xl border border-borda bg-painel shadow-painel sm:rounded-2xl">
        <div className="flex items-center justify-between gap-3 border-b border-borda px-4 py-3">
          <h2 className="text-sm font-semibold">{titulo}</h2>
          <button
            type="button"
            onClick={onFechar}
            aria-label="Fechar"
            className="grid size-7 place-items-center rounded-lg text-texto-suave transition hover:bg-painel-suave hover:text-texto"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="px-4 py-4">{children}</div>
        {rodape ? (
          <div className="flex justify-end gap-2 border-t border-borda px-4 py-3">{rodape}</div>
        ) : null}
      </div>
    </div>
  );
}
