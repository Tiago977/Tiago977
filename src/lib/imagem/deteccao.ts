import {
  amostrar,
  limiarOtsu,
  paraCinza,
  type Ponto,
  type Quad,
} from "./nucleo";

const LADO_ANALISE = 320;
const AREA_MINIMA = 0.08;
const AREA_MAXIMA = 0.985;

/**
 * Localiza o documento na foto e devolve seus quatro cantos em coordenadas
 * normalizadas (0..1), prontos para serem exibidos e arrastados sobre a prévia.
 *
 * Estratégia: separar papel e mesa por limiar de Otsu, ficar com a maior região
 * conectada e extrair os cantos extremos dessa região. Funciona para o caso
 * comum (documento claro sobre fundo mais escuro, em qualquer ângulo) e também
 * na situação inversa, testada como alternativa.
 */
export function detectarDocumento(origem: CanvasImageSource, largura: number, altura: number): Quad {
  const escala = Math.min(1, LADO_ANALISE / Math.max(largura, altura));
  const la = Math.max(32, Math.round(largura * escala));
  const al = Math.max(32, Math.round(altura * escala));

  let quadrilatero: Quad | null = null;
  try {
    const cinza = paraCinza(amostrar(origem, la, al));
    const limiar = limiarOtsu(cinza);
    quadrilatero =
      tentarRegiao(cinza, la, al, limiar, true) ?? tentarRegiao(cinza, la, al, limiar, false);
  } catch {
    quadrilatero = null;
  }

  if (!quadrilatero) return quadCompleto();

  return quadrilatero.map((p) => ({
    x: p.x / la,
    y: p.y / al,
  })) as Quad;
}

export function quadCompleto(): Quad {
  return [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 1, y: 1 },
    { x: 0, y: 1 },
  ];
}

/** Recua os cantos em direção ao centro, útil quando o usuário quer aparar sobras. */
export function encolherQuad(quad: Quad, fracao: number): Quad {
  const cx = quad.reduce((s, p) => s + p.x, 0) / 4;
  const cy = quad.reduce((s, p) => s + p.y, 0) / 4;
  return quad.map((p) => ({
    x: cx + (p.x - cx) * (1 - fracao),
    y: cy + (p.y - cy) * (1 - fracao),
  })) as Quad;
}

function tentarRegiao(
  cinza: Uint8ClampedArray,
  largura: number,
  altura: number,
  limiar: number,
  claro: boolean,
): Quad | null {
  const total = largura * altura;
  const mascara = new Uint8Array(total);
  for (let i = 0; i < total; i++) {
    const acima = cinza[i] > limiar;
    mascara[i] = (claro ? acima : !acima) ? 1 : 0;
  }

  suavizarMascara(mascara, largura, altura);

  const regiao = maiorRegiao(mascara, largura, altura);
  if (!regiao) return null;

  const fracao = regiao.area / total;
  if (fracao < AREA_MINIMA || fracao > AREA_MAXIMA) return null;

  return cantosExtremos(mascara, largura, altura);
}

/** Filtro de maioria 3x3: elimina ruído sal-e-pimenta e fios finos entre regiões. */
function suavizarMascara(mascara: Uint8Array, largura: number, altura: number) {
  const copia = mascara.slice();
  for (let y = 1; y < altura - 1; y++) {
    for (let x = 1; x < largura - 1; x++) {
      const i = y * largura + x;
      const vizinhos =
        copia[i - largura - 1] + copia[i - largura] + copia[i - largura + 1] +
        copia[i - 1] + copia[i] + copia[i + 1] +
        copia[i + largura - 1] + copia[i + largura] + copia[i + largura + 1];
      mascara[i] = vizinhos >= 5 ? 1 : 0;
    }
  }
}

/**
 * Varredura de regiões conectadas (4-vizinhos) com pilha explícita.
 * Reescreve a máscara com o número de cada região e devolve a maior delas.
 */
function maiorRegiao(mascara: Uint8Array, largura: number, altura: number) {
  const total = largura * altura;
  const rotulos = new Int32Array(total);
  const pilha = new Int32Array(total);
  let proximoRotulo = 0;
  let melhor: { rotulo: number; area: number } | null = null;

  for (let inicio = 0; inicio < total; inicio++) {
    if (mascara[inicio] !== 1 || rotulos[inicio] !== 0) continue;

    proximoRotulo++;
    let topo = 0;
    let area = 0;
    pilha[topo++] = inicio;
    rotulos[inicio] = proximoRotulo;

    while (topo > 0) {
      const i = pilha[--topo];
      area++;
      const x = i % largura;

      if (x > 0 && mascara[i - 1] === 1 && rotulos[i - 1] === 0) {
        rotulos[i - 1] = proximoRotulo;
        pilha[topo++] = i - 1;
      }
      if (x < largura - 1 && mascara[i + 1] === 1 && rotulos[i + 1] === 0) {
        rotulos[i + 1] = proximoRotulo;
        pilha[topo++] = i + 1;
      }
      if (i >= largura && mascara[i - largura] === 1 && rotulos[i - largura] === 0) {
        rotulos[i - largura] = proximoRotulo;
        pilha[topo++] = i - largura;
      }
      if (i + largura < total && mascara[i + largura] === 1 && rotulos[i + largura] === 0) {
        rotulos[i + largura] = proximoRotulo;
        pilha[topo++] = i + largura;
      }
    }

    if (!melhor || area > melhor.area) melhor = { rotulo: proximoRotulo, area };
  }

  if (!melhor) return null;
  for (let i = 0; i < total; i++) mascara[i] = rotulos[i] === melhor.rotulo ? 1 : 0;
  return { area: melhor.area };
}

/**
 * Cantos de um retângulo em perspectiva são os extremos das somas e diferenças
 * das coordenadas: x+y é mínimo no canto superior-esquerdo e máximo no
 * inferior-direito; x−y separa os outros dois.
 */
function cantosExtremos(mascara: Uint8Array, largura: number, altura: number): Quad {
  let somaMin = Infinity;
  let somaMax = -Infinity;
  let difMin = Infinity;
  let difMax = -Infinity;
  let se: Ponto = { x: 0, y: 0 };
  let id: Ponto = { x: largura - 1, y: altura - 1 };
  let sd: Ponto = { x: largura - 1, y: 0 };
  let ie: Ponto = { x: 0, y: altura - 1 };

  for (let y = 0; y < altura; y++) {
    for (let x = 0; x < largura; x++) {
      if (mascara[y * largura + x] !== 1) continue;
      const soma = x + y;
      const diferenca = x - y;
      if (soma < somaMin) {
        somaMin = soma;
        se = { x, y };
      }
      if (soma > somaMax) {
        somaMax = soma;
        id = { x, y };
      }
      if (diferenca > difMax) {
        difMax = diferenca;
        sd = { x, y };
      }
      if (diferenca < difMin) {
        difMin = diferenca;
        ie = { x, y };
      }
    }
  }

  return [se, sd, id, ie];
}
