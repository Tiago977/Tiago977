# Equipe de agentes

Cada arquivo `.md` desta pasta é um agente especialista. Eles rodam em sessões
separadas, com contexto próprio, e devolvem o resultado para a sessão principal —
que faz o papel de orquestrador.

| Agente | Cuida de | Escreve código? |
| --- | --- | --- |
| `produto` | Brainstorm, PoC, corte do MVP, critérios de aceite | Não |
| `arquiteto` | Plano técnico, contratos, divisão em fatias paralelas | Não |
| `backend-supabase` | Migrations, RLS, edge functions, `src/lib/` | Sim |
| `frontend-next` | Rotas do App Router, componentes, Tailwind | Sim |
| `qa` | lint, typecheck, build, roteiro de teste, caça a bug | Só correção óbvia |
| `devops` | Ambiente, deploy, CI, migration em produção | Sim |
| `revisor` | Revisão crítica e segurança do diff | Não |

## Como usar

**Pipeline completo** — para uma funcionalidade nova ou um app novo:

```
/equipe um modo de assinar o documento digitalizado com o dedo
```

Isso toca a ideia por produto → arquiteto → implementação em paralelo → QA →
revisão, parando para você aprovar o escopo e o plano.

**Um agente só** — quando você já sabe o que quer:

```
usa o agente frontend-next para arrumar o estado vazio da tela de arquivos
usa o revisor no que eu acabei de mudar
```

## Como o paralelismo funciona de verdade

Vale saber o limite antes de contar com ele:

- **Contexto não é compartilhado.** Cada agente começa do zero e só sabe o que o
  orquestrador escreveu no prompt dele. Eles não conversam entre si.
- **O paralelo é real, o conflito também.** Dois agentes disparados juntos editam o
  disco ao mesmo tempo. Eles só podem rodar em paralelo se os arquivos não se
  cruzarem — por isso o `arquiteto` fecha os contratos antes e separa as fatias por
  arquivo.
- **Leitura paralela é sempre segura.** Vários agentes investigando, revisando ou
  planejando ao mesmo tempo nunca dão conflito.
- **Delegar custa.** Cada agente reconstrói o contexto do zero. Para mexer em um
  arquivo só, sai mais rápido e mais barato fazer direto, sem equipe.

## Mudar a equipe

É markdown: edite o arquivo do agente para ajustar o comportamento, ou copie um
existente para criar um novo. O campo `description` é o que decide quando o agente é
escolhido — escreva ali *quando* usar, não só *o que* ele faz. O campo `tools`
limita o que ele pode fazer (o `revisor`, por exemplo, não tem `Edit`: ele não
consegue alterar nada, mesmo se quiser).
