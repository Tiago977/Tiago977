"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Loader2, MessagesSquare, PenSquare } from "lucide-react";
import type { Conta } from "@/lib/types";
import type { ResumoConversa } from "@/lib/conversas-servidor";
import { criarClienteNavegador } from "@/lib/supabase/client";
import { abrirConversa } from "@/lib/dados";
import { Dialogo } from "@/components/dialogo";
import { Avatar, Botao, Campo, Etiqueta } from "@/components/ui";
import { cn, formatarData, iniciais } from "@/lib/ui";

export function PainelLista({
  conversas,
  contatos,
}: {
  conversas: ResumoConversa[];
  contatos: Conta[];
}) {
  const router = useRouter();
  const params = useParams<{ id?: string }>();
  const [aberto, setAberto] = useState(false);
  const [busca, setBusca] = useState("");
  const [criando, setCriando] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const termo = busca.trim().toLowerCase();
  const filtrados = termo
    ? contatos.filter(
        (c) =>
          c.nome.toLowerCase().includes(termo) || c.email.toLowerCase().includes(termo),
      )
    : contatos;

  async function conversarCom(conta: Conta) {
    setCriando(conta.id);
    setErro(null);
    try {
      const id = await abrirConversa(criarClienteNavegador(), conta.id);
      setAberto(false);
      router.push(`/conversas/${id}`);
      router.refresh();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível abrir a conversa.");
    } finally {
      setCriando(null);
    }
  }

  return (
    <>
      <div
        className={cn(
          "w-full shrink-0 flex-col border-borda md:flex md:w-80 md:border-r",
          params.id ? "hidden md:flex" : "flex",
        )}
      >
        <div className="flex items-center justify-between gap-2 border-b border-borda px-4 py-4">
          <h1 className="text-lg font-semibold tracking-tight">Conversas</h1>
          <Botao tamanho="sm" onClick={() => setAberto(true)}>
            <PenSquare className="size-3.5" />
            Nova
          </Botao>
        </div>

        {conversas.length === 0 ? (
          <p className="px-5 py-10 text-center text-[13px] text-texto-suave">
            Nenhuma conversa ainda. Toque em “Nova” para falar com alguém da equipe.
          </p>
        ) : (
          <ul className="flex-1 overflow-y-auto">
            {conversas.map((conversa) => (
              <li key={conversa.id}>
                <Link
                  href={`/conversas/${conversa.id}`}
                  className={cn(
                    "flex items-center gap-3 border-b border-borda px-4 py-3 transition",
                    params.id === conversa.id ? "bg-acento-suave/50" : "hover:bg-painel-suave",
                  )}
                >
                  <Avatar texto={iniciais(conversa.titulo, "")} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-[13px] font-medium">{conversa.titulo}</span>
                      <span className="shrink-0 text-[11px] text-texto-suave">
                        {formatarData(conversa.ultimaMensagemEm)}
                      </span>
                    </span>
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-[12px] text-texto-suave">
                        {conversa.previa}
                      </span>
                      {conversa.naoLidas > 0 ? (
                        <Etiqueta tom="acento">{conversa.naoLidas}</Etiqueta>
                      ) : null}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Dialogo titulo="Nova conversa" aberto={aberto} onFechar={() => setAberto(false)}>
        <Campo
          autoFocus
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome ou e-mail"
        />
        {erro ? <p className="mt-2 text-[13px] text-perigo">{erro}</p> : null}

        {filtrados.length === 0 ? (
          <p className="py-8 text-center text-[13px] text-texto-suave">
            <MessagesSquare className="mx-auto mb-2 size-5" />
            Ninguém encontrado. As pessoas aparecem aqui depois de criarem conta.
          </p>
        ) : (
          <ul className="mt-3 max-h-72 space-y-1 overflow-y-auto">
            {filtrados.map((conta) => (
              <li key={conta.id}>
                <button
                  type="button"
                  onClick={() => conversarCom(conta)}
                  disabled={criando === conta.id}
                  className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition hover:bg-painel-suave disabled:opacity-50"
                >
                  <Avatar texto={iniciais(conta.nome, conta.email)} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-medium">
                      {conta.nome || conta.email}
                    </span>
                    <span className="block truncate text-[11px] text-texto-suave">
                      {conta.email}
                    </span>
                  </span>
                  {criando === conta.id ? <Loader2 className="size-4 animate-spin" /> : null}
                </button>
              </li>
            ))}
          </ul>
        )}
      </Dialogo>
    </>
  );
}
