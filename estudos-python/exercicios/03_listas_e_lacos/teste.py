import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

falhas = []


def verificar(obtido, esperado):
    if obtido != esperado:
        falhas.append(f"esperava {esperado!r}, veio {obtido!r}")


from resolva import media

verificar(media([10, 8, 6]), 8.0)
verificar(media([7]), 7.0)
verificar(media([]), 0)
verificar(media([1, 2]), 1.5)


if falhas:
    print("\n".join(falhas))
    sys.exit(1)
