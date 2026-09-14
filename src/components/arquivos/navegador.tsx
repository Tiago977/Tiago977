"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  Download,
  FileText,
  FolderClosed,
  FolderPlus,
  Loader2,
  MoveRight,
  ScanLine,
  Send,
  Trash2,
} from "lucide-react";
import type { Documento, Pasta } from "@/lib/types";
import { criarClienteNavegador } from "@/lib/supabase/client";
import {
  baixarArquivo,
  criarPasta,
  excluirDocumento,
  moverDocumentos,
  urlAssinada,
} from "@/lib/dados";
import { baixarBlob, montarZip, nomeDeArquivo } from "@/lib/imagem/exportar";
import { ROTULO_MODO } from "@/lib/imagem/processar";
import { CabecalhoPagina } from "@/components/cabecalho";
import { Dialogo } from "@/components/dialogo";
import { Botao, Campo, Etiqueta, Painel, Vazio } from "@/components/ui";
import { cn, formatarData, formatarTamanho } from "@/lib/ui";

export function NavegadorArquivos({
  pastaAtual,
  pastas,
  documentos,
  miniaturas,
}: {
  pastaAtual: string | null;
  pastas: Pasta[];
  documentos: Documento[];
  miniaturas: Record<string, string>;
}) {
  const router = useRouter();
  const [selecionados, setSelecionados] = useState<string[]>([]);
  const [novaPastaAberta, setNovaPastaAberta] = useState(false);
  const [moverAberto, setMoverAberto] = useState(false);
  const [nomePasta, setNomePasta] = useState("");
  const [destino, setDestino] = useState<string>("");
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const porId = useMemo(() => new Map(pastas.map((p) => [p.id, p])), [pastas]);
  const subpastas = pastas.filter((p) => p.pai_id === pastaAtual);
  const trilha = useMemo(() => construirTrilha(pastaAtual, porId), [pastaAtual, porId]);

  function alternar(id: string) {
    setSelecionados((atuais) =>
      atuais.includes(id) ? atuais.filter((x) => x !== id) : [...atuais, id],
    );
  }

  async function comErro(chave: string, acao: () => Promise<void>) {
    setErro(null);
    setOcupado(chave);
    try {
      await acao();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Algo deu errado.");
    } finally {
      setOcupado(null);
    }
  }

  const abrir = (documento: Documento) =>
    comErro(`abrir:${documento.id}`, async () => {
      const supabase = criarClienteNavegador();
      const url = await urlAssinada(supabase, documento.caminho);
      window.open(url, "_blank", "noopener,noreferrer");
    });

  const baixarUm = (documento: Documento) =>
    comErro(`baixar:${documento.id}`, async () => {
      const supabase = criarClienteNavegador();
      const blob = await baixarArquivo(supabase, documento.caminho);
      baixarBlob(blob, nomeDeArquivo(documento.titulo, documento.formato));
    });

  const baixarSelecionados = () =>
    comErro("baixar-lote", async () => {
      const supabase = criarClienteNavegador();
      const escolhidos = documentos.filter((d) => selecionados.includes(d.id));

      if (escolhidos.length === 1) {
        const blob = await baixarArquivo(supabase, escolhidos[0].caminho);
        baixarBlob(blob, nomeDeArquivo(escolhidos[0].titulo, escolhidos[0].formato));
        return;
      }

      const itens = await Promise.all(
        escolhidos.map(async (d) => ({
          nome: nomeDeArquivo(d.titulo, d.formato),
          conteudo: await baixarArquivo(supabase, d.caminho),
        })),
      );
      baixarBlob(await montarZip(itens), "documentos.zip");
    });

  const excluirSelecionados = () =>
    comErro("excluir", async () => {
      const supabase = criarClienteNavegador();
      for (const documento of documentos.filter((d) => selecionados.includes(d.id))) {
        await excluirDocumento(supabase, documento);
      }
      setSelecionados([]);
      router.refresh();
    });

  const confirmarMover = () =>
    comErro("mover", async () => {
      const supabase = criarClienteNavegador();
      await moverDocumentos(supabase, selecionados, destino || null);
      setMoverAberto(false);
      setSelecionados([]);
      router.refresh();
    });

  const confirmarNovaPasta = () =>
    comErro("nova-pasta", async () => {
      const supabase = criarClienteNavegador();
      await criarPasta(supabase, nomePasta, pastaAtual);
      setNomePasta("");
      setNovaPastaAberta(false);
      router.refresh();
    });

  return (
    <>
      <CabecalhoPagina
        titulo="Arquivos"
        descricao={`${documentos.length} documento${documentos.length === 1 ? "" : "s"} aqui`}
        acoes={
          <>
            <Botao tamanho="sm" onClick={() => setNovaPastaAberta(true)}>
              <FolderPlus className="size-3.5" />
              Nova pasta
            </Botao>
            <Botao tamanho="sm" variante="solido" onClick={() => router.push("/digitalizar")}>
              <ScanLine className="size-3.5" />
              Digitalizar
            </Botao>
          </>
        }
      />

      <div className="flex min-h-0 flex-1 flex-col gap-4 p-4 md:p-6">
        <Trilha trilha={trilha} />

        {erro ? (
          <p className="rounded-xl bg-perigo/10 px-3 py-2 text-[13px] text-perigo">{erro}</p>
        ) : null}

        {subpastas.length > 0 ? (
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {subpastas.map((pasta) => (
              <li key={pasta.id}>
                <Link
                  href={`/arquivos?pasta=${pasta.id}`}
                  className="flex items-center gap-2.5 rounded-xl border border-borda bg-painel px-3 py-2.5 text-sm transition hover:border-borda-forte"
                >
                  <FolderClosed className="size-4 shrink-0 text-texto-suave" />
                  <span className="truncate">{pasta.nome}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : null}

        {documentos.length === 0 ? (
          <Painel className="flex-1">
            <Vazio
              icone={<FileText className="size-5" />}
              titulo="Nenhum documento nesta pasta"
              descricao="Fotografe um documento e ele aparece aqui, já recortado e tratado."
              acao={
                <Botao variante="solido" onClick={() => router.push("/digitalizar")}>
                  <ScanLine className="size-4" />
                  Digitalizar agora
                </Botao>
              }
            />
          </Painel>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {documentos.map((documento) => (
              <CartaoDocumento
                key={documento.id}
                documento={documento}
                miniatura={miniaturas[documento.id]}
                selecionado={selecionados.includes(documento.id)}
                ocupado={ocupado?.endsWith(documento.id) ?? false}
                onAlternar={() => alternar(documento.id)}
                onAbrir={() => abrir(documento)}
                onBaixar={() => baixarUm(documento)}
              />
            ))}
          </ul>
        )}
      </div>

      {selecionados.length > 0 ? (
        <BarraSelecao
          quantidade={selecionados.length}
          ocupado={ocupado}
          onLimpar={() => setSelecionados([])}
          onBaixar={baixarSelecionados}
          onMover={() => {
            setDestino(pastaAtual ?? "");
            setMoverAberto(true);
          }}
          onEnviar={() => router.push(`/envios/novo?docs=${selecionados.join(",")}`)}
          onExcluir={excluirSelecionados}
        />
      ) : null}

      <Dialogo
        titulo="Nova pasta"
        aberto={novaPastaAberta}
        onFechar={() => setNovaPastaAberta(false)}
        rodape={
          <>
            <Botao onClick={() => setNovaPastaAberta(false)}>Cancelar</Botao>
            <Botao
              variante="solido"
              onClick={confirmarNovaPasta}
              disabled={!nomePasta.trim() || ocupado === "nova-pasta"}
            >
              Criar
            </Botao>
          </>
        }
      >
        <Campo
          autoFocus
          value={nomePasta}
          onChange={(e) => setNomePasta(e.target.value)}
          placeholder="Ex.: Documentos pessoais"
          onKeyDown={(e) => {
            if (e.key === "Enter" && nomePasta.trim()) confirmarNovaPasta();
          }}
        />
        {trilha.length > 0 ? (
          <p className="mt-2 text-xs text-texto-suave">
            Será criada dentro de {trilha[trilha.length - 1].nome}.
          </p>
        ) : null}
      </Dialogo>

      <Dialogo
        titulo={`Mover ${selecionados.length} documento${selecionados.length === 1 ? "" : "s"}`}
        aberto={moverAberto}
        onFechar={() => setMoverAberto(false)}
        rodape={
          <>
            <Botao onClick={() => setMoverAberto(false)}>Cancelar</Botao>
            <Botao variante="solido" onClick={confirmarMover} disabled={ocupado === "mover"}>
              Mover
            </Botao>
          </>
        }
      >
        <select
          value={destino}
          onChange={(e) => setDestino(e.target.value)}
          className="h-10 w-full rounded-xl border border-borda bg-painel px-3 text-sm focus:border-acento focus:outline-none"
        >
          <option value="">Sem pasta</option>
          {pastas.map((pasta) => (
            <option key={pasta.id} value={pasta.id}>
              {caminhoDaPasta(pasta, porId)}
            </option>
          ))}
        </select>
      </Dialogo>
    </>
  );
}

function Trilha({ trilha }: { trilha: Pasta[] }) {
  return (
    <nav aria-label="Caminho" className="flex flex-wrap items-center gap-1 text-[13px]">
      <Link
        href="/arquivos"
        className={cn(
          "rounded-lg px-2 py-1 transition hover:bg-painel-suave",
          trilha.length === 0 ? "font-medium text-texto" : "text-texto-suave",
        )}
      >
        Início
      </Link>
      {trilha.map((pasta, indice) => (
        <span key={pasta.id} className="flex items-center gap-1">
          <ChevronRight className="size-3.5 text-texto-suave" />
          <Link
            href={`/arquivos?pasta=${pasta.id}`}
            className={cn(
              "rounded-lg px-2 py-1 transition hover:bg-painel-suave",
              indice === trilha.length - 1 ? "font-medium text-texto" : "text-texto-suave",
            )}
          >
            {pasta.nome}
          </Link>
        </span>
      ))}
    </nav>
  );
}

function CartaoDocumento({
  documento,
  miniatura,
  selecionado,
  ocupado,
  onAlternar,
  onAbrir,
  onBaixar,
}: {
  documento: Documento;
  miniatura?: string;
  selecionado: boolean;
  ocupado: boolean;
  onAlternar: () => void;
  onAbrir: () => void;
  onBaixar: () => void;
}) {
  return (
    <li
      className={cn(
        "group relative overflow-hidden rounded-xl border bg-painel transition",
        selecionado ? "border-acento" : "border-borda hover:border-borda-forte",
      )}
    >
      <label className="absolute top-2 left-2 z-10 cursor-pointer p-1">
        <input
          type="checkbox"
          checked={selecionado}
          onChange={onAlternar}
          className="size-4 accent-[var(--acento)]"
          aria-label={`Selecionar ${documento.titulo}`}
        />
      </label>

      <button
        type="button"
        onClick={onAbrir}
        className="block aspect-[3/4] w-full bg-painel-suave"
        aria-label={`Abrir ${documento.titulo}`}
      >
        {miniatura ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={miniatura} alt="" className="size-full object-cover" loading="lazy" />
        ) : (
          <span className="grid size-full place-items-center text-texto-suave">
            <FileText className="size-6" />
          </span>
        )}
      </button>

      <div className="space-y-1.5 border-t border-borda p-2.5">
        <p className="truncate text-[13px] font-medium" title={documento.titulo}>
          {documento.titulo}
        </p>
        <div className="flex flex-wrap items-center gap-1">
          <Etiqueta>{documento.formato.toUpperCase()}</Etiqueta>
          <Etiqueta>{ROTULO_MODO[documento.modo_cor]}</Etiqueta>
          {documento.paginas > 1 ? <Etiqueta>{documento.paginas} pág.</Etiqueta> : null}
        </div>
        <p className="text-[11px] text-texto-suave">
          {formatarData(documento.criado_em)} · {formatarTamanho(documento.tamanho_bytes)}
        </p>
      </div>

      <button
        type="button"
        onClick={onBaixar}
        aria-label={`Baixar ${documento.titulo}`}
        className="absolute top-2 right-2 grid size-8 place-items-center rounded-lg border border-borda bg-painel/90 text-texto-suave opacity-0 backdrop-blur transition group-hover:opacity-100 focus-visible:opacity-100 hover:text-texto"
      >
        {ocupado ? <Loader2 className="size-3.5 animate-spin" /> : <Download className="size-3.5" />}
      </button>
    </li>
  );
}

function BarraSelecao({
  quantidade,
  ocupado,
  onLimpar,
  onBaixar,
  onMover,
  onEnviar,
  onExcluir,
}: {
  quantidade: number;
  ocupado: string | null;
  onLimpar: () => void;
  onBaixar: () => void;
  onMover: () => void;
  onEnviar: () => void;
  onExcluir: () => void;
}) {
  return (
    <div className="pointer-events-none sticky bottom-0 z-20 p-3 md:p-6">
      <div className="surgir pointer-events-auto mx-auto flex max-w-2xl flex-wrap items-center gap-2 rounded-2xl border border-borda bg-painel p-2 shadow-painel">
        <span className="px-2 text-[13px] font-medium">{quantidade} selecionado{quantidade === 1 ? "" : "s"}</span>
        <div className="ml-auto flex flex-wrap gap-1.5">
          <Botao tamanho="sm" onClick={onBaixar} disabled={ocupado === "baixar-lote"}>
            {ocupado === "baixar-lote" ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Download className="size-3.5" />
            )}
            Baixar
          </Botao>
          <Botao tamanho="sm" onClick={onMover}>
            <MoveRight className="size-3.5" />
            Mover
          </Botao>
          <Botao tamanho="sm" variante="solido" onClick={onEnviar}>
            <Send className="size-3.5" />
            Enviar
          </Botao>
          <Botao tamanho="sm" variante="perigo" onClick={onExcluir} disabled={ocupado === "excluir"}>
            {ocupado === "excluir" ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Trash2 className="size-3.5" />
            )}
            Excluir
          </Botao>
          <Botao tamanho="sm" variante="sutil" onClick={onLimpar}>
            Cancelar
          </Botao>
        </div>
      </div>
    </div>
  );
}

function construirTrilha(pastaId: string | null, porId: Map<string, Pasta>): Pasta[] {
  const trilha: Pasta[] = [];
  let atual = pastaId ? porId.get(pastaId) : undefined;
  // O limite evita laço infinito caso um ciclo escape para o banco.
  while (atual && trilha.length < 32) {
    trilha.unshift(atual);
    atual = atual.pai_id ? porId.get(atual.pai_id) : undefined;
  }
  return trilha;
}

function caminhoDaPasta(pasta: Pasta, porId: Map<string, Pasta>) {
  return construirTrilha(pasta.id, porId)
    .map((p) => p.nome)
    .join(" / ");
}
