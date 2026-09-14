"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  Loader2,
  RotateCw,
  Scan,
  Maximize,
  Trash2,
  X,
} from "lucide-react";
import type { Formato, ModoCor, Pasta, Resolucao } from "@/lib/types";
import { criarClienteNavegador } from "@/lib/supabase/client";
import { salvarDocumento } from "@/lib/dados";
import { detectarDocumento, quadCompleto } from "@/lib/imagem/deteccao";
import { canvasParaBlob, carregarImagem, type Quad } from "@/lib/imagem/nucleo";
import { montarArquivo } from "@/lib/imagem/exportar";
import {
  gerarMiniatura,
  prepararPagina,
  renderizarPagina,
  ROTULO_MODO,
  ROTULO_RESOLUCAO,
  type PaginaCapturada,
  type PaginaRenderizada,
} from "@/lib/imagem/processar";
import { Botao, Campo, Painel, Rotulo } from "@/components/ui";
import { cn } from "@/lib/ui";
import { Captura } from "./captura";
import { EditorCantos } from "./editor-cantos";

const LADO_PREVIA = 760;
const MODOS: ModoCor[] = ["cor", "cinza", "pb"];
const RESOLUCOES: Resolucao[] = ["original", "alta", "maxima"];

export function PainelDigitalizar({ pastas }: { pastas: Pasta[] }) {
  const router = useRouter();

  const [paginas, setPaginas] = useState<PaginaCapturada[]>([]);
  const [atual, setAtual] = useState(0);
  const [modo, setModo] = useState<ModoCor>("cor");
  const [resolucao, setResolucao] = useState<Resolucao>("alta");
  const [formato, setFormato] = useState<Formato>("pdf");
  const [titulo, setTitulo] = useState("");
  const [pastaId, setPastaId] = useState<string | null>(null);

  const [previa, setPrevia] = useState<string | null>(null);
  const [processando, setProcessando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const pagina = paginas[atual];
  const varias = paginas.length > 1;
  const formatoEfetivo: Formato = varias ? "pdf" : formato;

  // Espelha o estado para que a limpeza na desmontagem veja a lista atual.
  const paginasRef = useRef(paginas);
  useEffect(() => {
    paginasRef.current = paginas;
  }, [paginas]);

  useEffect(() => {
    return () => paginasRef.current.forEach((p) => URL.revokeObjectURL(p.previa));
  }, []);

  const adicionar = useCallback(async (arquivos: Blob[]) => {
    setErro(null);
    setProcessando(true);
    try {
      const novas = await Promise.all(arquivos.map(prepararPagina));
      const primeiraNova = paginasRef.current.length;
      setPaginas((anteriores) => [...anteriores, ...novas]);
      setAtual(primeiraNova);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível ler a imagem.");
    } finally {
      setProcessando(false);
    }
  }, []);

  function alterarPagina(mudanca: Partial<PaginaCapturada>) {
    setPaginas((anteriores) =>
      anteriores.map((p, i) => (i === atual ? { ...p, ...mudanca } : p)),
    );
  }

  function remover(indice: number) {
    URL.revokeObjectURL(paginas[indice].previa);
    setPaginas((anteriores) => anteriores.filter((_, i) => i !== indice));
    setAtual((a) => Math.max(0, Math.min(a, paginas.length - 2)));
  }

  async function redetectar() {
    if (!pagina) return;
    const imagem = await carregarImagem(pagina.arquivo);
    try {
      alterarPagina({ quad: detectarDocumento(imagem, pagina.largura, pagina.altura) });
    } finally {
      if ("close" in imagem) imagem.close();
    }
  }

  // Libera a prévia anterior assim que outra a substitui, e na desmontagem.
  useEffect(() => {
    if (!previa) return;
    return () => URL.revokeObjectURL(previa);
  }, [previa]);

  // Prévia do resultado, recalculada em baixa resolução a cada ajuste.
  const versaoPrevia = useRef(0);
  useEffect(() => {
    if (!pagina) return;

    const versao = ++versaoPrevia.current;
    const temporizador = setTimeout(async () => {
      setProcessando(true);
      try {
        const renderizada = await renderizarPagina(pagina, modo, resolucao, LADO_PREVIA);
        const blob = await canvasParaBlob(renderizada.canvas, "image/jpeg", 0.82);
        if (versao !== versaoPrevia.current) return;
        setPrevia(URL.createObjectURL(blob));
      } catch (e) {
        if (versao === versaoPrevia.current) {
          setErro(e instanceof Error ? e.message : "Falha ao gerar a prévia.");
        }
      } finally {
        if (versao === versaoPrevia.current) setProcessando(false);
      }
    }, 220);

    return () => clearTimeout(temporizador);
  }, [pagina, modo, resolucao]);

  async function salvar() {
    if (paginas.length === 0) return;
    setSalvando(true);
    setErro(null);

    try {
      const renderizadas: PaginaRenderizada[] = [];
      for (const p of paginas) {
        renderizadas.push(await renderizarPagina(p, modo, resolucao));
      }

      const arquivo = await montarArquivo(renderizadas, formatoEfetivo, modo);
      const miniatura = await gerarMiniatura(renderizadas[0]);
      const soltas = await Promise.all(
        renderizadas.map(async (r) => ({
          blob: await canvasParaBlob(r.canvas, "image/jpeg", 0.85),
          largura: r.largura,
          altura: r.altura,
        })),
      );

      const supabase = criarClienteNavegador();
      await salvarDocumento(supabase, {
        titulo: titulo.trim() || `Digitalização de ${new Date().toLocaleDateString("pt-BR")}`,
        pastaId,
        formato: formatoEfetivo,
        modo,
        resolucao,
        arquivo,
        miniatura,
        paginas: soltas,
      });

      router.push(pastaId ? `/arquivos?pasta=${pastaId}` : "/arquivos");
      router.refresh();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível salvar o documento.");
      setSalvando(false);
    }
  }

  if (paginas.length === 0) {
    return (
      <div className="mx-auto w-full max-w-md space-y-4">
        <Captura onCapturar={adicionar} ocupado={processando} />
        {erro ? <p className="text-[13px] text-perigo">{erro}</p> : null}
        <p className="text-center text-[13px] text-texto-suave">
          O recorte e o realce são feitos no seu aparelho — nenhuma foto sai daqui antes
          de você salvar.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-4">
        <FaixaPaginas
          paginas={paginas}
          atual={atual}
          onSelecionar={setAtual}
          onRemover={remover}
        />

        {pagina ? (
          <Painel className="p-3">
            <EditorCantos
              previa={pagina.previa}
              largura={pagina.largura}
              altura={pagina.altura}
              quad={pagina.quad}
              onChange={(quad: Quad) => alterarPagina({ quad })}
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <Botao tamanho="sm" onClick={redetectar}>
                <Scan className="size-3.5" />
                Detectar de novo
              </Botao>
              <Botao tamanho="sm" onClick={() => alterarPagina({ quad: quadCompleto() })}>
                <Maximize className="size-3.5" />
                Foto inteira
              </Botao>
              <Botao
                tamanho="sm"
                onClick={() =>
                  alterarPagina({ rotacao: (((pagina.rotacao + 90) % 360) as 0 | 90 | 180 | 270) })
                }
              >
                <RotateCw className="size-3.5" />
                Girar
              </Botao>
            </div>
          </Painel>
        ) : null}

        <Captura onCapturar={adicionar} ocupado={processando} />
      </div>

      <div className="space-y-4">
        <Painel className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-borda px-3 py-2">
            <span className="text-[13px] font-medium">Resultado</span>
            {processando ? (
              <Loader2 className="size-3.5 animate-spin text-texto-suave" />
            ) : null}
          </div>
          <div className="grid min-h-56 place-items-center bg-painel-suave p-3">
            {previa ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previa}
                alt="Prévia da página tratada"
                className="max-h-72 w-auto rounded-lg shadow-painel"
              />
            ) : (
              <span className="text-[13px] text-texto-suave">Gerando prévia…</span>
            )}
          </div>
        </Painel>

        <Painel className="space-y-4 p-4">
          <div>
            <Rotulo>Cor</Rotulo>
            <Seletor
              opcoes={MODOS.map((m) => ({ valor: m, rotulo: ROTULO_MODO[m] }))}
              valor={modo}
              onChange={setModo}
            />
          </div>

          <div>
            <Rotulo dica="Textos pequenos pedem mais">Resolução</Rotulo>
            <Seletor
              opcoes={RESOLUCOES.map((r) => ({ valor: r, rotulo: ROTULO_RESOLUCAO[r] }))}
              valor={resolucao}
              onChange={setResolucao}
            />
          </div>

          <div>
            <Rotulo dica={varias ? `${paginas.length} páginas` : undefined}>Formato</Rotulo>
            <Seletor
              opcoes={[
                { valor: "pdf" as const, rotulo: "PDF" },
                { valor: "jpeg" as const, rotulo: "JPG", desabilitado: varias },
                { valor: "png" as const, rotulo: "PNG", desabilitado: varias },
              ]}
              valor={formatoEfetivo}
              onChange={setFormato}
            />
            {varias ? (
              <p className="mt-1.5 text-xs text-texto-suave">
                Documentos com mais de uma página são salvos em PDF.
              </p>
            ) : null}
          </div>

          <label className="block">
            <Rotulo>Nome</Rotulo>
            <Campo
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex.: Contrato de aluguel"
            />
          </label>

          <label className="block">
            <Rotulo>Pasta</Rotulo>
            <select
              value={pastaId ?? ""}
              onChange={(e) => setPastaId(e.target.value || null)}
              className="h-10 w-full rounded-xl border border-borda bg-painel px-3 text-sm focus:border-acento focus:outline-none"
            >
              <option value="">Sem pasta</option>
              {pastas.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
            </select>
          </label>

          {erro ? <p className="text-[13px] text-perigo">{erro}</p> : null}

          <Botao
            variante="solido"
            tamanho="lg"
            className="w-full"
            onClick={salvar}
            disabled={salvando}
          >
            {salvando ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
            {salvando ? "Salvando…" : `Salvar ${paginas.length > 1 ? `${paginas.length} páginas` : "documento"}`}
          </Botao>
        </Painel>
      </div>
    </div>
  );
}

function FaixaPaginas({
  paginas,
  atual,
  onSelecionar,
  onRemover,
}: {
  paginas: PaginaCapturada[];
  atual: number;
  onSelecionar: (indice: number) => void;
  onRemover: (indice: number) => void;
}) {
  return (
    <div className="rolagem-limpa flex gap-2 overflow-x-auto pb-1">
      {paginas.map((p, i) => (
        <div key={p.id} className="relative shrink-0">
          <button
            type="button"
            onClick={() => onSelecionar(i)}
            aria-current={i === atual ? "true" : undefined}
            className={cn(
              "block size-16 overflow-hidden rounded-xl border-2 transition",
              i === atual ? "border-acento" : "border-borda hover:border-borda-forte",
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.previa} alt={`Página ${i + 1}`} className="size-full object-cover" />
          </button>
          <button
            type="button"
            onClick={() => onRemover(i)}
            aria-label={`Remover página ${i + 1}`}
            className="absolute -top-1.5 -right-1.5 grid size-5 place-items-center rounded-full border border-borda bg-painel text-texto-suave transition hover:text-perigo"
          >
            <X className="size-3" />
          </button>
        </div>
      ))}
      {paginas.length > 1 ? (
        <span className="self-center pl-1 text-xs text-texto-suave">
          <Trash2 className="mr-1 inline size-3" />
          Toque no × para descartar
        </span>
      ) : null}
    </div>
  );
}

function Seletor<T extends string>({
  opcoes,
  valor,
  onChange,
}: {
  opcoes: { valor: T; rotulo: string; desabilitado?: boolean }[];
  valor: T;
  onChange: (valor: T) => void;
}) {
  return (
    <div className="flex gap-1 rounded-xl bg-painel-suave p-1">
      {opcoes.map((opcao) => (
        <button
          key={opcao.valor}
          type="button"
          disabled={opcao.desabilitado}
          onClick={() => onChange(opcao.valor)}
          className={cn(
            "h-8 flex-1 rounded-lg text-[13px] font-medium transition disabled:opacity-35",
            valor === opcao.valor
              ? "bg-painel text-texto shadow-painel"
              : "text-texto-suave hover:text-texto",
          )}
        >
          {opcao.rotulo}
        </button>
      ))}
    </div>
  );
}
