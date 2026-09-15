# Decisões: if, elif e else

Escreva a função `classificar_nota`, que recebe uma nota de 0 a 10 e devolve a
situação do aluno:

- 7 ou mais → `"aprovado"`
- 5 ou mais, mas menos que 7 → `"recuperação"`
- menos que 5 → `"reprovado"`

## Exemplos

```python
classificar_nota(8)  →  "aprovado"
classificar_nota(5)  →  "recuperação"
classificar_nota(4.9)  →  "reprovado"
```

## Dica

A ordem dos testes importa. Se você perguntar primeiro se a nota é maior que 5,
o 8 também passa por ali — e nunca chega no `"aprovado"`.

## Como fazer

Abra `resolva.py`, escreva a função e rode, aqui nesta pasta:

```sh
python ../../verificar.py
```

Travou? Peça ajuda ao tutor, sem pedir a resposta:

```
/corrigir
```
