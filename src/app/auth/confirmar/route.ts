import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { criarClienteServidor } from "@/lib/supabase/server";

/**
 * Destino dos links de confirmação de e-mail e de acesso sem senha.
 *
 * O Supabase entrega esse link de duas formas, dependendo do modelo de e-mail
 * configurado no projeto: com `code` (fluxo PKCE, o padrão) ou com `token_hash`
 * (quando o modelo usa `{{ .TokenHash }}`). As duas são aceitas aqui — o
 * `token_hash` é o único que também funciona quando a pessoa abre o e-mail em
 * outro aparelho, porque o PKCE depende do verificador guardado no navegador
 * que iniciou o cadastro.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const codigo = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const tipo = url.searchParams.get("type") as EmailOtpType | null;
  const proximo = url.searchParams.get("proximo") ?? "/arquivos";

  // O próprio Supabase pode redirecionar para cá já com um erro descrito.
  const erroSupabase = url.searchParams.get("error_description") ?? url.searchParams.get("error");

  if (erroSupabase) {
    return NextResponse.redirect(new URL("/entrar?erro=link-expirado", url.origin));
  }

  const supabase = await criarClienteServidor();

  if (codigo) {
    const { error } = await supabase.auth.exchangeCodeForSession(codigo);
    if (error) {
      // Esse fluxo exige que o link seja aberto no mesmo navegador que o pediu.
      // Quem toca no link dentro do app de e-mail cai num navegador interno e
      // chega aqui — a mensagem precisa dizer isso, não "link expirado".
      return NextResponse.redirect(new URL("/entrar?erro=outro-navegador", url.origin));
    }
    return NextResponse.redirect(new URL(proximo, url.origin));
  }

  if (tokenHash && tipo) {
    const { error } = await supabase.auth.verifyOtp({ type: tipo, token_hash: tokenHash });
    if (error) {
      return NextResponse.redirect(new URL("/entrar?erro=link-expirado", url.origin));
    }
    return NextResponse.redirect(new URL(proximo, url.origin));
  }

  return NextResponse.redirect(new URL("/entrar?erro=link-invalido", url.origin));
}
