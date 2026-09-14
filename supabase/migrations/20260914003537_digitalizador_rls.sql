alter table public.contas             enable row level security;
alter table public.pastas             enable row level security;
alter table public.documentos         enable row level security;
alter table public.documento_paginas  enable row level security;
alter table public.envios             enable row level security;
alter table public.envio_itens        enable row level security;
alter table public.conversas          enable row level security;
alter table public.conversa_membros   enable row level security;
alter table public.mensagens          enable row level security;

-- Um documento e visivel para o dono e para quem o recebeu em uma conversa.
create or replace function public.documento_visivel(p_documento uuid, p_usuario uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.documentos d
    where d.id = p_documento and d.dono = p_usuario
  ) or exists (
    select 1
    from public.mensagens m
    join public.conversa_membros cm on cm.conversa_id = m.conversa_id
    where m.documento_id = p_documento and cm.usuario_id = p_usuario
  );
$$;

-- ---------- contas ----------
-- Perfis sao publicos entre usuarios autenticados para permitir iniciar conversas e envios.
create policy contas_leitura on public.contas
  for select to authenticated using (true);
create policy contas_atualizar_propria on public.contas
  for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- ---------- pastas ----------
create policy pastas_dono on public.pastas
  for all to authenticated
  using (dono = (select auth.uid())) with check (dono = (select auth.uid()));

-- ---------- documentos ----------
create policy documentos_leitura on public.documentos
  for select to authenticated
  using (public.documento_visivel(id, (select auth.uid())));
create policy documentos_inserir on public.documentos
  for insert to authenticated with check (dono = (select auth.uid()));
create policy documentos_atualizar on public.documentos
  for update to authenticated
  using (dono = (select auth.uid())) with check (dono = (select auth.uid()));
create policy documentos_remover on public.documentos
  for delete to authenticated using (dono = (select auth.uid()));

-- ---------- documento_paginas ----------
create policy paginas_leitura on public.documento_paginas
  for select to authenticated
  using (public.documento_visivel(documento_id, (select auth.uid())));
create policy paginas_escrita on public.documento_paginas
  for all to authenticated
  using (exists (select 1 from public.documentos d
                 where d.id = documento_id and d.dono = (select auth.uid())))
  with check (exists (select 1 from public.documentos d
                      where d.id = documento_id and d.dono = (select auth.uid())));

-- ---------- envios ----------
create policy envios_dono on public.envios
  for all to authenticated
  using (dono = (select auth.uid())) with check (dono = (select auth.uid()));
create policy envio_itens_dono on public.envio_itens
  for all to authenticated
  using (exists (select 1 from public.envios e
                 where e.id = envio_id and e.dono = (select auth.uid())))
  with check (exists (select 1 from public.envios e
                      where e.id = envio_id and e.dono = (select auth.uid())));

-- ---------- chat ----------
create policy conversas_membro on public.conversas
  for select to authenticated
  using (public.eh_membro(id, (select auth.uid())));
create policy conversas_criar on public.conversas
  for insert to authenticated with check (criado_por = (select auth.uid()));
create policy conversas_atualizar on public.conversas
  for update to authenticated
  using (public.eh_membro(id, (select auth.uid())))
  with check (public.eh_membro(id, (select auth.uid())));

create policy membros_leitura on public.conversa_membros
  for select to authenticated
  using (public.eh_membro(conversa_id, (select auth.uid())));
-- Quem criou a conversa monta a lista de participantes; depois so o proprio membro se altera.
create policy membros_inserir on public.conversa_membros
  for insert to authenticated
  with check (exists (select 1 from public.conversas c
                      where c.id = conversa_id and c.criado_por = (select auth.uid())));
create policy membros_atualizar_proprio on public.conversa_membros
  for update to authenticated
  using (usuario_id = (select auth.uid())) with check (usuario_id = (select auth.uid()));
create policy membros_sair on public.conversa_membros
  for delete to authenticated using (usuario_id = (select auth.uid()));

create policy mensagens_leitura on public.mensagens
  for select to authenticated
  using (public.eh_membro(conversa_id, (select auth.uid())));
create policy mensagens_enviar on public.mensagens
  for insert to authenticated
  with check (autor = (select auth.uid()) and public.eh_membro(conversa_id, (select auth.uid())));
create policy mensagens_remover_propria on public.mensagens
  for delete to authenticated using (autor = (select auth.uid()));
