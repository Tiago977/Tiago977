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

## Levar a equipe para onde você trabalha

A equipe mora neste repositório, que é público. Os dois caminhos abaixo partem daqui.

### No seu computador — uma vez, vale para sempre

Instala em `~/.claude/`, de onde o Claude Code lê em **qualquer** pasta que você abrir,
inclusive projeto que ainda não existe:

```sh
curl -fsSL https://raw.githubusercontent.com/Tiago977/Tiago977/main/.claude/instalar-equipe.sh | sh
```

Ou, se você já clonou este repositório: `sh .claude/instalar-equipe.sh`.

### Na web — uma vez por projeto

Toda sessão da web nasce limpa, então o que vale é o que está **dentro do repositório**
do projeto. Rode isto na raiz dele:

```sh
curl -fsSL https://raw.githubusercontent.com/Tiago977/Tiago977/main/.claude/trazer-equipe.sh | sh
```

Os agentes passam a valer na hora, sem reiniciar a sessão. Commite a pasta `.claude/`
para que o projeto continue com a equipe na próxima vez.

Nenhum dos dois sobrescreve arquivo que já exista — dá para rodar de novo sem medo,
e um agente que você tenha personalizado ali sobrevive.

### Qual ganha, se os dois existirem

O agente do projeto (`.claude/agents/` na pasta do trabalho) tem prioridade sobre o de
`~/.claude/agents/`. Então dá para ter a equipe padrão instalada no computador e, em um
projeto específico, sobrescrever só um deles — sem perder os outros.

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
