import { redirect } from "next/navigation";
import { criarClienteServidor } from "@/lib/supabase/server";
import { carregarConversas } from "@/lib/conversas-servidor";
import { PainelLista } from "@/components/conversas/painel-lista";
import type { Conta } from "@/lib/types";

export default async function LayoutConversas({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  const [conversas, { data: contatos }] = await Promise.all([
    carregarConversas(supabase, user.id),
    supabase.from("contas").select("*").neq("id", user.id).order("nome").limit(200),
  ]);

  return (
    <div className="flex min-h-0 flex-1">
      <PainelLista conversas={conversas} contatos={(contatos ?? []) as Conta[]} />
      {children}
    </div>
  );
}
