-- Chama a Edge Function "despachar-envios" a cada minuto. Ela procura envios
-- vencidos, gera links assinados e dispara os e-mails.
--
-- ATENÇÃO ao aplicar em outro projeto: troque o host da URL abaixo pelo do seu
-- projeto Supabase.

select cron.unschedule('despachar-envios')
where exists (select 1 from cron.job where jobname = 'despachar-envios');

select cron.schedule(
  'despachar-envios',
  '* * * * *',
  $job$
  select net.http_post(
    url := 'https://nzwicobusvkkrvqmhpuj.supabase.co/functions/v1/despachar-envios',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-chave-agendador', (select valor from public.config_agendador where chave = 'segredo')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 25000
  );
  $job$
);
