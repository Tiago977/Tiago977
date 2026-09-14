import type { Metadata } from "next";
import { criarClienteServidor } from "@/lib/supabase/server";
import { BUCKET } from "@/lib/dados";
import type { Documento, Pasta } from "@/lib/types";
import { NavegadorArquivos } from "@/components/arquivos/navegador";

export const metadata: Metadata = { title: "Arquivos" };

export default async function PaginaArquivos(props: PageProps<"/arquivos">) {
  const { pasta } = await props.searchParams;
  const pastaId = typeof pasta === "string" && pasta ? pasta : null;

  const supabase = await criarClienteServidor();

  const consultaDocumentos = supabase
    .from("documentos")
    .select("*")
    .order("criado_em", { ascending: false });

  const [{ data: pastas }, { data: documentos }] = await Promise.all([
    supabase.from("pastas").select("*").order("nome"),
    pastaId ? consultaDocumentos.eq("pasta_id", pastaId) : consultaDocumentos.is("pasta_id", null),
  ]);

  const miniaturas = await gerarMiniaturas(supabase, documentos ?? []);

  return (
    <NavegadorArquivos
      pastaAtual={pastaId}
      pastas={(pastas ?? []) as Pasta[]}
      documentos={(documentos ?? []) as Documento[]}
      miniaturas={miniaturas}
    />
  );
}

async function gerarMiniaturas(
  supabase: Awaited<ReturnType<typeof criarClienteServidor>>,
  documentos: Documento[],
): Promise<Record<string, string>> {
  const caminhos = documentos
    .map((d) => d.miniatura)
    .filter((c): c is string => Boolean(c));

  if (caminhos.length === 0) return {};

  const { data } = await supabase.storage.from(BUCKET).createSignedUrls(caminhos, 3600);
  if (!data) return {};

  const porCaminho = new Map(data.map((item) => [item.path, item.signedUrl]));
  const mapa: Record<string, string> = {};
  for (const documento of documentos) {
    const url = documento.miniatura ? porCaminho.get(documento.miniatura) : undefined;
    if (url) mapa[documento.id] = url;
  }
  return mapa;
}
