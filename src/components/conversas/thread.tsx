"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, FileText, Loader2, Paperclip, SendHorizontal } from "lucide-react";
import type { Documento, Mensagem } from "@/lib/types";
import { criarClienteNavegador } from "@/lib/supabase/client";
import { enviarMensagem, marcarComoLida, urlAssinada } from "@/lib/dados";
import { Dialogo } from "@/components/dialogo";
import { Avatar, Botao, Campo } from "@/components/ui";
import { cn, formatarData, iniciais } from "@/lib/ui";

type ResumoDocumento = { titulo: string; formato: string; caminho: string };

export function Thread({
  conversaId,
  meuId,
  titulo,
  autores,
  mensagensIniciais,
  documentosConhecidos,
  meusDocumentos,
}: {
  conversaId: string;
  meuId: string;
  titulo: string;
  autores: Record<string, string>;
  mensagensIniciais: Mensagem[];
  documentosConhecidos: Record<string, ResumoDocumento>;
  meusDocumentos: Documento[];
}) {
  const [mensagens, setMensagens] = useState(mensagensIniciais);
  const [documentos, setDocumentos] = useState(documentosConhecidos);
  const [rascunho, setRascunho] = useState("");
  const [anexoAberto, setAnexoAberto] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const fim = useRef<HTMLDivElement>(null);
  const supabase = useMemo(() => criarClienteNavegador(), []);

  useEffect(() => {
    marcarComoLida(supabase, conversaId);

    const canal = supabase
      .channel(`conversa:${conversaId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "mensagens",
          filter: `conversa_id=eq.${conversaId}`,
        },
        (payload) => {
          const nova = payload.new as Mensagem;
          setMensagens((atuais) =>
            atuais.some((m) => m.id === nova.id) ? atuais : [...atuais, nova],
          );
          if (nova.autor !== meuId) marcarComoLida(supabase, conversaId);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, [supabase, conversaId, meuId]);

  useEffect(() => {
    fim.current?.scrollIntoView({ block: "end" });
  }, [mensagens]);

  // Documentos recebidos de outra pessoa não vêm na carga inicial; busca sob demanda.
  useEffect(() => {
    const faltando = [
      ...new Set(
        mensagens
          .map((m) => m.documento_id)
          .filter((id): id is string => Boolean(id) && !documentos[id!]),
      ),
    ];
    if (faltando.length === 0) return;

    let cancelado = false;
    supabase
      .from("documentos")
      .select("id, titulo, formato, caminho")
      .in("id", faltando)
      .then(({ data }) => {
        if (cancelado || !data?.length) return;
        setDocumentos((atuais) => ({
          ...atuais,
          ...Object.fromEntries(
            data.map((d) => [d.id, { titulo: d.titulo, formato: d.formato, caminho: d.caminho }]),
          ),
        }));
      });

    return () => {
      cancelado = true;
    };
  }, [mensagens, documentos, supabase]);

  async function enviar(corpo: string, documentoId: string | null) {
    if (!corpo.trim() && !documentoId) return;
    setEnviando(true);
    setErro(null);
    try {
      const nova = await enviarMensagem(supabase, conversaId, corpo, documentoId);
      setMensagens((atuais) =>
        atuais.some((m) => m.id === nova.id) ? atuais : [...atuais, nova as Mensagem],
      );
      setRascunho("");
      setAnexoAberto(false);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível enviar.");
    } finally {
      setEnviando(false);
    }
  }

  async function abrirAnexo(caminho: string) {
    try {
      window.open(await urlAssinada(supabase, caminho), "_blank", "noopener,noreferrer");
    } catch {
      setErro("Não foi possível abrir o documento.");
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex items-center gap-3 border-b border-borda px-3 py-3 md:px-5">
        <Link
          href="/conversas"
          aria-label="Voltar para as conversas"
          className="grid size-8 place-items-center rounded-lg text-texto-suave transition hover:bg-painel-suave md:hidden"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <Avatar texto={iniciais(titulo, "")} />
        <h1 className="truncate text-sm font-semibold">{titulo}</h1>
      </header>

      <div className="flex-1 space-y-2 overflow-y-auto px-3 py-4 md:px-5">
        {mensagens.length === 0 ? (
          <p className="py-10 text-center text-[13px] text-texto-suave">
            Nenhuma mensagem ainda. Diga olá ou compartilhe um documento.
          </p>
        ) : null}

        {mensagens.map((mensagem) => {
          const minha = mensagem.autor === meuId;
          const anexo = mensagem.documento_id ? documentos[mensagem.documento_id] : undefined;

          return (
            <div
              key={mensagem.id}
              className={cn("flex flex-col gap-1", minha ? "items-end" : "items-start")}
            >
              {!minha ? (
                <span className="px-1 text-[11px] text-texto-suave">
                  {autores[mensagem.autor] ?? "Alguém"}
                </span>
              ) : null}

              <div
                className={cn(
                  "max-w-[min(78%,32rem)] space-y-2 rounded-2xl px-3.5 py-2.5",
                  minha
                    ? "bg-acento text-acento-texto"
                    : "border border-borda bg-painel text-texto",
                )}
              >
                {anexo ? (
                  <button
                    type="button"
                    onClick={() => abrirAnexo(anexo.caminho)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left transition",
                      minha ? "bg-black/15 hover:bg-black/25" : "bg-painel-suave hover:opacity-80",
                    )}
                  >
                    <FileText className="size-4 shrink-0" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium">{anexo.titulo}</span>
                      <span className="block text-[11px] opacity-75">
                        {anexo.formato.toUpperCase()}
                      </span>
                    </span>
                  </button>
                ) : null}

                {mensagem.corpo ? (
                  <p className="text-[14px] leading-relaxed whitespace-pre-wrap">
                    {mensagem.corpo}
                  </p>
                ) : null}

                <span className={cn("block text-[10px]", minha ? "opacity-70" : "text-texto-suave")}>
                  {formatarData(mensagem.criado_em)}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={fim} />
      </div>

      {erro ? <p className="px-4 pb-2 text-[13px] text-perigo">{erro}</p> : null}

      <form
        className="flex items-center gap-2 border-t border-borda px-3 py-3 md:px-5"
        onSubmit={(e) => {
          e.preventDefault();
          enviar(rascunho, null);
        }}
      >
        <Botao
          type="button"
          variante="sutil"
          className="size-10 shrink-0 px-0"
          aria-label="Anexar documento"
          onClick={() => setAnexoAberto(true)}
        >
          <Paperclip className="size-4" />
        </Botao>
        <Campo
          value={rascunho}
          onChange={(e) => setRascunho(e.target.value)}
          placeholder="Escreva uma mensagem"
        />
        <Botao
          type="submit"
          variante="solido"
          className="size-10 shrink-0 px-0"
          aria-label="Enviar mensagem"
          disabled={enviando || !rascunho.trim()}
        >
          {enviando ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <SendHorizontal className="size-4" />
          )}
        </Botao>
      </form>

      <Dialogo
        titulo="Compartilhar documento"
        aberto={anexoAberto}
        onFechar={() => setAnexoAberto(false)}
      >
        {meusDocumentos.length === 0 ? (
          <p className="py-8 text-center text-[13px] text-texto-suave">
            Você ainda não digitalizou nenhum documento.
          </p>
        ) : (
          <ul className="max-h-80 space-y-1 overflow-y-auto">
            {meusDocumentos.map((documento) => (
              <li key={documento.id}>
                <button
                  type="button"
                  disabled={enviando}
                  onClick={() => enviar(rascunho, documento.id)}
                  className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition hover:bg-painel-suave disabled:opacity-50"
                >
                  <FileText className="size-4 shrink-0 text-texto-suave" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-medium">
                      {documento.titulo}
                    </span>
                    <span className="block text-[11px] text-texto-suave">
                      {documento.formato.toUpperCase()} · {formatarData(documento.criado_em)}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Dialogo>
    </div>
  );
}
