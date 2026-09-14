"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, Loader2, Send } from "lucide-react";
import type { Envio, StatusEnvio } from "@/lib/types";
import { criarClienteNavegador } from "@/lib/supabase/client";
import { cancelarEnvio } from "@/lib/dados";
import { Botao, Etiqueta, Painel, Vazio } from "@/components/ui";
import { formatarDataHora } from "@/lib/ui";

const ROTULO: Record<StatusEnvio, string> = {
  agendado: "Agendado",
  processando: "Enviando",
  enviado: "Enviado",
  falhou: "Falhou",
  cancelado: "Cancelado",
};

const TOM: Record<StatusEnvio, "neutro" | "acento" | "sucesso" | "aviso" | "perigo"> = {
  agendado: "acento",
  processando: "aviso",
  enviado: "sucesso",
  falhou: "perigo",
  cancelado: "neutro",
};

export function ListaEnvios({
  envios,
  quantidades,
}: {
  envios: Envio[];
  quantidades: Record<string, number>;
}) {
  const router = useRouter();
  const [cancelando, setCancelando] = useState<string | null>(null);

  async function cancelar(id: string) {
    setCancelando(id);
    try {
      await cancelarEnvio(criarClienteNavegador(), id);
      router.refresh();
    } finally {
      setCancelando(null);
    }
  }

  if (envios.length === 0) {
    return (
      <Painel>
        <Vazio
          icone={<Send className="size-5" />}
          titulo="Nenhum envio ainda"
          descricao="Selecione documentos e mande para uma ou várias pessoas de uma vez, na hora ou na data que escolher."
          acao={
            <Botao variante="solido" onClick={() => router.push("/envios/novo")}>
              <Send className="size-4" />
              Criar envio
            </Botao>
          }
        />
      </Painel>
    );
  }

  return (
    <ul className="space-y-2">
      {envios.map((envio) => (
        <li key={envio.id}>
          <Painel className="flex flex-wrap items-start gap-3 p-3.5">
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="truncate text-[13px] font-medium">
                  {envio.assunto || "Sem assunto"}
                </span>
                <Etiqueta tom={TOM[envio.status]}>{ROTULO[envio.status]}</Etiqueta>
              </div>

              <p className="text-[12px] text-texto-suave">
                {quantidades[envio.id] ?? 0} documento
                {(quantidades[envio.id] ?? 0) === 1 ? "" : "s"} ·{" "}
                {envio.destinatarios.length} destinatário
                {envio.destinatarios.length === 1 ? "" : "s"}
              </p>

              <p className="truncate text-[12px] text-texto-suave">
                {envio.destinatarios.join(", ")}
              </p>

              <p className="flex items-center gap-1 text-[12px] text-texto-suave">
                {envio.status === "agendado" && envio.agendado_para ? (
                  <>
                    <CalendarClock className="size-3" />
                    Sai em {formatarDataHora(envio.agendado_para)}
                  </>
                ) : envio.enviado_em ? (
                  <>Enviado em {formatarDataHora(envio.enviado_em)}</>
                ) : (
                  <>Criado em {formatarDataHora(envio.criado_em)}</>
                )}
              </p>

              {envio.erro ? (
                <p className="rounded-lg bg-perigo/10 px-2 py-1.5 text-[12px] text-perigo">
                  {envio.erro}
                </p>
              ) : null}
            </div>

            {envio.status === "agendado" ? (
              <Botao
                tamanho="sm"
                variante="perigo"
                onClick={() => cancelar(envio.id)}
                disabled={cancelando === envio.id}
              >
                {cancelando === envio.id ? <Loader2 className="size-3.5 animate-spin" /> : null}
                Cancelar
              </Botao>
            ) : null}
          </Painel>
        </li>
      ))}
    </ul>
  );
}
