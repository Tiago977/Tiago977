import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

falhas = []


def verificar(obtido, esperado):
    if obtido != esperado:
        falhas.append(f"esperava {esperado!r}, veio {obtido!r}")


from resolva import saudacao

verificar(saudacao("Tiago"), "Olá, Tiago!")
verificar(saudacao("Ana"), "Olá, Ana!")
verificar(saudacao("José da Silva"), "Olá, José da Silva!")


if falhas:
    print("\n".join(falhas))
    sys.exit(1)
