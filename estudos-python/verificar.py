"""Roda os testes de todos os exercícios e mostra o que já passou.

    python verificar.py            # todos
    python verificar.py 03         # só o exercício que começa com 03
"""

import subprocess
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent
EXERCICIOS = RAIZ / "exercicios"


def main():
    filtro = sys.argv[1] if len(sys.argv) > 1 else ""
    pastas = sorted(p for p in EXERCICIOS.iterdir() if (p / "teste.py").is_file())
    if filtro:
        pastas = [p for p in pastas if p.name.startswith(filtro)]
        if not pastas:
            print(f"Nenhum exercício começa com {filtro!r}.")
            return 1

    passaram = 0
    pendentes = []

    for pasta in pastas:
        resultado = subprocess.run(
            [sys.executable, "teste.py"],
            cwd=pasta,
            capture_output=True,
            text=True,
        )
        if resultado.returncode == 0:
            passaram += 1
            print(f"  [ok]      {pasta.name}")
            continue

        saida = (resultado.stdout + resultado.stderr).strip()
        if "NotImplementedError" in saida:
            print(f"  [a fazer] {pasta.name}")
            pendentes.append(pasta)
            continue

        print(f"  [erro]    {pasta.name}")
        pendentes.append(pasta)
        for linha in saida.splitlines():
            print(f"            {linha}")

    total = len(pastas)
    print()
    print(f"{passaram} de {total} resolvido(s).")

    if pendentes:
        proximo = pendentes[0]
        print(f"Próximo: exercicios/{proximo.name}/enunciado.md")
        print("Travou? Abra o Claude Code nesta pasta e use /corrigir.")
        return 1

    print("Tudo resolvido. Peça um assunto novo com /aula.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
