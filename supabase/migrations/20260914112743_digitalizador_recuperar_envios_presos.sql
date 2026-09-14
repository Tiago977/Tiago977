-- Marca quando o envio foi reservado, para que um despacho interrompido
-- (timeout, reinício da função) possa ser devolvido à fila em vez de ficar
-- preso em "processando" para sempre.
alter table public.envios
  add column if not exists processando_desde timestamptz;

create index if not exists envios_presos_idx
  on public.envios (processando_desde)
  where status = 'processando';
