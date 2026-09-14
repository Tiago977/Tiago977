import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { criarClienteServidor } from "@/lib/supabase/server";

/** Destino dos links de confirmação de e-mail e de acesso sem senha. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const tokenHash = url.searchParams.get("token_hash");
  const tipo = url.searchParams.get("type") as EmailOtpType | null;
  const proximo = url.searchParams.get("proximo") ?? "/arquivos";

  if (!tokenHash || !tipo) {
    return NextResponse.redirect(new URL("/entrar?erro=link-invalido", url.origin));
  }

  const supabase = await criarClienteServidor();
  const { error } = await supabase.auth.verifyOtp({ type: tipo, token_hash: tokenHash });

  if (error) {
    return NextResponse.redirect(new URL("/entrar?erro=link-expirado", url.origin));
  }

  return NextResponse.redirect(new URL(proximo, url.origin));
}
