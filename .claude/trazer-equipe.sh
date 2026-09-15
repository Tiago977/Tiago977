#!/usr/bin/env sh
# Traz a equipe de agentes para o PROJETO ATUAL (./.claude/).
# Use em sessão da web, onde cada sessão nasce limpa.
#
#   curl -fsSL https://raw.githubusercontent.com/Tiago977/Tiago977/main/.claude/trazer-equipe.sh | sh
#
# Não sobrescreve arquivo que já exista no projeto.
set -eu

origem_remota="https://github.com/Tiago977/Tiago977.git"
destino="$(pwd)/.claude"

# Se o script está ao lado da equipe, usa o disco. Senão, busca no GitHub.
aqui=$(CDPATH= cd -- "$(dirname -- "${0:-.}")" 2>/dev/null && pwd || echo "")
if [ -n "$aqui" ] && [ -d "${aqui}/agents" ]; then
  origem="$aqui"
  temporario=""
else
  temporario=$(mktemp -d)
  echo "buscando a equipe em ${origem_remota}"
  git clone -q --depth 1 "$origem_remota" "${temporario}/repositorio"
  origem="${temporario}/repositorio/.claude"
fi

copiados=0
for pasta in agents commands; do
  [ -d "${origem}/${pasta}" ] || continue
  mkdir -p "${destino}/${pasta}"
  for arquivo in "${origem}/${pasta}/"*.md; do
    [ -e "$arquivo" ] || continue
    alvo="${destino}/${pasta}/$(basename -- "$arquivo")"
    if [ -e "$alvo" ]; then
      echo "já existe, mantido: ${pasta}/$(basename -- "$alvo")"
    else
      cp "$arquivo" "$alvo"
      echo "trazido: ${pasta}/$(basename -- "$alvo")"
      copiados=$((copiados + 1))
    fi
  done
done

# A documentação da equipe viaja junto.
if [ -f "${origem}/EQUIPE.md" ] && [ ! -e "${destino}/EQUIPE.md" ]; then
  cp "${origem}/EQUIPE.md" "${destino}/EQUIPE.md"
  echo "trazido: EQUIPE.md"
  copiados=$((copiados + 1))
fi

[ -n "$temporario" ] && rm -rf "$temporario"

echo
if [ "$copiados" -gt 0 ]; then
  echo "Pronto: ${copiados} arquivo(s). A equipe vale neste projeto — use /equipe."
  echo "Para guardar, não esqueça de commitar a pasta .claude/."
else
  echo "Nada a trazer: a equipe já estava aqui."
fi
