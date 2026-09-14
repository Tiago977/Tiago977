import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/ui";

type VarianteBotao = "solido" | "contorno" | "sutil" | "perigo";
type TamanhoBotao = "sm" | "md" | "lg";

const VARIANTES: Record<VarianteBotao, string> = {
  solido: "bg-acento text-acento-texto hover:opacity-90 border border-transparent",
  contorno: "bg-painel text-texto border border-borda hover:border-borda-forte",
  sutil: "bg-transparent text-texto-suave hover:bg-painel-suave hover:text-texto border border-transparent",
  perigo: "bg-transparent text-perigo border border-borda hover:bg-perigo/10",
};

const TAMANHOS: Record<TamanhoBotao, string> = {
  sm: "h-8 px-3 text-[13px] gap-1.5 rounded-lg",
  md: "h-10 px-4 text-sm gap-2 rounded-xl",
  lg: "h-12 px-5 text-[15px] gap-2 rounded-xl",
};

export function Botao({
  variante = "contorno",
  tamanho = "md",
  className,
  ...props
}: ComponentProps<"button"> & { variante?: VarianteBotao; tamanho?: TamanhoBotao }) {
  return (
    <button
      className={cn(
        "inline-flex shrink-0 items-center justify-center font-medium transition",
        "disabled:pointer-events-none disabled:opacity-45",
        VARIANTES[variante],
        TAMANHOS[tamanho],
        className,
      )}
      {...props}
    />
  );
}

export function Campo({ className, ...props }: ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-xl border border-borda bg-painel px-3 text-sm",
        "placeholder:text-texto-suave focus:border-acento focus:outline-none",
        className,
      )}
      {...props}
    />
  );
}

export function AreaTexto({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "w-full resize-y rounded-xl border border-borda bg-painel px-3 py-2 text-sm",
        "placeholder:text-texto-suave focus:border-acento focus:outline-none",
        className,
      )}
      {...props}
    />
  );
}

export function Rotulo({ children, dica }: { children: ReactNode; dica?: string }) {
  return (
    <span className="mb-1.5 flex items-baseline justify-between gap-3">
      <span className="text-[13px] font-medium text-texto">{children}</span>
      {dica ? <span className="text-xs text-texto-suave">{dica}</span> : null}
    </span>
  );
}

export function Painel({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn("rounded-2xl border border-borda bg-painel", className)}
      {...props}
    />
  );
}

export function Etiqueta({
  tom = "neutro",
  children,
}: {
  tom?: "neutro" | "acento" | "sucesso" | "aviso" | "perigo";
  children: ReactNode;
}) {
  const tons = {
    neutro: "bg-painel-suave text-texto-suave",
    acento: "bg-acento-suave text-acento",
    sucesso: "bg-sucesso/12 text-sucesso",
    aviso: "bg-aviso/12 text-aviso",
    perigo: "bg-perigo/12 text-perigo",
  } as const;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap",
        tons[tom],
      )}
    >
      {children}
    </span>
  );
}

export function Vazio({
  icone,
  titulo,
  descricao,
  acao,
}: {
  icone: ReactNode;
  titulo: string;
  descricao: string;
  acao?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <div className="grid size-12 place-items-center rounded-2xl bg-painel-suave text-texto-suave">
        {icone}
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-texto">{titulo}</p>
        <p className="mx-auto max-w-xs text-[13px] text-texto-suave">{descricao}</p>
      </div>
      {acao}
    </div>
  );
}

export function Avatar({ texto, className }: { texto: string; className?: string }) {
  return (
    <span
      className={cn(
        "grid size-9 shrink-0 place-items-center rounded-full bg-acento-suave",
        "text-[13px] font-semibold text-acento select-none",
        className,
      )}
    >
      {texto}
    </span>
  );
}
