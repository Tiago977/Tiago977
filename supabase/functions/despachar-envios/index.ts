import { createClient } from "jsr:@supabase/supabase-js@2";

// Autenticação própria por segredo compartilhado com o pg_cron, por isso a
// função é publicada sem verificação de JWT.
const URL_PROJETO = Deno.env.get("SUPABASE_URL")!;
const CHAVE_SERVICO = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const CHAVE_RESEND = Deno.env.get("RESEND_API_KEY");
const REMETENTE = Deno.env.get("REMETENTE_EMAIL") ?? "Digitalizador <onboarding@resend.dev>";
const ENDERECO_APP = Deno.env.get("ENDERECO_APP") ?? "";

const VALIDADE_LINK = 7 * 24 * 60 * 60;
const LOTE = 20;
// Depois disso, um envio reservado e nunca concluído volta para a fila.
const MINUTOS_ATE_DESTRAVAR = 10;

type Envio = {
  id: string;
  assunto: string;
  mensagem: string;
  destinatarios: string[];
  agendado_para: string | null;
};

function comparacaoSegura(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diferenca = 0;
  for (let i = 0; i < a.length; i++) diferenca |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diferenca === 0;
}

function escapar(texto: string) {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function montarHtml(envio: Envio, arquivos: { titulo: string; url: string }[]) {
  const itens = arquivos
    .map(
      (a) =>
        `<li style="margin:0 0 10px"><a href="${a.url}" style="color:#2f6feb;text-decoration:none;font-weight:600">${escapar(a.titulo)}</a></li>`,
    )
    .join("");

  const rodapeApp = ENDERECO_APP
    ? `<p style="margin:24px 0 0;font-size:12px;color:#8a8a84">Enviado pelo <a href="${ENDERECO_APP}" style="color:#8a8a84">Digitalizador</a>.</p>`
    : "";

  return `<div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#1c1c1a">
    ${envio.mensagem ? `<p style="margin:0 0 20px;line-height:1.6;white-space:pre-wrap">${escapar(envio.mensagem)}</p>` : ""}
    <p style="margin:0 0 8px;font-size:13px;color:#6b6b64">Documentos anexados:</p>
    <ul style="margin:0;padding-left:18px">${itens}</ul>
    <p style="margin:24px 0 0;font-size:12px;color:#8a8a84">Os links expiram em 7 dias.</p>
    ${rodapeApp}
  </div>`;
}

async function enviarEmail(envio: Envio, arquivos: { titulo: string; url: string }[]) {
  if (!CHAVE_RESEND) {
    throw new Error(
      "Envio de e-mail não configurado: defina o segredo RESEND_API_KEY nas Edge Functions do projeto.",
    );
  }

  const resposta = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${CHAVE_RESEND}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: REMETENTE,
      to: envio.destinatarios,
      subject: envio.assunto || "Documentos digitalizados",
      html: montarHtml(envio, arquivos),
    }),
  });

  if (!resposta.ok) {
    throw new Error(`Resend respondeu ${resposta.status}: ${(await resposta.text()).slice(0, 300)}`);
  }
}

Deno.serve(async (requisicao) => {
  const supabase = createClient(URL_PROJETO, CHAVE_SERVICO, {
    auth: { persistSession: false },
  });

  const { data: config } = await supabase
    .from("config_agendador")
    .select("valor")
    .eq("chave", "segredo")
    .maybeSingle();

  const recebida = requisicao.headers.get("x-chave-agendador") ?? "";
  if (!config?.valor || !comparacaoSegura(recebida, config.valor)) {
    return new Response(JSON.stringify({ erro: "não autorizado" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Um despacho anterior pode ter sido interrompido no meio (timeout do
  // gateway, reinício da função). Sem isso o envio ficaria reservado para
  // sempre e nunca mais seria tentado.
  const limite = new Date(Date.now() - MINUTOS_ATE_DESTRAVAR * 60_000).toISOString();
  const { data: destravados } = await supabase
    .from("envios")
    .update({ status: "agendado", processando_desde: null })
    .eq("status", "processando")
    .lt("processando_desde", limite)
    .select("id");

  const agora = new Date().toISOString();
  const { data: pendentes, error: erroBusca } = await supabase
    .from("envios")
    .select("id, assunto, mensagem, destinatarios, agendado_para")
    .eq("status", "agendado")
    .or(`agendado_para.is.null,agendado_para.lte.${agora}`)
    .order("criado_em")
    .limit(LOTE);

  if (erroBusca) {
    return new Response(JSON.stringify({ erro: erroBusca.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  let enviados = 0;
  let falhas = 0;

  for (const envio of (pendentes ?? []) as Envio[]) {
    // A condição em status garante que dois disparos simultâneos não enviem duas vezes.
    const { data: reservado } = await supabase
      .from("envios")
      .update({ status: "processando", processando_desde: new Date().toISOString() })
      .eq("id", envio.id)
      .eq("status", "agendado")
      .select("id");

    if (!reservado?.length) continue;

    try {
      if (!envio.destinatarios?.length) throw new Error("Nenhum destinatário informado.");

      const { data: itens, error: erroItens } = await supabase
        .from("envio_itens")
        .select("documentos(titulo, caminho)")
        .eq("envio_id", envio.id);

      if (erroItens) throw new Error(erroItens.message);

      const documentos = (itens ?? [])
        .map((item) => item.documentos as unknown as { titulo: string; caminho: string } | null)
        .filter((d): d is { titulo: string; caminho: string } => Boolean(d));

      if (documentos.length === 0) throw new Error("Nenhum documento anexado.");

      const { data: assinados, error: erroAssinatura } = await supabase.storage
        .from("documentos")
        .createSignedUrls(documentos.map((d) => d.caminho), VALIDADE_LINK);

      if (erroAssinatura) throw new Error(erroAssinatura.message);

      const porCaminho = new Map((assinados ?? []).map((a) => [a.path, a.signedUrl]));
      const arquivos = documentos
        .map((d) => ({ titulo: d.titulo, url: porCaminho.get(d.caminho) ?? "" }))
        .filter((a) => a.url);

      if (arquivos.length === 0) {
        throw new Error(
          "Não foi possível gerar os links dos documentos. Verifique se os arquivos ainda existem.",
        );
      }

      await enviarEmail(envio, arquivos);

      await supabase
        .from("envios")
        .update({
          status: "enviado",
          enviado_em: new Date().toISOString(),
          erro: null,
          processando_desde: null,
        })
        .eq("id", envio.id);
      enviados++;
    } catch (e) {
      await supabase
        .from("envios")
        .update({
          status: "falhou",
          erro: e instanceof Error ? e.message : String(e),
          processando_desde: null,
        })
        .eq("id", envio.id);
      falhas++;
    }
  }

  return new Response(
    JSON.stringify({
      enviados,
      falhas,
      avaliados: pendentes?.length ?? 0,
      destravados: destravados?.length ?? 0,
    }),
    { headers: { "Content-Type": "application/json" } },
  );
});
