"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FolderClosed, ScanLine, Send, MessagesSquare } from "lucide-react";
import { cn } from "@/lib/ui";

const ITENS = [
  { href: "/arquivos", rotulo: "Arquivos", Icone: FolderClosed },
  { href: "/digitalizar", rotulo: "Digitalizar", Icone: ScanLine },
  { href: "/envios", rotulo: "Envios", Icone: Send },
  { href: "/conversas", rotulo: "Conversas", Icone: MessagesSquare },
];

export function NavegacaoLateral() {
  const caminho = usePathname();

  return (
    <nav className="flex flex-col gap-0.5" aria-label="Seções">
      {ITENS.map(({ href, rotulo, Icone }) => {
        const ativo = caminho.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={ativo ? "page" : undefined}
            className={cn(
              "flex h-10 items-center gap-2.5 rounded-xl px-3 text-sm font-medium transition",
              ativo
                ? "bg-acento-suave text-acento"
                : "text-texto-suave hover:bg-painel-suave hover:text-texto",
            )}
          >
            <Icone className="size-[18px]" />
            {rotulo}
          </Link>
        );
      })}
    </nav>
  );
}

export function NavegacaoInferior() {
  const caminho = usePathname();

  return (
    <nav
      aria-label="Seções"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-borda bg-painel/95 backdrop-blur md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto flex max-w-lg">
        {ITENS.map(({ href, rotulo, Icone }) => {
          const ativo = caminho.startsWith(href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={ativo ? "page" : undefined}
                className={cn(
                  "flex h-14 flex-col items-center justify-center gap-1 text-[11px] font-medium transition",
                  ativo ? "text-acento" : "text-texto-suave",
                )}
              >
                <Icone className="size-[19px]" />
                {rotulo}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
