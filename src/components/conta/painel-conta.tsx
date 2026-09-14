"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Loader2, LogOut } from "lucide-react";
import { criarClienteNavegador } from "@/lib/supabase/client";
import { Botao, Campo, Painel, Rotulo } from "@/components/ui";

export function PainelConta({
  nomeInicial,
  email,
}: {
  nomeInicial: string;
  email: string;
}) {
  const router = useRouter();

  const [nome, setNome] = useState(nomeInicial);
  const [senha, setSenha] = useState("");
  const [repetir, setRepetir] = useState("");
  const [salvando, setSalvando] = useState<"nome" | "senha" | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  async function salvarNome() {
    setErro(null);
    setAviso(null);
    setSalvando("nome");
    try {
      const supabase = criarClienteNavegador();
      const { data: sessao } = await supabase.auth.getUser();
      if (!sessao.user) throw new Error("Sessão expirada. Entre novamente.");

      const { error } = await supabase
        .from("contas")
        .update({ nome: nome.trim() })
        .eq("id", sessao.user.id);
      if (error) throw new Error(error.message);

      setAviso("Nome atualizado.");
      router.refresh();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível salvar.");
    } finally {
      setSalvando(null);
    }
  }

  async function salvarSenha() {
    setErro(null);
    setAviso(null);

    if (senha.length < 6) return setErro("A senha precisa ter ao menos 6 caracteres.");
    if (senha !== repetir) return setErro("As duas senhas não são iguais.");

    setSalvando("senha");
    try {
      const supabase = criarClienteNavegador();
      const { error } = await supabase.auth.updateUser({ password: senha });
      if (error) throw new Error(error.message);

      setSenha("");
      setRepetir("");
      setAviso("Senha definida. Agora você pode entrar com e-mail e senha.");
      router.refresh();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível definir a senha.");
    } finally {
      setSalvando(null);
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

        <Botao onClick={salvarNome} disabled={salvando !== null || !nome.trim()}>
          {salvando === "nome" ? <Loader2 className="size-4 animate-spin" /> : null}
          Salvar nome
        </Botao>
      </Painel>

      <Painel className="space-y-4 p-4">
        <div>
          <h2 className="text-sm font-semibold">Senha</h2>
          <p className="mt-0.5 text-[13px] text-texto-suave">
            Defina uma senha para entrar sem depender do link por e-mail. Se já tiver
            uma, isto a substitui.
          </p>
        </div>

        <label className="block">
          <Rotulo>Nova senha</Rotulo>
          <Campo
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            placeholder="Mínimo de 6 caracteres"
            autoComplete="new-password"
          />
        </label>

        <label className="block">
          <Rotulo>Repita a senha</Rotulo>
          <Campo
            type="password"
            value={repetir}
            onChange={(e) => setRepetir(e.target.value)}
            autoComplete="new-password"
          />
        </label>

        {erro ? <p className="text-[13px] text-perigo">{erro}</p> : null}
        {aviso ? <p className="text-[13px] text-sucesso">{aviso}</p> : null}

        <Botao
          variante="solido"
          className="w-full"
          onClick={salvarSenha}
          disabled={salvando !== null}
        >
          {salvando === "senha" ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <KeyRound className="size-4" />
          )}
          Salvar senha
        </Botao>
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
