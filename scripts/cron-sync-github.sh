#!/bin/bash

#==============================================================================
# SCRIPT DE SINCRONIZAÇÃO AUTOMÁTICA GITHUB - CRON JOB
# Sincroniza códigos CSS/JS do GitHub com banco local
# Executado diariamente às 4:00 AM
#==============================================================================

# Configurações
PROJECT_PATH="/var/www/admin.widgetvpn.xyz"
LOG_FILE="/var/log/github-sync-cron.log"
LOCK_FILE="/tmp/github-sync.lock"
MAX_EXECUTION_TIME=300  # 5 minutos

# Função de log
log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Função de cleanup
cleanup() {
    rm -f "$LOCK_FILE"
    log_message "🧹 Limpeza concluída"
}

# Trap para cleanup em caso de interrupção
trap cleanup EXIT

# Verificar se outro processo está rodando
if [ -f "$LOCK_FILE" ]; then
    PID=$(cat "$LOCK_FILE")
    if ps -p "$PID" > /dev/null 2>&1; then
        log_message "⚠️  Sincronização já está rodando (PID: $PID)"
        exit 1
    else
        log_message "🔄 Removendo lock file antigo"
        rm -f "$LOCK_FILE"
    fi
fi

# Criar lock file
echo $$ > "$LOCK_FILE"

log_message "🚀 INICIANDO SINCRONIZAÇÃO AUTOMÁTICA GITHUB"
log_message "📁 Projeto: $PROJECT_PATH"

# Timeout para o script completo
timeout $MAX_EXECUTION_TIME bash -c '

# Mudar para diretório do projeto
cd "'$PROJECT_PATH'" || {
    echo "[$(date '"'"'+%Y-%m-%d %H:%M:%S'"'"')] ❌ Erro: Não foi possível acessar o diretório do projeto" >> "'$LOG_FILE'"
    exit 1
}

# Verificar se GitHub CLI está autenticado
if ! gh auth status >/dev/null 2>&1; then
    echo "[$(date '"'"'+%Y-%m-%d %H:%M:%S'"'"')] ❌ Erro: GitHub CLI não autenticado" >> "'$LOG_FILE'"
    exit 1
fi

# Verificar conectividade com GitHub
if ! gh api repos/philling-dev/loja-integrada-assets >/dev/null 2>&1; then
    echo "[$(date '"'"'+%Y-%m-%d %H:%M:%S'"'"')] ❌ Erro: Falha na conectividade com GitHub" >> "'$LOG_FILE'"
    exit 1
fi

# Executar sincronização
echo "[$(date '"'"'+%Y-%m-%d %H:%M:%S'"'"')] 🔄 Executando sincronização..." >> "'$LOG_FILE'"

php scripts/sync-github-codes.php 2>&1 | while IFS= read -r line; do
    echo "[$(date '"'"'+%Y-%m-%d %H:%M:%S'"'"')] $line" >> "'$LOG_FILE'"
done

# Verificar se a sincronização foi bem-sucedida
if [ $? -eq 0 ]; then
    echo "[$(date '"'"'+%Y-%m-%d %H:%M:%S'"'"')] ✅ Sincronização concluída com sucesso" >> "'$LOG_FILE'"

    # Verificar se houve mudanças no índice
    if git diff --quiet assets/index.json; then
        echo "[$(date '"'"'+%Y-%m-%d %H:%M:%S'"'"')] ℹ️  Nenhuma mudança detectada no índice" >> "'$LOG_FILE'"
    else
        echo "[$(date '"'"'+%Y-%m-%d %H:%M:%S'"'"')] 📝 Mudanças detectadas - fazendo commit automático" >> "'$LOG_FILE'"
        git add assets/index.json
        git commit -m "Auto-sync: GitHub synchronization $(date '"'"'+%Y-%m-%d %H:%M'"'"')" || true
    fi
else
    echo "[$(date '"'"'+%Y-%m-%d %H:%M:%S'"'"')] ❌ Falha na sincronização" >> "'$LOG_FILE'"
    exit 1
fi

'

SYNC_RESULT=$?

if [ $SYNC_RESULT -eq 0 ]; then
    log_message "✅ Sincronização automática concluída com sucesso"

    # Executar limpeza de logs (manter últimos 30 dias)
    find /var/log -name "*github-sync*" -type f -mtime +30 -delete 2>/dev/null || true

else
    log_message "❌ Falha na sincronização automática (código: $SYNC_RESULT)"

    # Enviar notificação de erro se necessário
    # (pode ser implementado sistema de email/webhook aqui)
fi

log_message "🏁 Processo de sincronização finalizado"

# Estatísticas finais
if [ -f "$PROJECT_PATH/assets/index.json" ]; then
    TOTAL_FILES=$(php -r "
        \$index = json_decode(file_get_contents('$PROJECT_PATH/assets/index.json'), true);
        echo count(\$index);
    " 2>/dev/null || echo "0")
    log_message "📊 Total de arquivos no índice: $TOTAL_FILES"
fi

exit $SYNC_RESULT