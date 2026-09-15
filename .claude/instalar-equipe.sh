#!/usr/bin/env sh
# Copia a equipe para ~/.claude/, deixando os agentes e o /equipe disponíveis em
# todos os seus projetos. Não sobrescreve arquivo que já existe lá.
#
#   sh .claude/instalar-equipe.sh
set -eu

origem=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
destino="${HOME}/.claude"

mkdir -p "${destino}/agents" "${destino}/commands"

for arquivo in "${origem}/agents/"*.md "${origem}/commands/"*.md; do
  [ -e "$arquivo" ] || continue
  pasta=$(basename "$(dirname -- "$arquivo")")
  alvo="${destino}/${pasta}/$(basename -- "$arquivo")"
  if [ -e "$alvo" ]; then
    echo "já existe, mantido: ${alvo}"
  else
    cp "$arquivo" "$alvo"
    echo "instalado: ${alvo}"
  fi
done

echo
echo "Pronto. Abra o Claude Code em qualquer projeto e use /equipe."
