"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, Loader2, Send, X } from "lucide-react";
import type { Documento } from "@/lib/types";
import { criarClienteNavegador } from "@/lib/supabase/client";
import { criarEnvio } from "@/lib/dados";
import { Botao, Campo, AreaTexto, Painel, Rotulo } from "@/components/ui";
import { cn, formatarData, isoParaLocal, localParaIso, validarEmail } from "@/lib/ui";

type Quando = "agora" | "agendar";

export function Compositor({
  documentos,
  preSelecionados,
  sugestoes,
}: {
  documentos: Documento[];
  preSelecionados: string[];
  sugestoes: string[];
}) {
  const router = useRouter();

  const [escolhidos, setEscolhidos] = useState<string[]>(preSelecionados);
  const [destinatarios, setDestinatarios] = useState<string[]>([]);
  const [rascunhoEmail, setRascunhoEmail] = useState("");
  const [assunto, setAssunto] = useState("Documentos digitalizados");
  const [mensagem, setMensagem] = useState("");
  const [quando, setQuando] = useState<Quando>("agora");
  const [dataHora, setDataHora] = useState(() => isoParaLocal(emUmaHora()));
  const [busca, setBusca] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return documentos;
    return documentos.filter((d) => d.titulo.toLowerCase().includes(termo));
  }, [documentos, busca]);

  const naoUsadas = sugestoes.filter((s) => !destinatarios.includes(s));

  function adicionarEmail(valor: string) {
    const email = valor.trim().toLowerCase();
    if (!email) return;
    if (!validarEmail(email)) return setErro(`"${email}" não parece um e-mail válido.`);
    setErro(null);
    setDestinatarios((atuais) => (atuais.includes(email) ? atuais : [...atuais, email]));
    setRascunhoEmail("");
  }

  async function enviar() {
    setErro(null);

    const agendadoPara = quando === "agendar" ? localParaIso(dataHora) : null;
    if (quando === "agendar") {
      if (!agendadoPara) return setErro("Escolha uma data e hora válidas.");
      if (new Date(agendadoPara) <= new Date()) {
        return setErro("A data agendada precisa estar no futuro.");
      }
    }

    setEnviando(true);
    try {
      const supabase = criarClienteNavegador();
      await criarEnvio(supabase, {
        assunto,
        mensagem,
        destinatarios,
        agendadoPara,
        documentos: escolhidos,
      });
      router.push("/envios");
      router.refresh();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível criar o envio.");
      setEnviando(false);
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
      <Painel className="overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 border-b border-borda px-3 py-2.5">
          <span className="text-[13px] font-medium">
            Documentos
            {escolhidos.length > 0 ? (
              <span className="ml-1.5 text-texto-suave">({escolhidos.length} escolhidos)</span>
            ) : null}
          </span>
          <Campo
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar pelo nome"
            className="ml-auto h-8 w-44 rounded-lg text-[13px]"
          />
          <Botao
            tamanho="sm"
            variante="sutil"
            onClick={() =>
              setEscolhidos(
                escolhidos.length === filtrados.length ? [] : filtrados.map((d) => d.id),
              )
            }
          >
            {escolhidos.length === filtrados.length ? "Limpar" : "Selecionar tudo"}
          </Botao>
        </div>

        {filtrados.length === 0 ? (
          <p className="px-4 py-10 text-center text-[13px] text-texto-suave">
            Nenhum documento encontrado.
          </p>
        ) : (
          <ul className="max-h-[60vh] divide-y divide-borda overflow-y-auto">
            {filtrados.map((documento) => {
              const marcado = escolhidos.includes(documento.id);
              return (
                <li key={documento.id}>
                  <label
                    className={cn(
                      "flex cursor-pointer items-center gap-3 px-3 py-2.5 transition",
                      marcado ? "bg-acento-suave/40" : "hover:bg-painel-suave",
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={marcado}
                      onChange={() =>
                        setEscolhidos((atuais) =>
                          marcado
                            ? atuais.filter((id) => id !== documento.id)
                            : [...atuais, documento.id],
                        )
                      }
                      className="size-4 accent-[var(--acento)]"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium">
                        {documento.titulo}
                      </span>
                      <span className="block text-[11px] text-texto-suave">
                        {documento.formato.toUpperCase()} · {documento.paginas} pág. ·{" "}
                        {formatarData(documento.criado_em)}
                      </span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        )}
      </Painel>

      <Painel className="h-fit space-y-4 p-4">
        <div>
          <Rotulo dica="Enter para adicionar">Destinatários</Rotulo>
          {destinatarios.length > 0 ? (
            <ul className="mb-2 flex flex-wrap gap-1.5">
              {destinatarios.map((email) => (
                <li
                  key={email}
                  className="flex items-center gap-1 rounded-full bg-painel-suave py-1 pr-1 pl-2.5 text-[12px]"
                >
                  {email}
                  <button
                    type="button"
                    onClick={() => setDestinatarios((a) => a.filter((x) => x !== email))}
                    aria-label={`Remover ${email}`}
                    className="grid size-4 place-items-center rounded-full text-texto-suave transition hover:text-perigo"
                  >
                    <X className="size-3" />
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          <Campo
            type="email"
            value={rascunhoEmail}
            onChange={(e) => setRascunhoEmail(e.target.value)}
            onBlur={() => adicionarEmail(rascunhoEmail)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === ",") {
                e.preventDefault();
                adicionarEmail(rascunhoEmail);
              }
            }}
            placeholder="pessoa@exemplo.com"
          />
          {naoUsadas.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {naoUsadas.slice(0, 6).map((email) => (
                <button
                  key={email}
                  type="button"
                  onClick={() => adicionarEmail(email)}
                  className="rounded-full border border-borda px-2.5 py-1 text-[12px] text-texto-suave transition hover:border-borda-forte hover:text-texto"
                >
                  + {email}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <label className="block">
          <Rotulo>Assunto</Rotulo>
          <Campo value={assunto} onChange={(e) => setAssunto(e.target.value)} />
        </label>

        <label className="block">
          <Rotulo dica="Opcional">Mensagem</Rotulo>
          <AreaTexto
            rows={3}
            value={mensagem}
            onChange={(e) => setMensagem(e.target.value)}
            placeholder="Segue o documento solicitado."
          />
        </label>

        <div>
          <Rotulo>Quando enviar</Rotulo>
          <div className="flex gap-1 rounded-xl bg-painel-suave p-1">
            {(["agora", "agendar"] as const).map((valor) => (
              <button
                key={valor}
                type="button"
                onClick={() => setQuando(valor)}
                className={cn(
                  "h-8 flex-1 rounded-lg text-[13px] font-medium transition",
                  quando === valor
                    ? "bg-painel text-texto shadow-painel"
                    : "text-texto-suave hover:text-texto",
                )}
              >
                {valor === "agora" ? "Agora" : "Agendar"}
              </button>
            ))}
          </div>
          {quando === "agendar" ? (
            <Campo
              type="datetime-local"
              value={dataHora}
              onChange={(e) => setDataHora(e.target.value)}
              className="mt-2"
            />
          ) : null}
        </div>

        {erro ? <p className="text-[13px] text-perigo">{erro}</p> : null}

        <Botao
          variante="solido"
          tamanho="lg"
          className="w-full"
          onClick={enviar}
          disabled={enviando || escolhidos.length === 0 || destinatarios.length === 0}
        >
          {enviando ? (
            <Loader2 className="size-4 animate-spin" />
          ) : quando === "agora" ? (
            <Send className="size-4" />
          ) : (
            <CalendarClock className="size-4" />
          )}
          {quando === "agora"
            ? `Enviar ${escolhidos.length || ""}`.trim()
            : "Agendar envio"}
        </Botao>

        <p className="text-xs text-texto-suave">
          Cada destinatário recebe links seguros que expiram em 7 dias.
        </p>
      </Painel>
    </div>
  );
}

function emUmaHora() {
  return new Date(Date.now() + 60 * 60 * 1000).toISOString();
}
