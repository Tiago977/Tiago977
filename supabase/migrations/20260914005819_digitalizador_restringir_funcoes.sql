-- Funções de gatilho não devem ser chamáveis pela API REST.
revoke all on function public.criar_conta_para_usuario() from public, anon, authenticated;
revoke all on function public.tocar_conversa() from public, anon, authenticated;

-- As auxiliares de RLS são avaliadas com o papel de quem consulta, então
-- "authenticated" precisa executá-las; visitantes anônimos, não.
revoke all on function public.documento_visivel(uuid, uuid) from public, anon;
revoke all on function public.eh_membro(uuid, uuid) from public, anon;
grant execute on function public.documento_visivel(uuid, uuid) to authenticated;
grant execute on function public.eh_membro(uuid, uuid) to authenticated;
