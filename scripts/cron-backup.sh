#!/bin/bash

# 🕒 CRON BACKUP - Dashboard Admin WidgetVPN
# Script wrapper para execução automática via cron

# 📁 Mudar para diretório do projeto
cd /var/www/admin.widgetvpn.xyz

# 📝 LOG COM DATA
DATE=$(date '+%Y-%m-%d %H:%M:%S')
LOG_FILE="/var/log/projeto-backup-dual.log"

echo "===========================================" >> "$LOG_FILE"
echo "[$DATE] Iniciando backup automático Admin WidgetVPN" >> "$LOG_FILE"
echo "===========================================" >> "$LOG_FILE"

# 🚀 EXECUTAR BACKUP DUPLO INTELIGENTE
if npm run backup:dual >> "$LOG_FILE" 2>&1; then
    echo "[$DATE] ✅ Backup duplo inteligente concluído com sucesso" >> "$LOG_FILE"

    # 🧹 EXECUTAR LIMPEZA INTELIGENTE (uma vez por semana - domingo)
    if [ "$(date +%u)" -eq 7 ]; then
        echo "[$DATE] 🧹 Executando limpeza inteligente semanal" >> "$LOG_FILE"
        /var/www/admin.widgetvpn.xyz/scripts/remote-cleanup-intelligent.sh >> "$LOG_FILE" 2>&1 || true
    fi
else
    echo "[$DATE] ❌ Falha no backup duplo inteligente" >> "$LOG_FILE"

    # 📧 OPCIONAL: Enviar notificação de erro (se configurado)
    # echo "Falha no backup automático em $(date)" | mail -s "Erro Backup Admin WidgetVPN" admin@widgetvpn.xyz
fi

echo "[$DATE] Backup automático finalizado" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"

# 🧹 LIMPAR LOG ANTIGO (manter apenas 30 dias)
find /var/log/projeto-backup-dual.log -mtime +30 -exec rm {} \; 2>/dev/null || true