import { distancia, limitar, type Quad } from "./nucleo";

type Homografia = [number, number, number, number, number, number, number, number];

/**
 * Resolve a homografia que leva os quatro pontos de origem aos de destino.
 *
 * Cada correspondência (u,v) -> (x,y) gera duas equações lineares nos oito
 * coeficientes, porque x = (a·u + b·v + c) / (g·u + h·v + 1) vira
 * a·u + b·v + c − g·u·x − h·v·x = x. Resolvemos o sistema 8x8 por eliminação
 * de Gauss com pivoteamento parcial.
 */
function resolverHomografia(de: Quad, para: Quad): Homografia {
  const m: number[][] = [];
  for (let i = 0; i < 4; i++) {
    const { x: u, y: v } = de[i];
    const { x, y } = para[i];
    m.push([u, v, 1, 0, 0, 0, -u * x, -v * x, x]);
    m.push([0, 0, 0, u, v, 1, -u * y, -v * y, y]);
  }

  for (let coluna = 0; coluna < 8; coluna++) {
    let pivo = coluna;
    for (let linha = coluna + 1; linha < 8; linha++) {
      if (Math.abs(m[linha][coluna]) > Math.abs(m[pivo][coluna])) pivo = linha;
    }
    [m[coluna], m[pivo]] = [m[pivo], m[coluna]];

    const divisor = m[coluna][coluna];
    if (Math.abs(divisor) < 1e-12) throw new Error("Cantos do recorte são degenerados.");
    for (let k = coluna; k < 9; k++) m[coluna][k] /= divisor;

    for (let linha = 0; linha < 8; linha++) {
      if (linha === coluna) continue;
      const fator = m[linha][coluna];
      if (fator === 0) continue;
      for (let k = coluna; k < 9; k++) m[linha][k] -= fator * m[coluna][k];
    }
  }

  return m.map((linha) => linha[8]) as unknown as Homografia;
}

/** Tamanho de saída que preserva as proporções reais do documento fotografado. */
export function tamanhoDestino(quad: Quad, ladoMaximo: number) {
  const larguraBruta = Math.max(distancia(quad[0], quad[1]), distancia(quad[3], quad[2]));
  const alturaBruta = Math.max(distancia(quad[0], quad[3]), distancia(quad[1], quad[2]));
  if (larguraBruta < 1 || alturaBruta < 1) throw new Error("Recorte muito pequeno.");

  const escala = Math.min(1, ladoMaximo / Math.max(larguraBruta, alturaBruta));
  return {
    largura: Math.max(16, Math.round(larguraBruta * escala)),
    altura: Math.max(16, Math.round(alturaBruta * escala)),
  };
}

/**
 * Endireita o documento: para cada pixel da saída retangular, encontra o ponto
 * correspondente na foto original e faz amostragem bilinear.
 */
export function corrigirPerspectiva(
  origem: ImageData,
  quad: Quad,
  largura: number,
  altura: number,
): ImageData {
  const retangulo: Quad = [
    { x: 0, y: 0 },
    { x: largura, y: 0 },
    { x: largura, y: altura },
    { x: 0, y: altura },
  ];
  const emPixels = quad.map((p) => ({
    x: p.x * origem.width,
    y: p.y * origem.height,
  })) as Quad;

  const [a, b, c, d, e, f, g, h] = resolverHomografia(retangulo, emPixels);

  const saida = new ImageData(largura, altura);
  const src = origem.data;
  const dst = saida.data;
  const larguraMax = origem.width - 1;
  const alturaMax = origem.height - 1;

  for (let v = 0; v < altura; v++) {
    for (let u = 0; u < largura; u++) {
      const denominador = g * u + h * v + 1;
      const x = limitar((a * u + b * v + c) / denominador, 0, larguraMax);
      const y = limitar((d * u + e * v + f) / denominador, 0, alturaMax);

      const x0 = x | 0;
      const y0 = y | 0;
      const x1 = x0 < larguraMax ? x0 + 1 : x0;
      const y1 = y0 < alturaMax ? y0 + 1 : y0;
      const fx = x - x0;
      const fy = y - y0;

      const i00 = (y0 * origem.width + x0) * 4;
      const i10 = (y0 * origem.width + x1) * 4;
      const i01 = (y1 * origem.width + x0) * 4;
      const i11 = (y1 * origem.width + x1) * 4;
      const p = (v * largura + u) * 4;

      for (let canal = 0; canal < 3; canal++) {
        const topo = src[i00 + canal] + (src[i10 + canal] - src[i00 + canal]) * fx;
        const base = src[i01 + canal] + (src[i11 + canal] - src[i01 + canal]) * fx;
        dst[p + canal] = topo + (base - topo) * fy;
      }
      dst[p + 3] = 255;
    }
  }

  return saida;
}
