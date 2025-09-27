#!/bin/bash

# 🔄 BACKUP DUPLO INTELIGENTE v3.0 - Dashboard Admin WidgetVPN
# Sistema redundante: Servidor Remoto + Google Drive
# Backup inteligente com rotação automática em ambos os destinos
# Autor: Sistema Inteligente de Backup Duplo

set -euo pipefail

# 📋 CONFIGURAÇÕES AVANÇADAS
PROJECT_DIR="/var/www/admin.widgetvpn.xyz"
TEMP_BACKUP_DIR="/tmp/admin-widgetvpn-backup-temp"

# Configurações Servidor Remoto
REMOTE_SERVER="pivpnaraponto.ddns.net"
REMOTE_PORT="2222"
REMOTE_USER="guilherme"
REMOTE_BASE_DIR="/home/guilherme/backups/admin-widgetvpn"
SSH_KEY="/root/.ssh/backup_key"

# Configurações Google Drive
GDRIVE_REMOTE="drive"
GDRIVE_BASE_DIR="AdminWidgetVPN-Backups"
MAX_GDRIVE_BACKUPS=3

# Data e versão para organização
DATE=$(date +%Y%m%d_%H%M%S)
YEAR=$(date +%Y)
MONTH=$(date +%m)
DAY=$(date +%d)
VERSION=$(cd $PROJECT_DIR && node -p "require('./package.json').version" 2>/dev/null || echo "1.0.0")
BACKUP_NAME="admin-widgetvpn-v${VERSION}-${DATE}.tar.gz"

# Estrutura hierárquica
REMOTE_YEAR_DIR="$REMOTE_BASE_DIR/$YEAR"
REMOTE_MONTH_DIR="$REMOTE_YEAR_DIR/$MONTH"
REMOTE_FULL_PATH="$REMOTE_MONTH_DIR/$BACKUP_NAME"

GDRIVE_YEAR_DIR="$GDRIVE_BASE_DIR/$YEAR"
GDRIVE_MONTH_DIR="$GDRIVE_YEAR_DIR/$MONTH"
GDRIVE_FULL_PATH="$GDRIVE_MONTH_DIR/$BACKUP_NAME"

# 🎨 CORES
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# 📝 FUNÇÕES DE LOG
log() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1"
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" >> /var/log/projeto-backup-dual.log
}

error() {
    echo -e "${RED}❌ ERRO: $1${NC}"
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1" >> /var/log/projeto-backup-dual.log
    exit 1
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] SUCCESS: $1" >> /var/log/projeto-backup-dual.log
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1" >> /var/log/projeto-backup-dual.log
}

# 🔍 VERIFICAÇÕES INICIAIS
check_dependencies() {
    # Verificar rclone
    if ! command -v rclone &> /dev/null; then
        error "rclone não está instalado. Execute: curl https://rclone.org/install.sh | sudo bash"
    fi

    # Verificar configuração Google Drive
    if ! rclone listremotes | grep -q "drive:"; then
        error "Google Drive não configurado. Execute: scripts/setup-google-drive.sh"
    fi

    # Testar conexão Google Drive
    if ! rclone lsd "$GDRIVE_REMOTE:" &>/dev/null; then
        error "Falha na conexão com Google Drive. Verifique a autenticação."
    fi

    log "Dependências verificadas: rclone e Google Drive OK"
}

# 🗂️ CRIAR ESTRUTURAS
create_structures() {
    # Estrutura Google Drive
    log "Criando estrutura no Google Drive"
    rclone mkdir "$GDRIVE_REMOTE:$GDRIVE_BASE_DIR" 2>/dev/null || true
    rclone mkdir "$GDRIVE_REMOTE:$GDRIVE_YEAR_DIR" 2>/dev/null || true
    rclone mkdir "$GDRIVE_REMOTE:$GDRIVE_MONTH_DIR" 2>/dev/null || true

    success "Estrutura Google Drive: $GDRIVE_MONTH_DIR/"
}

# 🧹 LIMPEZA INTELIGENTE GOOGLE DRIVE
cleanup_google_drive() {
    log "Executando limpeza inteligente no Google Drive"

    # Listar backups existentes no mês atual, ordenados por data (mais antigos primeiro)
    EXISTING_BACKUPS=$(rclone lsf "$GDRIVE_REMOTE:$GDRIVE_MONTH_DIR/" --include "admin-widgetvpn-v*.tar.gz" | sort)
    BACKUP_COUNT=$(echo "$EXISTING_BACKUPS" | grep -c "admin-widgetvpn-v" || echo "0")
    BACKUP_COUNT=${BACKUP_COUNT:-0}

    log "Backups existentes no Google Drive: $BACKUP_COUNT"

    if [ "$BACKUP_COUNT" -ge "$MAX_GDRIVE_BACKUPS" ]; then
        # Calcular quantos precisam ser removidos
        TO_REMOVE=$((BACKUP_COUNT - MAX_GDRIVE_BACKUPS + 1))

        log "Removendo $TO_REMOVE backup(s) antigo(s) do Google Drive"

        # Remover os mais antigos
        echo "$EXISTING_BACKUPS" | head -n "$TO_REMOVE" | while read -r backup_file; do
            if [ -n "$backup_file" ]; then
                rclone delete "$GDRIVE_REMOTE:$GDRIVE_MONTH_DIR/$backup_file"
                log "Removido: $backup_file"
            fi
        done

        success "Limpeza Google Drive concluída"
    else
        log "Limpeza não necessária - apenas $BACKUP_COUNT/$MAX_GDRIVE_BACKUPS backups"
    fi
}

# 🌐 ENVIAR PARA GOOGLE DRIVE
upload_to_gdrive() {
    log "Enviando backup para Google Drive"

    # Upload com progresso
    if rclone copy "$TEMP_BACKUP_DIR/$BACKUP_NAME" "$GDRIVE_REMOTE:$GDRIVE_MONTH_DIR/" --progress; then
        success "Backup enviado para Google Drive: $GDRIVE_FULL_PATH"

        # Verificar integridade
        log "Verificando integridade no Google Drive"
        GDRIVE_SIZE=$(rclone size "$GDRIVE_REMOTE:$GDRIVE_FULL_PATH" --json | jq -r '.bytes')
        LOCAL_SIZE=$(stat --format="%s" "$TEMP_BACKUP_DIR/$BACKUP_NAME")

        if [ "$GDRIVE_SIZE" = "$LOCAL_SIZE" ]; then
            success "Integridade verificada no Google Drive"
        else
            warning "Divergência de tamanho - Local: $LOCAL_SIZE, GDrive: $GDRIVE_SIZE"
        fi
    else
        error "Falha no envio para Google Drive"
    fi
}

# 📊 RELATÓRIO GOOGLE DRIVE
generate_gdrive_report() {
    log "Gerando relatório do Google Drive"

    # Informações de espaço
    GDRIVE_ABOUT=$(rclone about "$GDRIVE_REMOTE:" --json 2>/dev/null || echo '{"quota": 0, "used": 0}')

    # Listar backups atuais
    CURRENT_BACKUPS=$(rclone ls "$GDRIVE_REMOTE:$GDRIVE_MONTH_DIR/" --include "admin-widgetvpn-v*.tar.gz" 2>/dev/null || echo "")

    cat > "$TEMP_BACKUP_DIR/gdrive-report-$DATE.txt" << EOF
RELATÓRIO GOOGLE DRIVE - $DATE
======================================

Configuração:
- Remote: $GDRIVE_REMOTE
- Diretório: $GDRIVE_FULL_PATH
- Max backups: $MAX_GDRIVE_BACKUPS

Espaço:
$(echo "$GDRIVE_ABOUT" | jq -r 'if .quota then "Quota: \(.quota | tonumber / 1024 / 1024 / 1024 | floor)GB" else "Quota: Ilimitada" end')
$(echo "$GDRIVE_ABOUT" | jq -r 'if .used then "Usado: \(.used | tonumber / 1024 / 1024 / 1024 | floor)GB" else "Usado: N/A" end')

Backups no mês $MONTH/$YEAR:
$CURRENT_BACKUPS

Status: ✅ Backup enviado com sucesso
EOF
}

# 🚀 INÍCIO DO BACKUP DUPLO
echo ""
echo -e "${PURPLE}🔄 BACKUP DUPLO INTELIGENTE v3.0 - Dashboard Admin WidgetVPN${NC}"
echo -e "${CYAN}📡 Destinos: Servidor Remoto + Google Drive${NC}"
echo -e "${BLUE}📅 Data/Hora: $(date)${NC}"
echo -e "${BLUE}📁 Projeto: $PROJECT_DIR${NC}"
echo -e "${BLUE}🏷️  Versão: v$VERSION${NC}"
echo -e "${BLUE}🗂️  Estrutura: $YEAR/$MONTH/arquivo${NC}"
echo -e "${BLUE}☁️  Google Drive: $MAX_GDRIVE_BACKUPS backups máximo${NC}"
echo ""

log "Iniciando backup duplo inteligente v$VERSION"

# Verificar dependências
check_dependencies

# 🧹 LIMPAR DIRETÓRIO TEMPORÁRIO
log "Preparando ambiente temporário"
rm -rf "$TEMP_BACKUP_DIR"
mkdir -p "$TEMP_BACKUP_DIR"

cd "$PROJECT_DIR"

# 🔍 STATUS ANTES DO BACKUP
log "Coletando status do sistema"
git status --porcelain > "$TEMP_BACKUP_DIR/git-status-$DATE.txt" 2>/dev/null || echo "Não é um repositório git" > "$TEMP_BACKUP_DIR/git-status-$DATE.txt"
pm2 jlist > "$TEMP_BACKUP_DIR/pm2-status-$DATE.json" 2>/dev/null || echo "[]" > "$TEMP_BACKUP_DIR/pm2-status-$DATE.json"
du -sh "$PROJECT_DIR" > "$TEMP_BACKUP_DIR/disk-usage-$DATE.txt"
rclone about "$GDRIVE_REMOTE:" --json > "$TEMP_BACKUP_DIR/gdrive-status-$DATE.json" 2>/dev/null || echo "{}" > "$TEMP_BACKUP_DIR/gdrive-status-$DATE.json"

# 📊 INFORMAÇÕES DO SISTEMA
cat > "$TEMP_BACKUP_DIR/backup-info-$DATE.json" << EOF
{
  "version": "$VERSION",
  "date": "$DATE",
  "timestamp": "$(date -Iseconds)",
  "project_dir": "$PROJECT_DIR",
  "project_name": "admin-widgetvpn",
  "git_commit": "$(git rev-parse HEAD 2>/dev/null || echo 'unknown')",
  "git_branch": "$(git branch --show-current 2>/dev/null || echo 'unknown')",
  "backup_type": "dual_intelligent",
  "destinations": ["remote_server", "google_drive"],
  "gdrive_max_backups": $MAX_GDRIVE_BACKUPS,
  "system_info": {
    "hostname": "$(hostname)",
    "uptime": "$(uptime -p)",
    "disk_usage": "$(df -h $PROJECT_DIR | tail -1 | awk '{print $5}')"
  }
}
EOF

# 📦 CRIAR BACKUP COMPLETO
log "Criando backup completo"
tar --exclude='node_modules' \
    --exclude='*.log' \
    --exclude='*.tmp' \
    --exclude='.git/objects' \
    --exclude='admin/test-*.html' \
    --exclude='admin/*-backup.html' \
    -czf "$TEMP_BACKUP_DIR/$BACKUP_NAME" \
    -C "$(dirname $PROJECT_DIR)" \
    "$(basename $PROJECT_DIR)" \
    -C "$TEMP_BACKUP_DIR" \
    "git-status-$DATE.txt" \
    "pm2-status-$DATE.json" \
    "disk-usage-$DATE.txt" \
    "gdrive-status-$DATE.json" \
    "backup-info-$DATE.json"

# 📏 VERIFICAR TAMANHO
BACKUP_SIZE=$(du -sh "$TEMP_BACKUP_DIR/$BACKUP_NAME" | cut -f1)
log "Backup criado: $BACKUP_SIZE"

# 🔐 VALIDAÇÃO DE INTEGRIDADE
log "Validando integridade do backup"
if tar -tzf "$TEMP_BACKUP_DIR/$BACKUP_NAME" >/dev/null 2>&1; then
    success "Backup íntegro e válido"
else
    error "Backup corrompido - abortando"
fi

# Criar estruturas nos destinos
create_structures

# 📡 BACKUP PARA SERVIDOR REMOTO (processo original)
log "=== INICIANDO BACKUP PARA SERVIDOR REMOTO ==="

# Verificar conexão remota
log "Testando conexão com servidor remoto"
if ! ssh -i "$SSH_KEY" -o ConnectTimeout=10 -o StrictHostKeyChecking=no -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_SERVER" "exit" &>/dev/null; then
    error "Falha na conexão SSH"
fi
success "Conexão SSH estabelecida"

# Criar estrutura hierárquica no servidor remoto
log "Criando estrutura hierárquica no servidor remoto"
ssh -i "$SSH_KEY" -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_SERVER" "
mkdir -p '$REMOTE_MONTH_DIR'
chmod 755 '$REMOTE_BASE_DIR' '$REMOTE_YEAR_DIR' '$REMOTE_MONTH_DIR'
echo 'Estrutura criada: $REMOTE_MONTH_DIR'
"

# Verificar espaço em disco remoto
log "Verificando espaço disponível no servidor remoto"
REMOTE_SPACE=$(ssh -i "$SSH_KEY" -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_SERVER" "df -h '$REMOTE_BASE_DIR' | tail -1 | awk '{print \$4}'")
REMOTE_USED=$(ssh -i "$SSH_KEY" -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_SERVER" "du -sh '$REMOTE_BASE_DIR' | cut -f1")
log "Espaço remoto disponível: $REMOTE_SPACE (usado: $REMOTE_USED)"

# Alerta de espaço crítico
REMOTE_USAGE_PERCENT=$(ssh -i "$SSH_KEY" -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_SERVER" "df '$REMOTE_BASE_DIR' | tail -1 | awk '{print \$5}' | sed 's/%//'")
if [ "$REMOTE_USAGE_PERCENT" -gt 85 ]; then
    warning "Espaço em disco crítico: ${REMOTE_USAGE_PERCENT}%"
fi

# Enviar backup para servidor remoto
log "Enviando backup para servidor remoto"
if scp -i "$SSH_KEY" -P "$REMOTE_PORT" "$TEMP_BACKUP_DIR/$BACKUP_NAME" "$REMOTE_USER@$REMOTE_SERVER:$REMOTE_FULL_PATH"; then
    success "Backup enviado: $REMOTE_FULL_PATH"
else
    error "Falha no envio do backup"
fi

# Validar backup remoto
log "Validando backup no servidor remoto"
REMOTE_SIZE=$(ssh -i "$SSH_KEY" -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_SERVER" "ls -lh '$REMOTE_FULL_PATH' | awk '{print \$5}'")
REMOTE_MD5=$(ssh -i "$SSH_KEY" -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_SERVER" "md5sum '$REMOTE_FULL_PATH' | cut -d' ' -f1")
LOCAL_MD5=$(md5sum "$TEMP_BACKUP_DIR/$BACKUP_NAME" | cut -d' ' -f1)

if [ "$REMOTE_MD5" = "$LOCAL_MD5" ]; then
    success "Integridade verificada: MD5 válido ($REMOTE_MD5)"
else
    error "Falha na integridade: MD5 local=$LOCAL_MD5, remoto=$REMOTE_MD5"
fi

# Limpeza inteligente no servidor remoto
log "Executando limpeza inteligente no servidor remoto"
ssh -i "$SSH_KEY" -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_SERVER" "
# Manter apenas últimos 30 dias de backups
find '$REMOTE_BASE_DIR' -name 'admin-widgetvpn-v*.tar.gz' -mtime +30 -delete 2>/dev/null || true

# Manter apenas últimas 3 versões por mês
cd '$REMOTE_MONTH_DIR'
if [ \$(ls -1 admin-widgetvpn-v*.tar.gz 2>/dev/null | wc -l) -gt 3 ]; then
    ls -t admin-widgetvpn-v*.tar.gz | tail -n +4 | xargs -r rm -f
    echo 'Limpeza por quantidade executada'
fi

# Remover meses vazios
find '$REMOTE_BASE_DIR' -type d -empty -delete 2>/dev/null || true
"

success "=== BACKUP SERVIDOR REMOTO CONCLUÍDO ==="

# ☁️ BACKUP PARA GOOGLE DRIVE
log "=== INICIANDO BACKUP PARA GOOGLE DRIVE ==="

# Limpeza prévia no Google Drive
cleanup_google_drive

# Upload para Google Drive
upload_to_gdrive

# Gerar relatório Google Drive
generate_gdrive_report

success "=== BACKUP GOOGLE DRIVE CONCLUÍDO ==="

# 🏷️ CRIAR TAG GIT
log "Criando tag Git"
cd "$PROJECT_DIR"
TAG_NAME="backup-dual-$DATE"
if git status >/dev/null 2>&1; then
    if ! git tag | grep -q "$TAG_NAME"; then
        git tag -a "$TAG_NAME" -m "🔄 Backup duplo inteligente v$VERSION - $DATE"
        success "Tag criada: $TAG_NAME"
    fi
else
    log "Não é um repositório git - tag ignorada"
fi

# 🧹 LIMPEZA LOCAL (remover backup temporário)
log "Removendo backup temporário local"
rm -rf "$TEMP_BACKUP_DIR"
success "Limpeza local concluída"

# 📋 RELATÓRIO FINAL DUPLO
echo ""
echo -e "${PURPLE}📊 RELATÓRIO DE BACKUP DUPLO INTELIGENTE${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "🏷️  Versão: ${GREEN}v$VERSION${NC}"
echo -e "📦 Arquivo: ${GREEN}$BACKUP_NAME${NC}"
echo -e "📏 Tamanho: ${GREEN}$BACKUP_SIZE${NC}"
echo -e "📅 Data: ${GREEN}$(date)${NC}"
echo -e "🗂️  Estrutura: ${GREEN}$YEAR/$MONTH/arquivo${NC}"
echo ""
echo -e "${CYAN}📡 DESTINO 1 - SERVIDOR REMOTO:${NC}"
echo -e "🌐 Localização: ${GREEN}$REMOTE_FULL_PATH${NC}"
echo -e "🔐 Integridade: ${GREEN}✅ MD5 Válido${NC}"
echo -e "💾 Espaço remoto: ${GREEN}$REMOTE_SPACE disponível${NC}"
echo -e "🧹 Limpeza: ${GREEN}Automática (30 dias + 3 por mês)${NC}"
echo ""
echo -e "${CYAN}☁️  DESTINO 2 - GOOGLE DRIVE:${NC}"
echo -e "🌐 Localização: ${GREEN}$GDRIVE_FULL_PATH${NC}"
echo -e "📊 Rotação: ${GREEN}Máximo $MAX_GDRIVE_BACKUPS backups${NC}"
echo -e "🔐 Integridade: ${GREEN}✅ Tamanho Verificado${NC}"
echo -e "🧹 Limpeza: ${GREEN}Automática (manter $MAX_GDRIVE_BACKUPS mais recentes)${NC}"
echo ""
echo -e "🏷️  Tag Git: ${GREEN}$TAG_NAME${NC}"
echo -e "📝 Logs: ${GREEN}/var/log/projeto-backup-dual.log${NC}"
echo ""
success "🎉 BACKUP DUPLO INTELIGENTE CONCLUÍDO COM SUCESSO!"
echo -e "${CYAN}🛡️  Redundância total: Servidor Remoto + Google Drive${NC}"

log "Backup duplo inteligente finalizado com sucesso"