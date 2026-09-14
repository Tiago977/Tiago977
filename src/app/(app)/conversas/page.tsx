import type { Metadata } from "next";
import { MessagesSquare } from "lucide-react";
import { Vazio } from "@/components/ui";

export const metadata: Metadata = { title: "Conversas" };

export default function PaginaConversas() {
  return (
    <div className="hidden flex-1 items-center justify-center md:flex">
      <Vazio
        icone={<MessagesSquare className="size-5" />}
        titulo="Escolha uma conversa"
        descricao="Fale com a equipe e compartilhe documentos já digitalizados sem sair do app."
      />
    </div>
  );
}
