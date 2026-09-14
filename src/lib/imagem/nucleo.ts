export type Ponto = { x: number; y: number };

/** Cantos do documento em ordem: superior-esquerdo, superior-direito, inferior-direito, inferior-esquerdo. */
export type Quad = [Ponto, Ponto, Ponto, Ponto];

export function limitar(valor: number, minimo: number, maximo: number) {
  return valor < minimo ? minimo : valor > maximo ? maximo : valor;
}

export function distancia(a: Ponto, b: Ponto) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function paraCinza(imagem: ImageData): Uint8ClampedArray {
  const { data, width, height } = imagem;
  const cinza = new Uint8ClampedArray(width * height);
  for (let i = 0, p = 0; i < cinza.length; i++, p += 4) {
    cinza[i] = (data[p] * 299 + data[p + 1] * 587 + data[p + 2] * 114) / 1000;
  }
  return cinza;
}

/**
 * Imagem integral (soma acumulada) de (largura+1) x (altura+1).
 * Permite somar qualquer retângulo em tempo constante, base do borrão
 * de caixa, da normalização de fundo e da limiarização adaptativa.
 */
export function integral(canal: Uint8ClampedArray, largura: number, altura: number): Uint32Array {
  const passo = largura + 1;
  const soma = new Uint32Array(passo * (altura + 1));
  for (let y = 0; y < altura; y++) {
    let linha = 0;
    const base = y * largura;
    const destino = (y + 1) * passo;
    const anterior = y * passo;
    for (let x = 0; x < largura; x++) {
      linha += canal[base + x];
      soma[destino + x + 1] = soma[anterior + x + 1] + linha;
    }
  }
  return soma;
}

/** Soma dos pixels no retângulo [x0,x1] x [y0,y1], inclusivo, já recortado à imagem. */
export function somaRetangulo(
  soma: Uint32Array,
  passo: number,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
) {
  return (
    soma[(y1 + 1) * passo + (x1 + 1)] -
    soma[y0 * passo + (x1 + 1)] -
    soma[(y1 + 1) * passo + x0] +
    soma[y0 * passo + x0]
  );
}

/** Média local em janela quadrada, calculada pela imagem integral. */
export function borrarCaixa(
  canal: Uint8ClampedArray,
  largura: number,
  altura: number,
  raio: number,
): Uint8ClampedArray {
  if (raio < 1) return canal.slice();
  const soma = integral(canal, largura, altura);
  const passo = largura + 1;
  const saida = new Uint8ClampedArray(canal.length);
  for (let y = 0; y < altura; y++) {
    const y0 = Math.max(0, y - raio);
    const y1 = Math.min(altura - 1, y + raio);
    for (let x = 0; x < largura; x++) {
      const x0 = Math.max(0, x - raio);
      const x1 = Math.min(largura - 1, x + raio);
      const total = somaRetangulo(soma, passo, x0, y0, x1, y1);
      saida[y * largura + x] = total / ((x1 - x0 + 1) * (y1 - y0 + 1));
    }
  }
  return saida;
}

/** Limiar global de Otsu: separa a imagem em duas classes maximizando a variância entre elas. */
export function limiarOtsu(canal: Uint8ClampedArray): number {
  const histograma = new Uint32Array(256);
  for (let i = 0; i < canal.length; i++) histograma[canal[i]]++;

  const total = canal.length;
  let somaTotal = 0;
  for (let i = 0; i < 256; i++) somaTotal += i * histograma[i];

  let somaFundo = 0;
  let pesoFundo = 0;
  let melhorVariancia = -1;
  let melhorLimiar = 127;

  for (let t = 0; t < 256; t++) {
    pesoFundo += histograma[t];
    if (pesoFundo === 0) continue;
    const pesoFrente = total - pesoFundo;
    if (pesoFrente === 0) break;

    somaFundo += t * histograma[t];
    const mediaFundo = somaFundo / pesoFundo;
    const mediaFrente = (somaTotal - somaFundo) / pesoFrente;
    const variancia = pesoFundo * pesoFrente * (mediaFundo - mediaFrente) ** 2;

    if (variancia > melhorVariancia) {
      melhorVariancia = variancia;
      melhorLimiar = t;
    }
  }
  return melhorLimiar;
}

export function canalParaImageData(
  canal: Uint8ClampedArray,
  largura: number,
  altura: number,
): ImageData {
  const saida = new ImageData(largura, altura);
  for (let i = 0, p = 0; i < canal.length; i++, p += 4) {
    saida.data[p] = saida.data[p + 1] = saida.data[p + 2] = canal[i];
    saida.data[p + 3] = 255;
  }
  return saida;
}

/** Desenha a origem num canvas do tamanho pedido e devolve os pixels. */
export function amostrar(
  origem: CanvasImageSource,
  largura: number,
  altura: number,
): ImageData {
  const canvas = document.createElement("canvas");
  canvas.width = largura;
  canvas.height = altura;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas 2D indisponível neste navegador.");
  ctx.drawImage(origem, 0, 0, largura, altura);
  return ctx.getImageData(0, 0, largura, altura);
}

export function imageDataParaCanvas(imagem: ImageData): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = imagem.width;
  canvas.height = imagem.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D indisponível neste navegador.");
  ctx.putImageData(imagem, 0, 0);
  return canvas;
}

export function canvasParaBlob(
  canvas: HTMLCanvasElement,
  tipo: string,
  qualidade?: number,
): Promise<Blob> {
  return new Promise((resolver, rejeitar) => {
    canvas.toBlob(
      (blob) => (blob ? resolver(blob) : rejeitar(new Error("Falha ao gerar a imagem."))),
      tipo,
      qualidade,
    );
  });
}

export async function carregarImagem(arquivo: Blob): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === "function") {
    // `imageOrientation` aplica a rotação EXIF das fotos de celular.
    return createImageBitmap(arquivo, { imageOrientation: "from-image" });
  }
  const url = URL.createObjectURL(arquivo);
  try {
    return await new Promise<HTMLImageElement>((resolver, rejeitar) => {
      const img = new Image();
      img.onload = () => resolver(img);
      img.onerror = () => rejeitar(new Error("Não foi possível ler a imagem."));
      img.src = url;
    });
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  }
}
