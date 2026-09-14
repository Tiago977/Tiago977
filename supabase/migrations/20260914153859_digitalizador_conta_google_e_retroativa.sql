-- O Google entrega o nome em "full_name" ou "name"; o cadastro por e-mail usa
-- "nome". Sem cobrir os três, quem entra pelo Google fica com o prefixo do
-- e-mail como nome.
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
    coalesce(
      nullif(new.raw_user_meta_data->>'nome', ''),
      nullif(new.raw_user_meta_data->>'full_name', ''),
      nullif(new.raw_user_meta_data->>'name', ''),
      split_part(coalesce(new.email, ''), '@', 1)
    ),
    coalesce(new.email, '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke all on function public.criar_conta_para_usuario() from public, anon, authenticated;

-- Contas criadas antes deste gatilho existir ficaram sem perfil.
insert into public.contas (id, nome, email)
select
  u.id,
  coalesce(
    nullif(u.raw_user_meta_data->>'nome', ''),
    nullif(u.raw_user_meta_data->>'full_name', ''),
    nullif(u.raw_user_meta_data->>'name', ''),
    split_part(coalesce(u.email, ''), '@', 1)
  ),
  coalesce(u.email, '')
from auth.users u
on conflict (id) do nothing;
