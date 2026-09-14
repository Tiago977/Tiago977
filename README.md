# Digitalizador

Aplicativo web instalável (PWA) para digitalizar documentos com a câmera do
celular, organizar em pastas, enviar em massa ou com hora marcada e conversar
com outras pessoas da equipe.

Feito com Next.js 16 (App Router) e Supabase (autenticação, banco, arquivos e
tempo real). Todo o tratamento de imagem acontece no próprio aparelho — nenhuma
foto sai do navegador antes de você salvar.

## O que já funciona

| Recurso | Onde |
| --- | --- |
| Captura pela câmera ou envio de foto | `/digitalizar` |
| Recorte automático do documento e ajuste manual dos cantos | `src/lib/imagem/deteccao.ts` |
| Correção de perspectiva (endireita a foto torta) | `src/lib/imagem/perspectiva.ts` |
| Colorido, tons de cinza e preto e branco | `src/lib/imagem/realce.ts` |
| Remoção de sombra, realce de nitidez e escolha de resolução | `src/lib/imagem/realce.ts` |
| Várias páginas no mesmo documento | `/digitalizar` |
| Exportar em PDF, JPG ou PNG | `src/lib/imagem/exportar.ts` |
| Pastas, subpastas, mover e excluir | `/arquivos` |
| Download individual ou em lote (.zip) | `/arquivos` |
| Envio em massa para vários destinatários | `/envios/novo` |
| Agendamento de envio com data e hora | `/envios/novo` |
| Chat em tempo real e compartilhamento de documentos | `/conversas` |

## Como o tratamento de imagem funciona

Sem biblioteca externa de visão computacional e sem chamada de rede:

1. **Detecção** — a foto é reduzida, separada em papel e fundo pelo limiar de
   Otsu, e a maior região conectada vira o documento. Os quatro cantos saem dos
   extremos de `x+y` e `x−y` dessa região, o que acerta retângulos em qualquer
   ângulo. Se nada for reconhecido, você ajusta os cantos com o dedo.
2. **Perspectiva** — resolve a homografia 3×3 entre os cantos e um retângulo, e
   reamostra cada pixel com interpolação bilinear.
3. **Iluminação** — a imagem é dividida pela própria luz de fundo estimada, o
   que apaga sombra de mão, vinheta e papel amarelado.
4. **Cor** — preto e branco usa limiarização adaptativa de Bradley (cada pixel
   comparado com a vizinhança), preservando texto claro e escuro na mesma
   página.

## Configuração

### 1. Variáveis de ambiente

Copie `.env.example` para `.env.local` e preencha com os dados do seu projeto
Supabase (Configurações → API):

```bash
cp .env.example .env.local
```

### 2. Banco de dados

O schema completo está versionado em `supabase/migrations/`. Para aplicá-lo em
um projeto novo:

```bash
supabase link --project-ref SEU-REF
supabase db push
```

Antes disso, abra `supabase/migrations/20260914005103_digitalizador_cron_despacho.sql`
e troque o host da URL pelo do seu projeto — é ele que o agendador chama.

As tabelas são `contas`, `pastas`, `documentos`, `documento_paginas`, `envios`,
`envio_itens`, `conversas`, `conversa_membros` e `mensagens`, todas com RLS:
cada pessoa só enxerga o que é seu, mais os documentos que recebeu em uma
conversa.

Os arquivos ficam no bucket privado `documentos`, no caminho
`{usuário}/{documento}/…`, e são servidos por links assinados temporários.

A Edge Function do agendador fica em `supabase/functions/despachar-envios/`.

### 3. Envio de e-mail

O agendador já roda sozinho: um job do `pg_cron` chama a Edge Function
`despachar-envios` a cada minuto, que procura envios vencidos, gera links
assinados de 7 dias e dispara o e-mail.

Falta só a chave do provedor de e-mail. No painel do Supabase, em
**Edge Functions → Secrets**, adicione:

| Segredo | Para quê |
| --- | --- |
| `RESEND_API_KEY` | Obrigatório. Chave da [Resend](https://resend.com) usada para enviar. |
| `REMETENTE_EMAIL` | Opcional. Ex.: `Documentos <envios@seudominio.com>`. Sem domínio verificado, a Resend só entrega para o seu próprio e-mail. |
| `ENDERECO_APP` | Opcional. Endereço público do app, usado no rodapé do e-mail. |

Sem `RESEND_API_KEY`, o envio é marcado como **falhou** com essa explicação na
tela de Envios — nada é perdido, basta configurar e criar o envio de novo.

### 4. Rodar

```bash
npm install
npm run dev
```

A câmera exige `https` ou `localhost`. Em rede local pelo celular, use um túnel
(ngrok, Cloudflare Tunnel) ou publique o app.

## Deploy

Qualquer hospedagem de Next.js serve. Na Vercel, basta importar o repositório e
definir `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` e
`NEXT_PUBLIC_SITE_URL`. Depois, no Supabase, em **Authentication → URL
Configuration**, inclua o endereço publicado em *Redirect URLs* para os links de
confirmação e de acesso por e-mail funcionarem.

Vale também ligar **Leaked Password Protection** em Authentication → Policies.

## Estrutura

```
src/
  app/
    (app)/            telas autenticadas: arquivos, digitalizar, envios, conversas
    entrar/           login e criação de conta
    auth/             confirmação de e-mail e saída
  components/         interface, agrupada por tela
  lib/
    imagem/           detecção, perspectiva, realce e exportação
    supabase/         clientes de navegador e de servidor
    dados.ts          leitura e escrita no banco e no storage
  proxy.ts            renova a sessão e protege as rotas
```
