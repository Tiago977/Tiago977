import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { criarClienteServidor } from "@/lib/supabase/server";
import { CabecalhoPagina } from "@/components/cabecalho";
import { PainelConta } from "@/components/conta/painel-conta";

export const metadata: Metadata = { title: "Conta" };

export default async function PaginaConta() {
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  const { data: conta } = await supabase
    .from("contas")
    .select("nome, email")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <>
      <CabecalhoPagina titulo="Conta" descricao="Seu nome, sua senha e sua sessão." />
      <div className="p-4 md:p-6">
        <PainelConta
          nomeInicial={conta?.nome ?? ""}
          email={conta?.email || user.email || ""}
        />
      </div>
    </>
  );
}
