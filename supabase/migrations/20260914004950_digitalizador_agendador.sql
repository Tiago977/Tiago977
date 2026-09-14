create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

-- Segredo compartilhado entre o agendador (pg_cron) e a função que despacha os
-- envios. Sem políticas de RLS: apenas a service role enxerga esta tabela.
create table if not exists public.config_agendador (
  chave text primary key,
  valor text not null
);
alter table public.config_agendador enable row level security;

insert into public.config_agendador (chave, valor)
values ('segredo', encode(extensions.gen_random_bytes(32), 'hex'))
on conflict (chave) do nothing;
