"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, KeyRound, Loader2 } from "lucide-react";
import { criarClienteNavegador } from "@/lib/supabase/client";
import { Botao, Campo, Rotulo } from "@/components/ui";

export function FormularioSenha({ aoConcluir }: { aoConcluir: string }) {
  const router = useRouter();

  const [senha, setSenha] = useState("");
  const [repetir, setRepetir] = useState("");
  const [visivel, setVisivel] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [pronto, setPronto] = useState(false);

  async function salvar(evento: React.FormEvent) {
    evento.preventDefault();
    setErro(null);

    if (senha.length < 6) return setErro("A senha precisa ter ao menos 6 caracteres.");
    if (senha !== repetir) return setErro("As duas senhas não são iguais.");

    setSalvando(true);
    try {
      const supabase = criarClienteNavegador();
      const { error } = await supabase.auth.updateUser({ password: senha });
      if (error) throw new Error(error.message);

      setPronto(true);
      setSenha("");
      setRepetir("");
      router.replace(aoConcluir);
      router.refresh();
    } catch (e) {
      setErro(
        e instanceof Error
          ? e.message
          : "Não foi possível salvar a senha. Tente de novo.",
      );
      setSalvando(false);
    }
  }

  return (
    <form onSubmit={salvar} className="space-y-4">
      <label className="block">
        <Rotulo dica="Mínimo de 6 caracteres">Nova senha</Rotulo>
        <div className="relative">
          <Campo
            type={visivel ? "text" : "password"}
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            autoComplete="new-password"
            autoFocus
            className="pr-11"
          />
          <button
            type="button"
            onClick={() => setVisivel((v) => !v)}
            aria-label={visivel ? "Ocultar senha" : "Mostrar senha"}
            className="absolute inset-y-0 right-0 grid w-11 place-items-center text-texto-suave transition hover:text-texto"
          >
            {visivel ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </label>

      <label className="block">
        <Rotulo>Confirmar nova senha</Rotulo>
        <Campo
          type={visivel ? "text" : "password"}
          value={repetir}
          onChange={(e) => setRepetir(e.target.value)}
          autoComplete="new-password"
        />
      </label>

      {erro ? <p className="text-[13px] text-perigo">{erro}</p> : null}
      {pronto ? <p className="text-[13px] text-sucesso">Senha salva. Entrando…</p> : null}

      <Botao
        type="submit"
        variante="solido"
        tamanho="lg"
        className="w-full"
        disabled={salvando || pronto}
      >
        {salvando ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
        Salvar senha
      </Botao>
    </form>
  );
}
