import { Suspense } from "react";
import type { Metadata } from "next";
import { FormularioEntrar } from "@/components/formulario-entrar";
import { Painel } from "@/components/ui";
import { Logo } from "@/components/logo";

export const metadata: Metadata = { title: "Entrar" };

export default function PaginaEntrar() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center gap-8 px-5 py-12">
      <header className="space-y-2">
        <Logo tamanho={44} />
        <h1 className="text-xl font-semibold tracking-tight">Digitalizador</h1>
        <p className="text-sm text-texto-suave">
          Fotografe documentos, organize em pastas e envie para quem precisar.
        </p>
      </header>

      <Painel className="p-5 shadow-painel">
        <Suspense fallback={<div className="h-80" />}>
          <FormularioEntrar />
        </Suspense>
      </Painel>
    </main>
  );
}
