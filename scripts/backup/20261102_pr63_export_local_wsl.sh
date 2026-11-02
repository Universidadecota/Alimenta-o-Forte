#!/usr/bin/env bash
# Costa&Costa — PR #63 | Exportacao logica inicial, somente leitura no Supabase.
# EXECUCAO MANUAL em maquina confiavel com Docker e Supabase CLI.
# Este dump NAO substitui backup dos objetos no Storage nem prova restauracao.
set -euo pipefail
umask 077

EXPECTED_REF="gclhailalyrokvmkwllm"
for bin in supabase docker sha256sum date; do
  command -v "$bin" >/dev/null 2>&1 || { echo "Dependencia ausente: $bin" >&2; exit 1; }
done
docker info >/dev/null 2>&1 || { echo "Docker nao esta disponivel." >&2; exit 1; }
supabase --version
root="${CC_BACKUP_ROOT:-$HOME/cc-secure-backups}"
stamp="$(date -u +%Y%m%dT%H%M%SZ)"
destination="$root/$EXPECTED_REF/$stamp"
mkdir -p "$destination"
chmod 700 "$destination"
printf '%s\n' "Destino local privado: $destination"
printf '%s\n' "Cole a CONNECTION STRING do projeto correto apenas neste terminal local."
printf '%s\n' "Nao envie a senha, URI ou arquivos SQL por mensagens ou ao GitHub."
read -r -s -p "CONNECTION STRING (nao sera exibida): " db_url
printf '\n'
trap 'unset db_url' EXIT
if [[ "$db_url" != postgresql://* && "$db_url" != postgres://* ]]; then
  echo "URL deve comecar com postgresql:// ou postgres://" >&2; exit 1
fi
if [[ "$db_url" != *"$EXPECTED_REF"* ]]; then
  echo "Projeto incorreto na connection string; operacao cancelada." >&2; exit 1
fi

# O CLI pode transmitir a URI via argumentos ao processo filho.
# Execute apenas em maquina propria, sem capturar logs com a URI.
supabase db dump --db-url "$db_url" -f "$destination/roles.sql" --role-only
supabase db dump --db-url "$db_url" -f "$destination/schema.sql"
supabase db dump --db-url "$db_url" -f "$destination/data.sql" --use-copy --data-only -x "storage.buckets_vectors" -x "storage.vector_indexes"

for file in roles.sql schema.sql data.sql; do
  test -s "$destination/$file" || { echo "Exportacao incompleta: $file" >&2; exit 1; }
done
(
  cd "$destination"
  sha256sum roles.sql schema.sql data.sql > SHA256SUMS.txt
  sha256sum -c SHA256SUMS.txt
)
cat > "$destination/STATUS_BACKUP.txt" <<'STATUS'
EXPORTACAO LOGICA PARCIAL — NAO CERTIFICADA COMO RESTAURAVEL.
Necessario validar se AUTH (auth.users e relacionados) consta no dump.
Necessario salvar separadamente os objetos dos buckets do Storage.
Necessario conferir Edge Functions/configuracoes e testar restore isolado.
NUNCA versionar ou enviar esses arquivos a GitHub/chat.
Nenhuma operacao destrutiva ou alteracao em producao foi autorizada por este arquivo.
STATUS
printf '%s\n' "Arquivos exportados e checksums gerados em: $destination"
printf '%s\n' "ATENCAO: backup ainda INCOMPLETO, sem Auth/Storage/restore certificados."
