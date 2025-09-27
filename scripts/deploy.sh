#!/bin/bash

# 🚀 DEPLOY SCRIPT - Dashboard Admin WidgetVPN
# Script para versionamento semântico e deploy com backup obrigatório

set -euo pipefail

# 🎨 CORES
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# 📋 CONFIGURAÇÕES
PROJECT_DIR="/var/www/admin.widgetvpn.xyz"
VERSION_TYPE="$1"
COMMIT_MESSAGE="${2:-Update version}"

# 📝 FUNÇÕES DE LOG
log() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}❌ ERRO: $1${NC}"
    exit 1
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# 🔍 VALIDAÇÕES INICIAIS
if [ "$#" -lt 1 ]; then
    error "Uso: $0 <patch|minor|major> [mensagem_commit]"
fi

if [[ ! "$VERSION_TYPE" =~ ^(patch|minor|major)$ ]]; then
    error "Tipo de versão deve ser: patch, minor ou major"
fi

# 📂 VERIFICAR DIRETÓRIO
cd "$PROJECT_DIR" || error "Falha ao acessar diretório do projeto"

# 🔍 VERIFICAR GIT STATUS
if [ -n "$(git status --porcelain)" ]; then
    warning "Existem alterações não commitadas. Verifique o git status."
    git status --short
    echo ""
    read -p "Continuar mesmo assim? (y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        error "Deploy cancelado pelo usuário"
    fi
fi

echo ""
echo -e "${PURPLE}🚀 DEPLOY SCRIPT - Dashboard Admin WidgetVPN${NC}"
echo -e "${CYAN}📦 Tipo de versão: $VERSION_TYPE${NC}"
echo -e "${CYAN}💬 Mensagem: $COMMIT_MESSAGE${NC}"
echo ""

# 🔄 EXECUTAR BACKUP OBRIGATÓRIO
log "PASSO 1/6: Executando backup duplo obrigatório"
if npm run backup:dual; then
    success "Backup duplo concluído com sucesso"
else
    error "Falha no backup duplo - deploy abortado"
fi

# 📈 ATUALIZAR VERSÃO
log "PASSO 2/6: Atualizando versão ($VERSION_TYPE)"
npm version "$VERSION_TYPE" --no-git-tag-version
NEW_VERSION=$(node -p "require('./package.json').version")
success "Nova versão: v$NEW_VERSION"

# 📝 COMMIT DAS ALTERAÇÕES
log "PASSO 3/6: Commitando alterações"
git add package.json
git commit -m "🔖 $COMMIT_MESSAGE - v$NEW_VERSION

📦 Versão: v$NEW_VERSION
🔄 Tipo: $VERSION_TYPE
📅 Data: $(date -Iseconds)
🛡️ Backup: ✅ Executado antes do deploy

🤖 Generated with Deploy Script v3.0
"

# 🏷️ CRIAR TAG
log "PASSO 4/6: Criando tag de versão"
git tag -a "v$NEW_VERSION" -m "🚀 Release v$NEW_VERSION - $COMMIT_MESSAGE"
success "Tag criada: v$NEW_VERSION"

# 📤 PUSH PARA REPOSITÓRIO
log "PASSO 5/6: Enviando para repositório remoto"
git push origin $(git branch --show-current)
git push origin "v$NEW_VERSION"
success "Push concluído para branch $(git branch --show-current)"

# 🔄 RESTART SERVIÇOS (se aplicável)
log "PASSO 6/6: Verificando serviços para restart"
if command -v pm2 &> /dev/null; then
    # Verificar se existe alguma aplicação PM2 para este projeto
    if pm2 list | grep -q "admin"; then
        warning "Encontrada aplicação PM2 'admin' - restart necessário?"
        read -p "Fazer restart da aplicação PM2? (y/N): " -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            pm2 restart admin
            success "PM2 restart executado"
        fi
    else
        log "Nenhuma aplicação PM2 encontrada para restart"
    fi
else
    log "PM2 não instalado - restart ignorado"
fi

# 📊 RELATÓRIO FINAL
echo ""
echo -e "${PURPLE}📊 RELATÓRIO DE DEPLOY${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "🏷️  Nova versão: ${GREEN}v$NEW_VERSION${NC}"
echo -e "📦 Tipo de versão: ${GREEN}$VERSION_TYPE${NC}"
echo -e "💬 Mensagem: ${GREEN}$COMMIT_MESSAGE${NC}"
echo -e "📅 Data/Hora: ${GREEN}$(date)${NC}"
echo -e "🌿 Branch: ${GREEN}$(git branch --show-current)${NC}"
echo -e "🔗 Commit: ${GREEN}$(git rev-parse --short HEAD)${NC}"
echo -e "🛡️  Backup: ${GREEN}✅ Executado com sucesso${NC}"
echo -e "📤 Push: ${GREEN}✅ Enviado para repositório${NC}"
echo ""
success "🎉 DEPLOY v$NEW_VERSION CONCLUÍDO COM SUCESSO!"
echo -e "${CYAN}🛡️  Backup duplo garantido antes do deploy${NC}"

log "Deploy finalizado para v$NEW_VERSION"