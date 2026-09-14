insert into storage.buckets (id, name, public, file_size_limit)
values ('documentos', 'documentos', false, 52428800)
on conflict (id) do update set public = false, file_size_limit = 52428800;

-- Caminho dos objetos: {dono}/{documento_id}/{arquivo}
create policy documentos_storage_leitura on storage.objects
  for select to authenticated
  using (
    bucket_id = 'documentos'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or public.documento_visivel(
           nullif((storage.foldername(name))[2], '')::uuid,
           (select auth.uid())
         )
    )
  );

create policy documentos_storage_escrita on storage.objects
  for insert to authenticated
  with check (bucket_id = 'documentos' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy documentos_storage_atualizar on storage.objects
  for update to authenticated
  using (bucket_id = 'documentos' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'documentos' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy documentos_storage_remover on storage.objects
  for delete to authenticated
  using (bucket_id = 'documentos' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- Mantem a lista de conversas ordenada pela atividade recente.
create or replace function public.tocar_conversa()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.conversas
     set ultima_mensagem_em = new.criado_em
   where id = new.conversa_id;
  return new;
end;
$$;

drop trigger if exists ao_inserir_mensagem on public.mensagens;
create trigger ao_inserir_mensagem
  after insert on public.mensagens
  for each row execute function public.tocar_conversa();

alter publication supabase_realtime add table public.mensagens;
alter publication supabase_realtime add table public.conversas;
