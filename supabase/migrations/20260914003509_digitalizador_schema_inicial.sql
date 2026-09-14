-- ============ Contas ============
create table if not exists public.contas (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null default '',
  email text not null default '',
  criado_em timestamptz not null default now()
);

create or replace function public.criar_conta_para_usuario()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.contas (id, nome, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nome', split_part(new.email, '@', 1)),
    coalesce(new.email, '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists ao_criar_usuario on auth.users;
create trigger ao_criar_usuario
  after insert on auth.users
  for each row execute function public.criar_conta_para_usuario();

-- ============ Pastas ============
create table if not exists public.pastas (
  id uuid primary key default gen_random_uuid(),
  dono uuid not null references auth.users(id) on delete cascade,
  pai_id uuid references public.pastas(id) on delete cascade,
  nome text not null,
  cor text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create index if not exists pastas_dono_pai_idx on public.pastas (dono, pai_id);
create unique index if not exists pastas_nome_unico_idx
  on public.pastas (dono, coalesce(pai_id, '00000000-0000-0000-0000-000000000000'::uuid), lower(nome));

-- ============ Documentos ============
create table if not exists public.documentos (
  id uuid primary key default gen_random_uuid(),
  dono uuid not null references auth.users(id) on delete cascade,
  pasta_id uuid references public.pastas(id) on delete set null,
  titulo text not null,
  formato text not null default 'pdf' check (formato in ('pdf','jpeg','png')),
  modo_cor text not null default 'cor' check (modo_cor in ('cor','cinza','pb')),
  resolucao text not null default 'alta' check (resolucao in ('original','alta','maxima')),
  paginas int not null default 1,
  tamanho_bytes bigint not null default 0,
  caminho text not null,
  miniatura text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create index if not exists documentos_dono_pasta_idx on public.documentos (dono, pasta_id, criado_em desc);

create table if not exists public.documento_paginas (
  id uuid primary key default gen_random_uuid(),
  documento_id uuid not null references public.documentos(id) on delete cascade,
  indice int not null,
  caminho text not null,
  largura int not null default 0,
  altura int not null default 0,
  unique (documento_id, indice)
);

-- ============ Envios ============
create table if not exists public.envios (
  id uuid primary key default gen_random_uuid(),
  dono uuid not null references auth.users(id) on delete cascade,
  assunto text not null default '',
  mensagem text not null default '',
  destinatarios text[] not null default '{}',
  agendado_para timestamptz,
  status text not null default 'agendado'
    check (status in ('agendado','processando','enviado','falhou','cancelado')),
  enviado_em timestamptz,
  erro text,
  criado_em timestamptz not null default now()
);
create index if not exists envios_pendentes_idx
  on public.envios (status, agendado_para)
  where status = 'agendado';
create index if not exists envios_dono_idx on public.envios (dono, criado_em desc);

create table if not exists public.envio_itens (
  envio_id uuid not null references public.envios(id) on delete cascade,
  documento_id uuid not null references public.documentos(id) on delete cascade,
  primary key (envio_id, documento_id)
);

-- ============ Chat ============
create table if not exists public.conversas (
  id uuid primary key default gen_random_uuid(),
  criado_por uuid not null references auth.users(id) on delete cascade,
  titulo text,
  criado_em timestamptz not null default now(),
  ultima_mensagem_em timestamptz not null default now()
);

create table if not exists public.conversa_membros (
  conversa_id uuid not null references public.conversas(id) on delete cascade,
  usuario_id uuid not null references auth.users(id) on delete cascade,
  entrou_em timestamptz not null default now(),
  lido_ate timestamptz not null default 'epoch',
  primary key (conversa_id, usuario_id)
);
create index if not exists conversa_membros_usuario_idx on public.conversa_membros (usuario_id);

create table if not exists public.mensagens (
  id uuid primary key default gen_random_uuid(),
  conversa_id uuid not null references public.conversas(id) on delete cascade,
  autor uuid not null references auth.users(id) on delete cascade,
  corpo text not null default '',
  documento_id uuid references public.documentos(id) on delete set null,
  criado_em timestamptz not null default now()
);
create index if not exists mensagens_conversa_idx on public.mensagens (conversa_id, criado_em);

-- Evita recursao de RLS entre conversas e conversa_membros.
create or replace function public.eh_membro(p_conversa uuid, p_usuario uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.conversa_membros
    where conversa_id = p_conversa and usuario_id = p_usuario
  );
$$;
