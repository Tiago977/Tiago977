import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

falhas = []


def verificar(obtido, esperado):
    if obtido != esperado:
        falhas.append(f"esperava {esperado!r}, veio {obtido!r}")


from resolva import contar_palavras

verificar(contar_palavras("a b a"), {"a": 2, "b": 1})
verificar(contar_palavras(""), {})
verificar(contar_palavras("sol"), {"sol": 1})
verificar(contar_palavras("sol sol sol"), {"sol": 3})
verificar(contar_palavras("casa Casa"), {"casa": 1, "Casa": 1})


if falhas:
    print("\n".join(falhas))
    sys.exit(1)
