# Dicionários: contar coisas

Escreva a função `contar_palavras`, que recebe um texto e devolve um dicionário
com quantas vezes cada palavra aparece.

As palavras vêm separadas por espaço. Não se preocupe com pontuação nem com
maiúsculas — considere `"casa"` e `"Casa"` palavras diferentes, por enquanto.

## Exemplos

```python
contar_palavras("a b a")  →  {"a": 2, "b": 1}
contar_palavras("")  →  {}
```

## Dica

`texto.split()` quebra o texto em uma lista de palavras.
Para somar no dicionário sem quebrar na primeira vez, veja `dicionario.get(chave, 0)`.

## Como fazer

Abra `resolva.py`, escreva a função e rode, aqui nesta pasta:

```sh
python ../../verificar.py
```

Travou? Peça ajuda ao tutor, sem pedir a resposta:

```
/corrigir
```
