#!/bin/bash

# Script de Deploy Individual para GitHub Pages
# Uso: ./deploy.sh <filename> <content> <type> <codeId> <codeName>

FILENAME="$1"
CONTENT="$2"
TYPE="$3"
CODE_ID="$4"
CODE_NAME="$5"

REPO_PATH="/var/www/admin.widgetvpn.xyz"
ASSETS_DIR="$REPO_PATH/assets"

# Criar diretório assets se não existir
mkdir -p "$ASSETS_DIR"

# Caminho do arquivo
FILE_PATH="$ASSETS_DIR/$FILENAME"

# Escrever conteúdo no arquivo
echo "$CONTENT" > "$FILE_PATH"

# Atualizar index.json
INDEX_FILE="$ASSETS_DIR/index.json"
TIMESTAMP=$(date -Iseconds)
SIZE=$(wc -c < "$FILE_PATH")

# Criar entrada JSON para o código
JSON_ENTRY=$(cat <<EOF
{
  "id": "$CODE_ID",
  "name": "$CODE_NAME",
  "filename": "$FILENAME",
  "type": "$TYPE",
  "url": "https://philling-dev.github.io/loja-integrada-assets/assets/$FILENAME",
  "deployedAt": "$TIMESTAMP",
  "size": $SIZE
}
EOF
)

# Se index.json não existe, criar array vazio
if [ ! -f "$INDEX_FILE" ]; then
    echo "{}" > "$INDEX_FILE"
fi

# Adicionar entrada ao index (usando jq se disponível, senão forma simples)
if command -v jq &> /dev/null; then
    jq ".[\"$CODE_ID\"] = $JSON_ENTRY" "$INDEX_FILE" > "$INDEX_FILE.tmp" && mv "$INDEX_FILE.tmp" "$INDEX_FILE"
else
    # Fallback simples sem jq
    echo "{\"$CODE_ID\": $JSON_ENTRY}" > "$INDEX_FILE"
fi

# Git operations
cd "$REPO_PATH"

git add "assets/$FILENAME"
git add "assets/index.json"
git commit -m "🚀 Deploy: $CODE_NAME ($FILENAME)"
git push origin main

# Log
LOG_FILE="$REPO_PATH/deploy.log"
echo "[$(date)] Deploy realizado: $FILENAME ($CODE_NAME)" >> "$LOG_FILE"

# Retornar sucesso
echo "Deploy realizado com sucesso: $FILENAME"