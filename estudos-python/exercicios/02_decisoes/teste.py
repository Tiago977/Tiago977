import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

falhas = []


def verificar(obtido, esperado):
    if obtido != esperado:
        falhas.append(f"esperava {esperado!r}, veio {obtido!r}")


from resolva import classificar_nota

verificar(classificar_nota(10), "aprovado")
verificar(classificar_nota(7), "aprovado")
verificar(classificar_nota(6.5), "recuperação")
verificar(classificar_nota(5), "recuperação")
verificar(classificar_nota(4.9), "reprovado")
verificar(classificar_nota(0), "reprovado")


if falhas:
    print("\n".join(falhas))
    sys.exit(1)
