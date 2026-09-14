"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogOut } from "lucide-react";
import { criarClienteNavegador } from "@/lib/supabase/client";
import { Botao, Campo, Painel, Rotulo } from "@/components/ui";
import { FormularioSenha } from "./formulario-senha";

export function PainelConta({
  nomeInicial,
  email,
}: {
  nomeInicial: string;
  email: string;
}) {
  const router = useRouter();

  const [nome, setNome] = useState(nomeInicial);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  async function salvarNome() {
    setErro(null);
    setAviso(null);
    setSalvando(true);
    try {
      const supabase = criarClienteNavegador();
      const { data: sessao } = await supabase.auth.getUser();
      if (!sessao.user) throw new Error("Sessão expirada. Entre novamente.");

      // upsert em vez de update: contas anteriores ao gatilho de perfil podem
      // ainda não ter linha, e um update silencioso não gravaria nada.
      const { error } = await supabase.from("contas").upsert({
        id: sessao.user.id,
        nome: nome.trim(),
        email: sessao.user.email ?? "",
      });
      if (error) throw new Error(error.message);

      setAviso("Nome atualizado.");
      router.refresh();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível salvar.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-4">
      <Painel className="space-y-4 p-4">
        <div>
          <Rotulo>E-mail</Rotulo>
          <p className="text-sm text-texto-suave">{email}</p>
        </div>

        <label className="block">
          <Rotulo>Nome</Rotulo>
          <Campo value={nome} onChange={(e) => setNome(e.target.value)} />
        </label>

        {erro ? <p className="text-[13px] text-perigo">{erro}</p> : null}
        {aviso ? <p className="text-[13px] text-sucesso">{aviso}</p> : null}

        <Botao onClick={salvarNome} disabled={salvando || !nome.trim()}>
          {salvando ? <Loader2 className="size-4 animate-spin" /> : null}
          Salvar nome
        </Botao>
      </Painel>

      <Painel className="space-y-4 p-4">
        <div>
          <h2 className="text-sm font-semibold">Trocar senha</h2>
          <p className="mt-0.5 text-[13px] text-texto-suave">
            Vale também para quem entrou por link e ainda não tem senha.
          </p>
        </div>
        <FormularioSenha aoConcluir="/conta" />
      </Painel>

      <form action="/auth/sair" method="post">
        <Botao type="submit" variante="perigo" className="w-full">
          <LogOut className="size-4" />
          Sair da conta
        </Botao>
      </form>
    </div>
  );
}
