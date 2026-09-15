import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

falhas = []


def verificar(obtido, esperado):
    if obtido != esperado:
        falhas.append(f"esperava {esperado!r}, veio {obtido!r}")


from resolva import eh_palindromo

verificar(eh_palindromo("arara"), True)
verificar(eh_palindromo("Ame a ema"), True)
verificar(eh_palindromo("python"), False)
verificar(eh_palindromo(""), True)
verificar(eh_palindromo("A"), True)


if falhas:
    print("\n".join(falhas))
    sys.exit(1)
