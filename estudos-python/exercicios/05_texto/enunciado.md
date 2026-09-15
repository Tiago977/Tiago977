# Texto: limpar antes de comparar

Escreva a função `eh_palindromo`, que devolve `True` se o texto se lê igual de
trás para frente, e `False` se não.

Ignore **espaços** e a diferença entre **maiúscula e minúscula**:
`"Ame a ema"` é palíndromo.

## Exemplos

```python
eh_palindromo("arara")  →  True
eh_palindromo("Ame a ema")  →  True
eh_palindromo("python")  →  False
```

## Dica

Limpe o texto primeiro, depois compare. `texto.lower()` derruba as maiúsculas e
`texto.replace(" ", "")` tira os espaços. Para inverter um texto: `texto[::-1]`.

## Como fazer

Abra `resolva.py`, escreva a função e rode, aqui nesta pasta:

```sh
python ../../verificar.py
```

Travou? Peça ajuda ao tutor, sem pedir a resposta:

```
/corrigir
```
