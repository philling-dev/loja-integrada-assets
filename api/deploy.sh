#!/bin/bash

# API de Deploy para GitHub Pages - Versão Shell Script
# Recebe JSON via stdin e faz deploy automaticamente

# Headers HTTP
echo "Content-Type: application/json"
echo "Access-Control-Allow-Origin: *"
echo "Access-Control-Allow-Methods: POST"
echo "Access-Control-Allow-Headers: Content-Type"
echo ""

# Se for OPTIONS, retorna OK
if [ "$REQUEST_METHOD" = "OPTIONS" ]; then
    echo '{"status":"ok"}'
    exit 0
fi

# Só aceita POST
if [ "$REQUEST_METHOD" != "POST" ]; then
    echo '{"error":"Method not allowed"}'
    exit 1
fi

# Ler JSON do stdin
JSON_INPUT=$(cat)

# Validar se recebeu JSON
if [ -z "$JSON_INPUT" ]; then
    echo '{"error":"No JSON data received"}'
    exit 1
fi

# Log do input recebido
LOG_FILE="/var/www/admin.widgetvpn.xyz/deploy.log"
echo "[$(date)] API Deploy chamada: $JSON_INPUT" >> "$LOG_FILE"

# Extrair dados do JSON (versão simples)
FILENAME=$(echo "$JSON_INPUT" | grep -o '"filename":"[^"]*"' | cut -d'"' -f4)
CONTENT=$(echo "$JSON_INPUT" | grep -o '"content":"[^"]*"' | cut -d'"' -f4)
CODE_NAME=$(echo "$JSON_INPUT" | grep -o '"codeName":"[^"]*"' | cut -d'"' -f4)
CODE_ID=$(echo "$JSON_INPUT" | grep -o '"codeId":"[^"]*"' | cut -d'"' -f4)

# Validar dados obrigatórios
if [ -z "$FILENAME" ] || [ -z "$CONTENT" ] || [ -z "$CODE_NAME" ]; then
    echo '{"error":"Missing required fields"}'
    exit 1
fi

# Definir caminhos
REPO_PATH="/var/www/admin.widgetvpn.xyz"
ASSETS_DIR="$REPO_PATH/assets"
FILE_PATH="$ASSETS_DIR/$FILENAME"

# Criar diretório assets se não existir
mkdir -p "$ASSETS_DIR"

# Escrever conteúdo no arquivo
echo "$CONTENT" > "$FILE_PATH"

# Verificar se arquivo foi criado
if [ ! -f "$FILE_PATH" ]; then
    echo '{"error":"Failed to create file"}'
    exit 1
fi

# Calcular tamanho do arquivo
FILE_SIZE=$(wc -c < "$FILE_PATH")

# Atualizar index.json
INDEX_FILE="$ASSETS_DIR/index.json"
TIMESTAMP=$(date -Iseconds)

# URL do arquivo
FILE_URL="https://philling-dev.github.io/loja-integrada-assets/assets/$FILENAME"

# Git operations
cd "$REPO_PATH"

# Adicionar arquivos
git add "assets/$FILENAME"

# Commit
COMMIT_MESSAGE="🚀 Deploy Automático: $CODE_NAME ($FILENAME)

- Código: $CODE_NAME
- Arquivo: $FILENAME
- Tamanho: $FILE_SIZE bytes
- Deploy automático via dashboard

🤖 Generated with Claude Code"

git commit -m "$COMMIT_MESSAGE"

# Push para GitHub
PUSH_OUTPUT=$(git push origin main 2>&1)
PUSH_EXIT_CODE=$?

# Log do resultado
echo "[$(date)] Deploy resultado - Exit: $PUSH_EXIT_CODE, Output: $PUSH_OUTPUT" >> "$LOG_FILE"

# Retornar resultado
if [ $PUSH_EXIT_CODE -eq 0 ]; then
    # Sucesso
    cat << EOF
{
    "success": true,
    "filename": "$FILENAME",
    "url": "$FILE_URL",
    "size": $FILE_SIZE,
    "deployedAt": "$TIMESTAMP",
    "gitOutput": "Push realizado com sucesso"
}
EOF
else
    # Erro
    cat << EOF
{
    "error": "Git push failed",
    "details": "$PUSH_OUTPUT"
}
EOF
fi