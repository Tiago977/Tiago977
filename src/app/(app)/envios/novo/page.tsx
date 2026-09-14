import type { Metadata } from "next";
import { criarClienteServidor } from "@/lib/supabase/server";
import { CabecalhoPagina } from "@/components/cabecalho";
import { Compositor } from "@/components/envios/compositor";
import type { Documento } from "@/lib/types";

export const metadata: Metadata = { title: "Novo envio" };

export default async function PaginaNovoEnvio(props: PageProps<"/envios/novo">) {
  const { docs } = await props.searchParams;
  const preSelecionados =
    typeof docs === "string" ? docs.split(",").filter(Boolean) : [];

  const supabase = await criarClienteServidor();

  const [{ data: documentos }, { data: envios }] = await Promise.all([
    supabase.from("documentos").select("*").order("criado_em", { ascending: false }),
    supabase
      .from("envios")
      .select("destinatarios")
      .order("criado_em", { ascending: false })
      .limit(15),
  ]);

  const sugestoes = [...new Set((envios ?? []).flatMap((e) => e.destinatarios ?? []))];

  return (
    <>
      <CabecalhoPagina
        titulo="Novo envio"
        descricao="Escolha os documentos, os destinatários e quando eles devem receber."
      />
      <div className="p-4 md:p-6">
        <Compositor
          documentos={(documentos ?? []) as Documento[]}
          preSelecionados={preSelecionados}
          sugestoes={sugestoes}
        />
      </div>
    </>
  );
}
