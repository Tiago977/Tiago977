# Equipe de agentes

Uma equipe de especialistas pronta para usar em **qualquer projeto** — nenhum deles
assume linguagem, framework ou banco. Cada um começa lendo o repositório e seguindo
a convenção que já está lá; em projeto novo, o `arquiteto` é quem escolhe a stack.

Cada arquivo `.md` desta pasta é um agente. Eles rodam em sessões separadas, com
contexto próprio, e devolvem o resultado para a sessão principal — que faz o papel
de orquestrador.

| Agente | Cuida de | Mexe no código? |
| --- | --- | --- |
| `produto` | Brainstorm, PoC, corte do MVP, critérios de aceite | Não |
| `arquiteto` | Stack, plano, contratos, divisão em fatias paralelas | Não |
| `designer` | Fluxo de telas, tokens, estados, texto da interface | Não (especifica) |
| `backend` | Modelo de dados, migrations, permissão, API, jobs | Sim |
| `frontend` | Telas, componentes, estado, estilo, acessibilidade | Sim |
| `qa` | lint, tipos, teste, build, caça a bug, roteiro manual | Só correção óbvia |
| `devops` | Ambiente, deploy, CI, migration em produção | Sim |
| `revisor` | Revisão crítica e segurança do diff | Não (sem `Edit`) |

## Como usar

**Pipeline completo** — para um projeto novo ou uma funcionalidade nova:

```
/equipe um app de controle de gastos com foto do recibo
```

Isso toca a ideia por produto → arquiteto → implementação em paralelo → QA →
revisão, parando para você aprovar o escopo e o plano.

**Um agente só** — quando você já sabe o que quer:

```
usa o agente frontend para arrumar o estado vazio da lista
usa o revisor no que eu acabei de mudar
```

## Levar a equipe para outro lugar

- **Em todos os seus projetos:** `sh .claude/instalar-equipe.sh` copia os agentes e o
  comando para `~/.claude/`, sem sobrescrever o que já estiver lá.
- **Em um projeto específico:** copie as pastas `.claude/agents/` e
  `.claude/commands/` para a raiz dele. Agente do projeto tem prioridade sobre o de
  `~/.claude/`, então dá para especializar um sem perder o resto.

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
escolhido — escreva ali *quando* usar, não só *o que* ele faz. O campo `tools` limita
o que ele pode fazer (o `revisor`, por exemplo, não tem `Edit`: ele não consegue
alterar nada, mesmo se quiser).
