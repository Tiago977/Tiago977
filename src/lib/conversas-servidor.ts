import type { criarClienteServidor } from "@/lib/supabase/server";
import type { Conta } from "@/lib/types";

type Servidor = Awaited<ReturnType<typeof criarClienteServidor>>;

export type ResumoConversa = {
  id: string;
  titulo: string;
  ultimaMensagemEm: string;
  previa: string;
  naoLidas: number;
};

/** Lista de conversas com o nome de quem participa, a última mensagem e o que falta ler. */
export async function carregarConversas(
  supabase: Servidor,
  meuId: string,
): Promise<ResumoConversa[]> {
  const { data: conversas } = await supabase
    .from("conversas")
    .select("id, titulo, ultima_mensagem_em")
    .order("ultima_mensagem_em", { ascending: false })
    .limit(60);

  if (!conversas?.length) return [];
  const ids = conversas.map((c) => c.id);

  const [{ data: membros }, { data: mensagens }] = await Promise.all([
    supabase.from("conversa_membros").select("conversa_id, usuario_id, lido_ate").in("conversa_id", ids),
    supabase
      .from("mensagens")
      .select("conversa_id, corpo, documento_id, criado_em, autor")
      .in("conversa_id", ids)
      .order("criado_em", { ascending: false })
      .limit(600),
  ]);

  const contas = await carregarContas(
    supabase,
    (membros ?? []).map((m) => m.usuario_id),
  );

  const lidoAte = new Map(
    (membros ?? [])
      .filter((m) => m.usuario_id === meuId)
      .map((m) => [m.conversa_id, m.lido_ate]),
  );

  const nomes = new Map<string, string[]>();
  for (const membro of membros ?? []) {
    if (membro.usuario_id === meuId) continue;
    const conta = contas.get(membro.usuario_id);
    const lista = nomes.get(membro.conversa_id) ?? [];
    lista.push(conta?.nome || conta?.email || "Alguém");
    nomes.set(membro.conversa_id, lista);
  }

  const ultima = new Map<string, { corpo: string; documento_id: string | null }>();
  const naoLidas = new Map<string, number>();
  for (const mensagem of mensagens ?? []) {
    if (!ultima.has(mensagem.conversa_id)) {
      ultima.set(mensagem.conversa_id, {
        corpo: mensagem.corpo,
        documento_id: mensagem.documento_id,
      });
    }
    const marco = lidoAte.get(mensagem.conversa_id);
    if (mensagem.autor !== meuId && marco && mensagem.criado_em > marco) {
      naoLidas.set(mensagem.conversa_id, (naoLidas.get(mensagem.conversa_id) ?? 0) + 1);
    }
  }

  return conversas.map((conversa) => {
    const recente = ultima.get(conversa.id);
    return {
      id: conversa.id,
      titulo: conversa.titulo || nomes.get(conversa.id)?.join(", ") || "Conversa",
      ultimaMensagemEm: conversa.ultima_mensagem_em,
      previa: recente
        ? recente.corpo || (recente.documento_id ? "Documento enviado" : "")
        : "Nenhuma mensagem ainda",
      naoLidas: naoLidas.get(conversa.id) ?? 0,
    };
  });
}

export async function carregarContas(supabase: Servidor, ids: string[]) {
  const unicos = [...new Set(ids)];
  if (unicos.length === 0) return new Map<string, Conta>();

  const { data } = await supabase.from("contas").select("*").in("id", unicos);
  return new Map((data ?? []).map((conta) => [conta.id, conta as Conta]));
}
