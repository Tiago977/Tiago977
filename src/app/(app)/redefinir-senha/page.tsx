import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { criarClienteServidor } from "@/lib/supabase/server";
import { CabecalhoPagina } from "@/components/cabecalho";
import { FormularioSenha } from "@/components/conta/formulario-senha";
import { Painel } from "@/components/ui";

export const metadata: Metadata = { title: "Nova senha" };

export default async function PaginaRedefinirSenha() {
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  return (
    <>
      <CabecalhoPagina
        titulo="Nova senha"
        descricao={`Escolha a senha que você vai usar para entrar como ${user.email}.`}
      />
      <div className="p-4 md:p-6">
        <Painel className="mx-auto w-full max-w-sm p-5">
          <FormularioSenha aoConcluir="/arquivos" />
        </Painel>
      </div>
    </>
  );
}
