import type { Formato, ModoCor } from "@/lib/types";
import { canvasParaBlob } from "./nucleo";
import type { PaginaRenderizada } from "./processar";

/** Página A4 em milímetros; documentos digitalizados são impressos nesse tamanho. */
const A4 = { largura: 210, altura: 297 };

export const EXTENSAO: Record<Formato, string> = {
  pdf: "pdf",
  jpeg: "jpg",
  png: "png",
};

export const TIPO_MIME: Record<Formato, string> = {
  pdf: "application/pdf",
  jpeg: "image/jpeg",
  png: "image/png",
};

/**
 * Monta o arquivo final. PDF aceita várias páginas; JPEG e PNG guardam apenas
 * a primeira, então a interface só oferece esses formatos para página única.
 */
export async function montarArquivo(
  paginas: PaginaRenderizada[],
  formato: Formato,
  modo: ModoCor,
): Promise<Blob> {
  if (paginas.length === 0) throw new Error("Nenhuma página para salvar.");
  if (formato === "pdf") return montarPdf(paginas, modo);
  return canvasParaBlob(
    paginas[0].canvas,
    TIPO_MIME[formato],
    formato === "jpeg" ? 0.86 : undefined,
  );
}

async function montarPdf(paginas: PaginaRenderizada[], modo: ModoCor): Promise<Blob> {
  const { jsPDF } = await import("jspdf");

  // Preto e branco comprime muito melhor em PNG; fotos e cinza, em JPEG.
  const usarPng = modo === "pb";
  const tipoImagem = usarPng ? "PNG" : "JPEG";

  let pdf: InstanceType<typeof jsPDF> | null = null;

  for (const pagina of paginas) {
    const paisagem = pagina.largura > pagina.altura;
    const formatoPagina: [number, number] = paisagem
      ? [A4.altura, A4.largura]
      : [A4.largura, A4.altura];

    if (!pdf) {
      pdf = new jsPDF({
        orientation: paisagem ? "landscape" : "portrait",
        unit: "mm",
        format: formatoPagina,
        compress: true,
      });
    } else {
      pdf.addPage(formatoPagina, paisagem ? "landscape" : "portrait");
    }

    const dados = usarPng
      ? pagina.canvas.toDataURL("image/png")
      : pagina.canvas.toDataURL("image/jpeg", 0.86);

    const escala = Math.min(
      formatoPagina[0] / pagina.largura,
      formatoPagina[1] / pagina.altura,
    );
    const largura = pagina.largura * escala;
    const altura = pagina.altura * escala;

    pdf.addImage(
      dados,
      tipoImagem,
      (formatoPagina[0] - largura) / 2,
      (formatoPagina[1] - altura) / 2,
      largura,
      altura,
      undefined,
      "FAST",
    );
  }

  return pdf!.output("blob");
}

/** Compacta vários arquivos já baixados num único .zip. */
export async function montarZip(
  itens: { nome: string; conteudo: Blob }[],
): Promise<Blob> {
  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();

  const usados = new Map<string, number>();
  for (const item of itens) {
    const repeticoes = usados.get(item.nome) ?? 0;
    usados.set(item.nome, repeticoes + 1);
    const nome = repeticoes === 0 ? item.nome : numerar(item.nome, repeticoes);
    zip.file(nome, item.conteudo);
  }

  return zip.generateAsync({ type: "blob", compression: "DEFLATE" });
}

function numerar(nome: string, indice: number) {
  const ponto = nome.lastIndexOf(".");
  if (ponto <= 0) return `${nome} (${indice})`;
  return `${nome.slice(0, ponto)} (${indice})${nome.slice(ponto)}`;
}

export function baixarBlob(blob: Blob, nome: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = nome;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export function nomeDeArquivo(titulo: string, formato: Formato) {
  const limpo =
    titulo
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^\w\s.-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .slice(0, 80) || "documento";
  return `${limpo}.${EXTENSAO[formato]}`;
}
