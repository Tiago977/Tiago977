import { redirect } from "next/navigation";
import { LogOut } from "lucide-react";
import { criarClienteServidor } from "@/lib/supabase/server";
import { NavegacaoInferior, NavegacaoLateral } from "@/components/navegacao";
import { Logo } from "@/components/logo";
import { Avatar } from "@/components/ui";
import { iniciais } from "@/lib/ui";

export default async function LayoutApp({ children }: { children: React.ReactNode }) {
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

  const nome = conta?.nome || user.email?.split("@")[0] || "Você";
  const email = conta?.email || user.email || "";

  return (
    <div className="flex h-dvh overflow-hidden">
      <aside className="hidden h-dvh w-60 shrink-0 flex-col gap-6 border-r border-borda bg-painel px-3 py-5 md:flex">
        <div className="flex items-center gap-2.5 px-2">
          <Logo />
          <span className="text-sm font-semibold tracking-tight">Digitalizador</span>
        </div>

        <NavegacaoLateral />

        <div className="mt-auto space-y-2 border-t border-borda pt-3">
          <div className="flex items-center gap-2.5 px-1">
            <Avatar texto={iniciais(nome, email)} />
            <div className="min-w-0">
              <p className="truncate text-[13px] font-medium">{nome}</p>
              <p className="truncate text-[11px] text-texto-suave">{email}</p>
            </div>
          </div>
          <form action="/auth/sair" method="post">
            <button
              type="submit"
              className="flex h-9 w-full items-center gap-2 rounded-xl px-3 text-[13px] text-texto-suave transition hover:bg-painel-suave hover:text-texto"
            >
              <LogOut className="size-4" />
              Sair
            </button>
          </form>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto pb-14 md:pb-0">
        {children}
      </div>

      <NavegacaoInferior />
    </div>
  );
}
