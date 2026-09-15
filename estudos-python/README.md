# Estudos de Python

Ambiente de estudo com correção automática e um tutor que **não entrega a resposta**.
Cinco exercícios em ordem crescente, do primeiro `print` até manipulação de texto.

## 1. Instalar o Python (Windows)

Baixe em <https://www.python.org/downloads/> e rode o instalador.

> **Marque a caixinha "Add python.exe to PATH"**, embaixo da primeira tela. Ela vem
> desmarcada, é pequena, e sem ela nada dos comandos abaixo funciona.

Feche e reabra o terminal, e confira:

```sh
python --version
```

Se aparecer algo como `Python 3.13.1`, está pronto. Se aparecer erro ou abrir a Loja
da Microsoft, o PATH não pegou — reinstale marcando a caixinha.

## 2. Baixar esta pasta

```sh
git clone https://github.com/Tiago977/estudos-python.git
cd estudos-python
```

## 3. Estudar

Veja onde você está:

```sh
python verificar.py
```

Ele lista os exercícios e aponta o próximo. Aí, para cada um:

1. Leia `exercicios/<numero>_<nome>/enunciado.md`
2. Escreva sua resposta em `resolva.py` — no lugar da linha `raise NotImplementedError`
3. Rode `python verificar.py` de novo

Quando o exercício virar `[ok]`, siga para o próximo.

## 4. Quando travar

Abra o Claude Code **nesta pasta** e use:

| Comando | O que faz |
| --- | --- |
| `/corrigir` | Olha o que você escreveu, roda o teste e te guia até o erro |
| `/aula <assunto>` | Aula curta sobre um assunto, terminando num exercício novo |

O tutor foi escrito para **não escrever a solução** — nem se você insistir. Ele dá
pista, faz pergunta e manda você testar. É de propósito: código que você não escreveu
não ensina nada a você.

Fora dos comandos, é conversa normal: cole a mensagem de erro e pergunte o que ela
significa.

## Os exercícios

| # | Assunto | O que você treina |
| --- | --- | --- |
| 01 | Primeiros passos | variável, texto, `return` |
| 02 | Decisões | `if` / `elif` / `else` e a ordem dos testes |
| 03 | Listas e laços | percorrer, somar, e o caso da lista vazia |
| 04 | Dicionários | contar ocorrências, `.get()` com valor padrão |
| 05 | Texto | limpar antes de comparar, fatiar com `[::-1]` |

Rodar um só, em vez de todos:

```sh
python verificar.py 03
```

## Sobre o terminal, no Windows

Estes comandos funcionam no **PowerShell**, no **Prompt de Comando** e no **Git Bash**.

Só uma ressalva sobre o Git Bash: se você digitar `python` sozinho lá, esperando o
modo interativo, a tela trava sem mostrar nada. Não é defeito do seu computador — é o
Git Bash que não conversa bem com programas de console do Windows. Use `winpty python`,
ou abra o modo interativo no PowerShell. Rodar arquivo (`python verificar.py`) funciona
normal nos três.

## Depois, quando quiser construir algo

Isto aqui é para aprender. Quando for partir para um projeto de verdade, traga a
equipe de agentes:

```sh
curl -fsSL https://raw.githubusercontent.com/Tiago977/Tiago977/main/.claude/trazer-equipe.sh | sh
```
