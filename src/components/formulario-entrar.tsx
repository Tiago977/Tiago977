"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Mail } from "lucide-react";
import { criarClienteNavegador } from "@/lib/supabase/client";
import { Botao, Campo, Rotulo } from "@/components/ui";
import { validarEmail } from "@/lib/ui";

type Modo = "entrar" | "criar";

export function FormularioEntrar() {
  const router = useRouter();
  const parametros = useSearchParams();
  const proximo = parametros.get("proximo") || "/arquivos";

  const [modo, setModo] = useState<Modo>("entrar");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(
    parametros.get("erro") === "link-expirado"
      ? "Esse link já expirou. Peça um novo abaixo."
      : parametros.get("erro") === "link-invalido"
        ? "Link inválido. Tente entrar novamente."
        : null,
  );
  const [aviso, setAviso] = useState<string | null>(null);
  const [enviando, iniciar] = useTransition();

  function enviar(evento: React.FormEvent) {
    evento.preventDefault();
    setErro(null);
    setAviso(null);

    if (!validarEmail(email)) return setErro("Informe um e-mail válido.");
    if (senha.length < 6) return setErro("A senha precisa ter ao menos 6 caracteres.");

    iniciar(async () => {
      const supabase = criarClienteNavegador();

      if (modo === "criar") {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: senha,
          options: {
            data: { nome: nome.trim() || email.split("@")[0] },
            emailRedirectTo: `${location.origin}/auth/confirmar?proximo=${encodeURIComponent(proximo)}`,
          },
        });
        if (error) return setErro(traduzir(error.message));

        // Para não revelar quem tem cadastro, o Supabase responde a um e-mail já
        // existente como se tivesse dado certo, mas sem nenhuma identidade nova
        // e sem enviar e-mail. Sem checar isso, a pessoa ficaria esperando para
        // sempre uma mensagem que nunca vai chegar.
        if (data.user && data.user.identities?.length === 0) {
          setModo("entrar");
          return setErro(
            "Esse e-mail já tem uma conta. Entre com a senha dela ou use o link por e-mail abaixo.",
          );
        }

        if (!data.session) {
          return setAviso(
            "Conta criada. Confirme o e-mail que acabamos de enviar para entrar.",
          );
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: senha,
        });
        if (error) return setErro(traduzir(error.message));
      }

      router.replace(proximo);
      router.refresh();
    });
  }

  function enviarLink() {
    setErro(null);
    setAviso(null);
    if (!validarEmail(email)) return setErro("Informe seu e-mail para receber o link.");

    iniciar(async () => {
      const supabase = criarClienteNavegador();
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: `${location.origin}/auth/confirmar?proximo=${encodeURIComponent(proximo)}`,
        },
      });
      if (error) return setErro(traduzir(error.message));
      setAviso("Link enviado. Confira sua caixa de entrada.");
    });
  }

  return (
    <form onSubmit={enviar} className="space-y-4">
      <div className="flex gap-1 rounded-xl bg-painel-suave p-1">
        {(["entrar", "criar"] as const).map((valor) => (
          <button
            key={valor}
            type="button"
            onClick={() => {
              setModo(valor);
              setErro(null);
              setAviso(null);
            }}
            className={`h-9 flex-1 rounded-lg text-[13px] font-medium transition ${
              modo === valor
                ? "bg-painel text-texto shadow-painel"
                : "text-texto-suave hover:text-texto"
            }`}
          >
            {valor === "entrar" ? "Entrar" : "Criar conta"}
          </button>
        ))}
      </div>

      {modo === "criar" ? (
        <label className="block">
          <Rotulo>Nome</Rotulo>
          <Campo
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Como quer ser chamado"
            autoComplete="name"
          />
        </label>
      ) : null}

      <label className="block">
        <Rotulo>E-mail</Rotulo>
        <Campo
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="voce@exemplo.com"
          autoComplete="email"
          required
        />
      </label>

      <label className="block">
        <Rotulo>Senha</Rotulo>
        <Campo
          type="password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          placeholder="Mínimo de 6 caracteres"
          autoComplete={modo === "criar" ? "new-password" : "current-password"}
          required
        />
      </label>

      {erro ? <p className="text-[13px] text-perigo">{erro}</p> : null}
      {aviso ? <p className="text-[13px] text-sucesso">{aviso}</p> : null}

      <Botao type="submit" variante="solido" tamanho="lg" className="w-full" disabled={enviando}>
        {enviando ? <Loader2 className="size-4 animate-spin" /> : null}
        {modo === "criar" ? "Criar conta" : "Entrar"}
      </Botao>

      <Botao
        type="button"
        variante="sutil"
        className="w-full"
        onClick={enviarLink}
        disabled={enviando}
      >
        <Mail className="size-4" />
        Entrar com link por e-mail
      </Botao>
    </form>
  );
}

function traduzir(mensagem: string) {
  const m = mensagem.toLowerCase();
  if (m.includes("invalid login credentials")) return "E-mail ou senha incorretos.";
  if (m.includes("already registered")) return "Esse e-mail já tem conta. Use a aba Entrar.";
  if (m.includes("email not confirmed")) return "Confirme seu e-mail antes de entrar.";
  if (m.includes("rate limit") || m.includes("too many"))
    return "Muitas tentativas. Aguarde um minuto e tente de novo.";
  if (m.includes("password")) return "Senha muito curta ou fraca.";
  return mensagem;
}
