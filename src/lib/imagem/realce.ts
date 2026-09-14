import type { ModoCor } from "@/lib/types";
import {
  borrarCaixa,
  canalParaImageData,
  integral,
  paraCinza,
  somaRetangulo,
} from "./nucleo";

const GANHO_MAXIMO = 2.4;
const FORCA_NITIDEZ = 0.7;
const TOLERANCIA_LIMIAR = 0.15;

/** Aplica o tratamento de documento escolhido e devolve a página pronta. */
export function realcar(imagem: ImageData, modo: ModoCor): ImageData {
  switch (modo) {
    case "pb":
      return pretoEBranco(imagem);
    case "cinza":
      return escalaDeCinza(imagem);
    default:
      return colorido(imagem);
  }
}

/**
 * Raio do borrão usado para estimar a iluminação do papel. Precisa ser bem
 * maior que as letras (senão apaga o texto) e menor que a página.
 */
function raioIluminacao(largura: number, altura: number) {
  return Math.max(8, Math.round(Math.min(largura, altura) / 12));
}

/**
 * Divide a imagem pela própria iluminação estimada. É o passo que remove
 * sombra de mão, vinheta e papel amarelado, deixando o fundo branco uniforme.
 */
function ganhosDeIluminacao(cinza: Uint8ClampedArray, largura: number, altura: number) {
  const fundo = borrarCaixa(cinza, largura, altura, raioIluminacao(largura, altura));
  const ganhos = new Float32Array(cinza.length);
  for (let i = 0; i < ganhos.length; i++) {
    ganhos[i] = Math.min(GANHO_MAXIMO, 255 / Math.max(1, fundo[i]));
  }
  return ganhos;
}

/** Limites de corte que descartam 0,5% dos pixels em cada ponta do histograma. */
function faixaUtil(canal: Uint8ClampedArray) {
  const histograma = new Uint32Array(256);
  for (let i = 0; i < canal.length; i++) histograma[canal[i]]++;

  const corte = Math.max(1, Math.round(canal.length * 0.005));
  let baixo = 0;
  let alto = 255;

  for (let acumulado = 0, v = 0; v < 256; v++) {
    acumulado += histograma[v];
    if (acumulado > corte) {
      baixo = v;
      break;
    }
  }
  for (let acumulado = 0, v = 255; v >= 0; v--) {
    acumulado += histograma[v];
    if (acumulado > corte) {
      alto = v;
      break;
    }
  }

  if (alto - baixo < 24) return { baixo: 0, alto: 255 };
  return { baixo, alto };
}

/** Diferença entre a imagem e sua versão borrada: realça bordas de letras. */
function detalhe(cinza: Uint8ClampedArray, largura: number, altura: number) {
  const suave = borrarCaixa(cinza, largura, altura, 1);
  const saida = new Float32Array(cinza.length);
  for (let i = 0; i < saida.length; i++) saida[i] = cinza[i] - suave[i];
  return saida;
}

function colorido(imagem: ImageData): ImageData {
  const { width: largura, height: altura, data } = imagem;
  const cinza = paraCinza(imagem);
  const ganhos = ganhosDeIluminacao(cinza, largura, altura);

  const clareado = new Uint8ClampedArray(cinza.length);
  for (let i = 0; i < cinza.length; i++) clareado[i] = cinza[i] * ganhos[i];
  const { baixo, alto } = faixaUtil(clareado);
  const amplitude = 255 / (alto - baixo);
  const nitidez = detalhe(clareado, largura, altura);

  const saida = new ImageData(largura, altura);
  for (let i = 0, p = 0; i < cinza.length; i++, p += 4) {
    const reforco = nitidez[i] * FORCA_NITIDEZ;
    for (let canal = 0; canal < 3; canal++) {
      const clareada = data[p + canal] * ganhos[i];
      saida.data[p + canal] = (clareada - baixo) * amplitude + reforco;
    }
    saida.data[p + 3] = 255;
  }
  return saida;
}

function escalaDeCinza(imagem: ImageData): ImageData {
  const { width: largura, height: altura } = imagem;
  const cinza = paraCinza(imagem);
  const ganhos = ganhosDeIluminacao(cinza, largura, altura);

  const clareado = new Uint8ClampedArray(cinza.length);
  for (let i = 0; i < cinza.length; i++) clareado[i] = cinza[i] * ganhos[i];
  const { baixo, alto } = faixaUtil(clareado);
  const amplitude = 255 / (alto - baixo);
  const nitidez = detalhe(clareado, largura, altura);

  const saida = new Uint8ClampedArray(cinza.length);
  for (let i = 0; i < saida.length; i++) {
    saida[i] = (clareado[i] - baixo) * amplitude + nitidez[i] * FORCA_NITIDEZ;
  }
  return canalParaImageData(saida, largura, altura);
}

function pretoEBranco(imagem: ImageData): ImageData {
  const { width: largura, height: altura } = imagem;
  const cinza = paraCinza(imagem);
  const ganhos = ganhosDeIluminacao(cinza, largura, altura);

  const clareado = new Uint8ClampedArray(cinza.length);
  for (let i = 0; i < cinza.length; i++) clareado[i] = cinza[i] * ganhos[i];

  const saida = limiarAdaptativo(clareado, largura, altura);
  return canalParaImageData(saida, largura, altura);
}

/**
 * Limiarização adaptativa de Bradley: cada pixel é comparado com a média da
 * sua vizinhança, não com um valor fixo. Preserva texto claro e escuro na
 * mesma página sem criar manchas pretas nas sombras.
 */
function limiarAdaptativo(
  cinza: Uint8ClampedArray,
  largura: number,
  altura: number,
): Uint8ClampedArray {
  const soma = integral(cinza, largura, altura);
  const passo = largura + 1;
  const raio = Math.max(6, Math.round(Math.min(largura, altura) / 40));
  const saida = new Uint8ClampedArray(cinza.length);

  for (let y = 0; y < altura; y++) {
    const y0 = Math.max(0, y - raio);
    const y1 = Math.min(altura - 1, y + raio);
    for (let x = 0; x < largura; x++) {
      const x0 = Math.max(0, x - raio);
      const x1 = Math.min(largura - 1, x + raio);
      const contagem = (x1 - x0 + 1) * (y1 - y0 + 1);
      const total = somaRetangulo(soma, passo, x0, y0, x1, y1);
      const i = y * largura + x;
      saida[i] = cinza[i] * contagem < total * (1 - TOLERANCIA_LIMIAR) ? 0 : 255;
    }
  }
  return saida;
}
