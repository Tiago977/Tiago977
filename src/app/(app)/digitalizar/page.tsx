import type { Metadata } from "next";
import { criarClienteServidor } from "@/lib/supabase/server";
import { CabecalhoPagina } from "@/components/cabecalho";
import { PainelDigitalizar } from "@/components/digitalizar/painel";

export const metadata: Metadata = { title: "Digitalizar" };

export default async function PaginaDigitalizar() {
  const supabase = await criarClienteServidor();
  const { data: pastas } = await supabase.from("pastas").select("*").order("nome");

  return (
    <>
      <CabecalhoPagina
        titulo="Digitalizar"
        descricao="Fotografe o documento; o recorte e o realce são feitos no seu aparelho."
      />
      <div className="p-4 md:p-6">
        <PainelDigitalizar pastas={pastas ?? []} />
      </div>
    </>
  );
}
