import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const ROTAS_PUBLICAS = ["/entrar", "/auth"];

export async function proxy(request: NextRequest) {
  let resposta = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          resposta = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            resposta.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const caminho = request.nextUrl.pathname;
  const ehPublica = ROTAS_PUBLICAS.some((r) => caminho.startsWith(r));

  if (!user && !ehPublica) {
    const destino = request.nextUrl.clone();
    destino.pathname = "/entrar";
    destino.searchParams.set("proximo", caminho);
    return NextResponse.redirect(destino);
  }

  if (user && caminho === "/entrar") {
    const destino = request.nextUrl.clone();
    destino.pathname = "/arquivos";
    destino.search = "";
    return NextResponse.redirect(destino);
  }

  return resposta;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|api/cron|favicon.ico|manifest.webmanifest|icone.*\\.png|.*\\.svg).*)"],
};
