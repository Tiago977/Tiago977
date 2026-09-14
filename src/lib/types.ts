export type ModoCor = "cor" | "cinza" | "pb";
export type Formato = "pdf" | "jpeg" | "png";
export type Resolucao = "original" | "alta" | "maxima";
export type StatusEnvio =
  | "agendado"
  | "processando"
  | "enviado"
  | "falhou"
  | "cancelado";

export type Conta = {
  id: string;
  nome: string;
  email: string;
  criado_em: string;
};

export type Pasta = {
  id: string;
  dono: string;
  pai_id: string | null;
  nome: string;
  cor: string | null;
  criado_em: string;
  atualizado_em: string;
};

export type Documento = {
  id: string;
  dono: string;
  pasta_id: string | null;
  titulo: string;
  formato: Formato;
  modo_cor: ModoCor;
  resolucao: Resolucao;
  paginas: number;
  tamanho_bytes: number;
  caminho: string;
  miniatura: string | null;
  criado_em: string;
  atualizado_em: string;
};

export type Envio = {
  id: string;
  dono: string;
  assunto: string;
  mensagem: string;
  destinatarios: string[];
  agendado_para: string | null;
  status: StatusEnvio;
  enviado_em: string | null;
  erro: string | null;
  criado_em: string;
};

export type Conversa = {
  id: string;
  criado_por: string;
  titulo: string | null;
  criado_em: string;
  ultima_mensagem_em: string;
};

export type Mensagem = {
  id: string;
  conversa_id: string;
  autor: string;
  corpo: string;
  documento_id: string | null;
  criado_em: string;
};

type Tabela<Linha, Insercao = Partial<Linha>, Atualizacao = Partial<Linha>> = {
  Row: Linha;
  Insert: Insercao;
  Update: Atualizacao;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      contas: Tabela<Conta>;
      pastas: Tabela<Pasta>;
      documentos: Tabela<Documento>;
      documento_paginas: Tabela<{
        id: string;
        documento_id: string;
        indice: number;
        caminho: string;
        largura: number;
        altura: number;
      }>;
      envios: Tabela<Envio>;
      envio_itens: Tabela<{ envio_id: string; documento_id: string }>;
      conversas: Tabela<Conversa>;
      conversa_membros: Tabela<{
        conversa_id: string;
        usuario_id: string;
        entrou_em: string;
        lido_ate: string;
      }>;
      mensagens: Tabela<Mensagem>;
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
};
