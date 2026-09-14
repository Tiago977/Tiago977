-- Quem cria a conversa precisa enxergá-la antes de existir qualquer membro,
-- senão a política de inserção de membros nunca encontra a conversa e o
-- primeiro participante jamais pode ser adicionado.
create policy conversas_criador on public.conversas
  for select to authenticated
  using (criado_por = (select auth.uid()));
