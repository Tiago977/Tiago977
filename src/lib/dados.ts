import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Documento, Formato, ModoCor, Pasta, Resolucao } from "@/lib/types";
import { EXTENSAO, TIPO_MIME } from "@/lib/imagem/exportar";

export type Cliente = SupabaseClient<Database>;

export const BUCKET = "documentos";

export async function listarPastas(supabase: Cliente): Promise<Pasta[]> {
  const { data, error } = await supabase.from("pastas").select("*").order("nome");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function listarDocumentos(
  supabase: Cliente,
  pastaId: string | null,
): Promise<Documento[]> {
  let consulta = supabase.from("documentos").select("*").order("criado_em", { ascending: false });
  consulta = pastaId === null ? consulta.is("pasta_id", null) : consulta.eq("pasta_id", pastaId);

  const { data, error } = await consulta;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function criarPasta(supabase: Cliente, nome: string, paiId: string | null) {
  const { data: sessao } = await supabase.auth.getUser();
  if (!sessao.user) throw new Error("Sessão expirada.");

  const { data, error } = await supabase
    .from("pastas")
    .insert({ nome: nome.trim(), pai_id: paiId, dono: sessao.user.id })
    .select()
    .single();

  if (error) {
    throw new Error(
      error.code === "23505" ? "Já existe uma pasta com esse nome aqui." : error.message,
    );
  }
  return data as Pasta;
}

export type NovoDocumento = {
  titulo: string;
  pastaId: string | null;
  formato: Formato;
  modo: ModoCor;
  resolucao: Resolucao;
  arquivo: Blob;
  miniatura: Blob | null;
  paginas: { blob: Blob; largura: number; altura: number }[];
};

/**
 * Envia o arquivo final, a miniatura e as páginas soltas para o Storage e
 * registra o documento. Os objetos ficam em {usuário}/{documento}/… , caminho
 * do qual as políticas de acesso do Storage dependem.
 */
export async function salvarDocumento(supabase: Cliente, novo: NovoDocumento) {
  const { data: sessao } = await supabase.auth.getUser();
  if (!sessao.user) throw new Error("Sessão expirada.");

  const dono = sessao.user.id;
  const id = crypto.randomUUID();
  const raiz = `${dono}/${id}`;
  const caminho = `${raiz}/arquivo.${EXTENSAO[novo.formato]}`;

  await enviar(supabase, caminho, novo.arquivo, TIPO_MIME[novo.formato]);

  let miniatura: string | null = null;
  if (novo.miniatura) {
    miniatura = `${raiz}/miniatura.jpg`;
    await enviar(supabase, miniatura, novo.miniatura, "image/jpeg");
  }

  const paginas = await Promise.all(
    novo.paginas.map(async (pagina, indice) => {
      const caminhoPagina = `${raiz}/pagina-${indice + 1}.jpg`;
      await enviar(supabase, caminhoPagina, pagina.blob, "image/jpeg");
      return {
        documento_id: id,
        indice,
        caminho: caminhoPagina,
        largura: pagina.largura,
        altura: pagina.altura,
      };
    }),
  );

  const { data, error } = await supabase
    .from("documentos")
    .insert({
      id,
      dono,
      pasta_id: novo.pastaId,
      titulo: novo.titulo.trim() || "Documento sem título",
      formato: novo.formato,
      modo_cor: novo.modo,
      resolucao: novo.resolucao,
      paginas: novo.paginas.length,
      tamanho_bytes: novo.arquivo.size,
      caminho,
      miniatura,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  if (paginas.length > 0) {
    const { error: erroPaginas } = await supabase.from("documento_paginas").insert(paginas);
    if (erroPaginas) throw new Error(erroPaginas.message);
  }

  return data as Documento;
}

async function enviar(supabase: Cliente, caminho: string, blob: Blob, contentType: string) {
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(caminho, blob, { contentType, upsert: true });
  if (error) throw new Error(`Falha ao enviar o arquivo: ${error.message}`);
}

export async function urlAssinada(supabase: Cliente, caminho: string, segundos = 3600) {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(caminho, segundos);
  if (error) throw new Error(error.message);
  return data.signedUrl;
}

export async function baixarArquivo(supabase: Cliente, caminho: string): Promise<Blob> {
  const { data, error } = await supabase.storage.from(BUCKET).download(caminho);
  if (error) throw new Error(error.message);
  return data;
}

export async function excluirDocumento(supabase: Cliente, documento: Documento) {
  const { data: arquivos } = await supabase.storage
    .from(BUCKET)
    .list(`${documento.dono}/${documento.id}`);

  if (arquivos?.length) {
    await supabase.storage
      .from(BUCKET)
      .remove(arquivos.map((a) => `${documento.dono}/${documento.id}/${a.name}`));
  }

  const { error } = await supabase.from("documentos").delete().eq("id", documento.id);
  if (error) throw new Error(error.message);
}

export type NovoEnvio = {
  assunto: string;
  mensagem: string;
  destinatarios: string[];
  agendadoPara: string | null;
  documentos: string[];
};

/**
 * Registra o envio como "agendado". Um agendador roda a cada minuto no
 * Supabase e despacha tudo que já venceu — inclusive o envio imediato, que
 * entra sem data marcada.
 */
export async function criarEnvio(supabase: Cliente, novo: NovoEnvio) {
  const { data: sessao } = await supabase.auth.getUser();
  if (!sessao.user) throw new Error("Sessão expirada.");
  if (novo.documentos.length === 0) throw new Error("Escolha ao menos um documento.");
  if (novo.destinatarios.length === 0) throw new Error("Informe ao menos um destinatário.");

  const { data, error } = await supabase
    .from("envios")
    .insert({
      dono: sessao.user.id,
      assunto: novo.assunto.trim(),
      mensagem: novo.mensagem.trim(),
      destinatarios: novo.destinatarios,
      agendado_para: novo.agendadoPara,
      status: "agendado",
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  const { error: erroItens } = await supabase
    .from("envio_itens")
    .insert(novo.documentos.map((documento_id) => ({ envio_id: data.id, documento_id })));

  if (erroItens) {
    await supabase.from("envios").delete().eq("id", data.id);
    throw new Error(erroItens.message);
  }

  return data;
}

export async function cancelarEnvio(supabase: Cliente, id: string) {
  const { error } = await supabase
    .from("envios")
    .update({ status: "cancelado" })
    .eq("id", id)
    .eq("status", "agendado");
  if (error) throw new Error(error.message);
}

/** Abre a conversa entre você e outra pessoa, reaproveitando a que já existir. */
export async function abrirConversa(supabase: Cliente, outroUsuario: string) {
  const { data: sessao } = await supabase.auth.getUser();
  if (!sessao.user) throw new Error("Sessão expirada.");
  const eu = sessao.user.id;
  if (eu === outroUsuario) throw new Error("Escolha outra pessoa para conversar.");

  const { data: minhas } = await supabase
    .from("conversa_membros")
    .select("conversa_id")
    .eq("usuario_id", eu);

  const ids = (minhas ?? []).map((m) => m.conversa_id);
  if (ids.length > 0) {
    const { data: membros } = await supabase
      .from("conversa_membros")
      .select("conversa_id, usuario_id")
      .in("conversa_id", ids);

    const porConversa = new Map<string, Set<string>>();
    for (const membro of membros ?? []) {
      const atual = porConversa.get(membro.conversa_id) ?? new Set<string>();
      atual.add(membro.usuario_id);
      porConversa.set(membro.conversa_id, atual);
    }

    for (const [conversaId, usuarios] of porConversa) {
      if (usuarios.size === 2 && usuarios.has(eu) && usuarios.has(outroUsuario)) {
        return conversaId;
      }
    }
  }

  const { data: conversa, error } = await supabase
    .from("conversas")
    .insert({ criado_por: eu })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  const { error: erroMembros } = await supabase.from("conversa_membros").insert([
    { conversa_id: conversa.id, usuario_id: eu },
    { conversa_id: conversa.id, usuario_id: outroUsuario },
  ]);
  if (erroMembros) throw new Error(erroMembros.message);

  return conversa.id;
}

export async function enviarMensagem(
  supabase: Cliente,
  conversaId: string,
  corpo: string,
  documentoId: string | null = null,
) {
  const { data: sessao } = await supabase.auth.getUser();
  if (!sessao.user) throw new Error("Sessão expirada.");

  const { data, error } = await supabase
    .from("mensagens")
    .insert({
      conversa_id: conversaId,
      autor: sessao.user.id,
      corpo: corpo.trim(),
      documento_id: documentoId,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function marcarComoLida(supabase: Cliente, conversaId: string) {
  const { data: sessao } = await supabase.auth.getUser();
  if (!sessao.user) return;

  await supabase
    .from("conversa_membros")
    .update({ lido_ate: new Date().toISOString() })
    .eq("conversa_id", conversaId)
    .eq("usuario_id", sessao.user.id);
}

export async function moverDocumentos(
  supabase: Cliente,
  ids: string[],
  pastaId: string | null,
) {
  const { error } = await supabase
    .from("documentos")
    .update({ pasta_id: pastaId, atualizado_em: new Date().toISOString() })
    .in("id", ids);
  if (error) throw new Error(error.message);
}
