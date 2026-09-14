import { notFound, redirect } from "next/navigation";
import { criarClienteServidor } from "@/lib/supabase/server";
import { carregarContas } from "@/lib/conversas-servidor";
import { Thread } from "@/components/conversas/thread";
import type { Documento, Mensagem } from "@/lib/types";

export default async function PaginaConversa(props: PageProps<"/conversas/[id]">) {
  const { id } = await props.params;

  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  const { data: conversa } = await supabase
    .from("conversas")
    .select("id, titulo")
    .eq("id", id)
    .maybeSingle();

  // A RLS já esconde conversas de que você não participa, então "some" é 404.
  if (!conversa) notFound();

  const [{ data: membros }, { data: mensagens }, { data: meusDocumentos }] = await Promise.all([
    supabase.from("conversa_membros").select("usuario_id").eq("conversa_id", id),
    supabase
      .from("mensagens")
      .select("*")
      .eq("conversa_id", id)
      .order("criado_em")
      .limit(300),
    supabase
      .from("documentos")
      .select("*")
      .eq("dono", user.id)
      .order("criado_em", { ascending: false })
      .limit(100),
  ]);

  const contas = await carregarContas(
    supabase,
    (membros ?? []).map((m) => m.usuario_id),
  );

  const autores: Record<string, string> = {};
  for (const [contaId, conta] of contas) {
    autores[contaId] = conta.nome || conta.email;
  }

  const titulo =
    conversa.titulo ||
    (membros ?? [])
      .filter((m) => m.usuario_id !== user.id)
      .map((m) => autores[m.usuario_id] ?? "Alguém")
      .join(", ") ||
    "Conversa";

  const documentosConhecidos = Object.fromEntries(
    (meusDocumentos ?? []).map((d) => [
      d.id,
      { titulo: d.titulo, formato: d.formato, caminho: d.caminho },
    ]),
  );

  return (
    // A chave recria a thread ao trocar de conversa, sem sincronizar estado à mão.
    <Thread
      key={id}
      conversaId={id}
      meuId={user.id}
      titulo={titulo}
      autores={autores}
      mensagensIniciais={(mensagens ?? []) as Mensagem[]}
      documentosConhecidos={documentosConhecidos}
      meusDocumentos={(meusDocumentos ?? []) as Documento[]}
    />
  );
}
