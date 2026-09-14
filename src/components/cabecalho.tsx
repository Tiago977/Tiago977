import type { ReactNode } from "react";

export function CabecalhoPagina({
  titulo,
  descricao,
  acoes,
}: {
  titulo: string;
  descricao?: string;
  acoes?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-3 border-b border-borda px-4 py-4 md:px-6">
      <div className="min-w-0">
        <h1 className="text-lg font-semibold tracking-tight">{titulo}</h1>
        {descricao ? (
          <p className="mt-0.5 text-[13px] text-texto-suave">{descricao}</p>
        ) : null}
      </div>
      {acoes ? <div className="flex items-center gap-2">{acoes}</div> : null}
    </header>
  );
}
