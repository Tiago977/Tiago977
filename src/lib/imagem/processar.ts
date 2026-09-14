import type { ModoCor, Resolucao } from "@/lib/types";
import { detectarDocumento } from "./deteccao";
import {
  amostrar,
  canvasParaBlob,
  carregarImagem,
  imageDataParaCanvas,
  type Quad,
} from "./nucleo";
import { corrigirPerspectiva, tamanhoDestino } from "./perspectiva";
import { realcar } from "./realce";

/** Maior lado usado ao ler a foto original, para limitar o uso de memória. */
const LADO_LEITURA = 3200;

const LADO_POR_RESOLUCAO: Record<Resolucao, number> = {
  original: LADO_LEITURA,
  alta: 2000,
  maxima: 2800,
};

export const ROTULO_RESOLUCAO: Record<Resolucao, string> = {
  original: "Original",
  alta: "Alta",
  maxima: "Máxima",
};

export const ROTULO_MODO: Record<ModoCor, string> = {
  cor: "Colorido",
  cinza: "Tons de cinza",
  pb: "Preto e branco",
};

export type PaginaCapturada = {
  id: string;
  arquivo: Blob;
  previa: string;
  largura: number;
  altura: number;
  quad: Quad;
  /** Giro aplicado depois do endireitamento, em graus no sentido horário. */
  rotacao: 0 | 90 | 180 | 270;
};

/** Lê a foto, detecta os cantos do documento e prepara a página para edição. */
export async function prepararPagina(arquivo: Blob): Promise<PaginaCapturada> {
  const imagem = await carregarImagem(arquivo);
  const largura = "naturalWidth" in imagem ? imagem.naturalWidth : imagem.width;
  const altura = "naturalHeight" in imagem ? imagem.naturalHeight : imagem.height;

  const quad = detectarDocumento(imagem, largura, altura);
  const previa = URL.createObjectURL(arquivo);

  if ("close" in imagem) imagem.close();

  return { id: crypto.randomUUID(), arquivo, previa, largura, altura, quad, rotacao: 0 };
}

export type PaginaRenderizada = {
  canvas: HTMLCanvasElement;
  largura: number;
  altura: number;
};

/** Endireita o recorte e aplica o tratamento de cor na resolução escolhida. */
export async function renderizarPagina(
  pagina: PaginaCapturada,
  modo: ModoCor,
  resolucao: Resolucao,
  ladoMaximo?: number,
): Promise<PaginaRenderizada> {
  const imagem = await carregarImagem(pagina.arquivo);
  try {
    // Ler a foto maior que o destino não melhora o resultado e custa memória.
    const alvo = ladoMaximo ?? LADO_POR_RESOLUCAO[resolucao];
    const ladoLeitura = Math.min(LADO_LEITURA, Math.round(alvo * 1.6));
    const escalaLeitura = Math.min(1, ladoLeitura / Math.max(pagina.largura, pagina.altura));
    const origem = amostrar(
      imagem,
      Math.round(pagina.largura * escalaLeitura),
      Math.round(pagina.altura * escalaLeitura),
    );

    const { largura, altura } = tamanhoDestino(
      escalarQuad(pagina.quad, origem.width, origem.height),
      ladoMaximo ?? LADO_POR_RESOLUCAO[resolucao],
    );

    const endireitada = corrigirPerspectiva(origem, pagina.quad, largura, altura);
    const tratada = realcar(endireitada, modo);
    return girar(imageDataParaCanvas(tratada), pagina.rotacao);
  } finally {
    if ("close" in imagem) imagem.close();
  }
}

function girar(canvas: HTMLCanvasElement, graus: 0 | 90 | 180 | 270): PaginaRenderizada {
  if (graus === 0) {
    return { canvas, largura: canvas.width, altura: canvas.height };
  }

  const trocaLados = graus === 90 || graus === 270;
  const destino = document.createElement("canvas");
  destino.width = trocaLados ? canvas.height : canvas.width;
  destino.height = trocaLados ? canvas.width : canvas.height;

  const ctx = destino.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D indisponível neste navegador.");
  ctx.translate(destino.width / 2, destino.height / 2);
  ctx.rotate((graus * Math.PI) / 180);
  ctx.drawImage(canvas, -canvas.width / 2, -canvas.height / 2);

  return { canvas: destino, largura: destino.width, altura: destino.height };
}

export async function gerarMiniatura(
  pagina: PaginaRenderizada,
  ladoMaximo = 360,
): Promise<Blob> {
  const escala = Math.min(1, ladoMaximo / Math.max(pagina.largura, pagina.altura));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(pagina.largura * escala));
  canvas.height = Math.max(1, Math.round(pagina.altura * escala));

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D indisponível neste navegador.");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(pagina.canvas, 0, 0, canvas.width, canvas.height);

  return canvasParaBlob(canvas, "image/jpeg", 0.75);
}

function escalarQuad(quad: Quad, largura: number, altura: number): Quad {
  return quad.map((p) => ({ x: p.x * largura, y: p.y * altura })) as Quad;
}
