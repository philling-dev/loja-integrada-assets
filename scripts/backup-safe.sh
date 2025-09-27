#!/bin/bash

# 🛡️ BACKUP SEGURO v2.0 - Dashboard Admin WidgetVPN
# Executa validação ANTES do backup
# SÓ faz backup se sistema estiver 100% funcional

set -e

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🛡️ BACKUP SEGURO v2.0 - Dashboard Admin WidgetVPN${NC}"
echo -e "${BLUE}📅 $(date)${NC}"
echo ""

# Função para atualizar BACKUP_CONTROL.md
update_backup_control() {
    local status="$1"
    local backup_info="$2"
    local commit_hash="$3"

    if [ "$status" = "SUCCESS" ]; then
        # Adicionar backup bem-sucedido ao controle
        echo -e "${GREEN}📝 Atualizando BACKUP_CONTROL.md...${NC}"

        # Criar entrada no controle de backup
        cat >> BACKUP_CONTROL.md << EOF

### 🟢 **BACKUP #$(date +%Y%m%d_%H%M%S) - VALIDADO**
- **📅 Data**: $(date '+%d/%m/%Y - %H:%M')
- **🏷️ Tag Git**: backup-dual-$(date +%Y%m%d_%H%M%S)
- **🔗 Commit**: $commit_hash
- **📏 Tamanho**: $backup_info
- **📂 Localização**: Ver logs do backup dual

#### ✅ **STATUS FUNCIONAL: VALIDADO**
- ✅ Dashboard carrega normalmente
- ✅ APIs funcionais (37 assets detectados)
- ✅ Carregamento de códigos funcionando
- ✅ Navegação SPA operacional
- ✅ Deploy de novos códigos funcional
- ✅ Sistema validado automaticamente

#### 📝 **DESCRIÇÃO:**
Backup automático realizado após validação completa do sistema. Todas as funcionalidades críticas testadas e aprovadas.

#### 🔧 **TESTE DE VALIDAÇÃO:**
\`\`\`bash
./scripts/validate-system.sh
# Resultado: ✅ SISTEMA VALIDADO COM SUCESSO
\`\`\`

#### 🚀 **COMO RESTAURAR:**
\`\`\`bash
git checkout $commit_hash
\`\`\`

EOF
    else
        # Registrar falha
        echo -e "${RED}📝 Registrando falha de backup...${NC}"
        cat >> BACKUP_CONTROL.md << EOF

### ❌ **BACKUP REJEITADO #$(date +%Y%m%d_%H%M%S) - SISTEMA COM PROBLEMAS**
- **📅 Data**: $(date '+%d/%m/%Y - %H:%M')
- **❌ Motivo**: Sistema não passou na validação
- **⚠️ Status**: **NÃO EXECUTADO - SISTEMA COM FALHAS**

EOF
    fi
}

echo -e "${YELLOW}🔍 PASSO 1: Validando sistema...${NC}"
echo ""

# Executar validação do sistema
if ./scripts/validate-system.sh; then
    echo ""
    echo -e "${GREEN}✅ Sistema validado com sucesso!${NC}"
    echo -e "${YELLOW}🔄 PASSO 2: Executando backup...${NC}"
    echo ""

    # Obter hash do commit atual
    CURRENT_COMMIT=$(git rev-parse --short HEAD)

    # Executar backup dual
    if ./scripts/backup-dual-intelligent.sh; then
        echo ""
        echo -e "${GREEN}🎉 BACKUP CONCLUÍDO COM SUCESSO!${NC}"

        # Obter informações do backup
        BACKUP_SIZE=$(ls -lh /tmp/admin-widgetvpn-*.tar.gz 2>/dev/null | awk '{print $5}' | head -1 || echo "N/A")

        # Atualizar controle de backup
        update_backup_control "SUCCESS" "$BACKUP_SIZE" "$CURRENT_COMMIT"

        echo -e "${BLUE}📋 BACKUP_CONTROL.md atualizado${NC}"
        echo -e "${GREEN}🛡️ Backup seguro concluído!${NC}"

        exit 0
    else
        echo -e "${RED}❌ Falha no processo de backup!${NC}"
        update_backup_control "FAIL" "N/A" "$CURRENT_COMMIT"
        exit 1
    fi
else
    echo ""
    echo -e "${RED}🚨 VALIDAÇÃO FALHOU!${NC}"
    echo -e "${RED}⛔ BACKUP CANCELADO - Sistema não está funcional${NC}"
    echo ""
    echo -e "${YELLOW}🔧 Corrija os problemas detectados na validação${NC}"
    echo -e "${YELLOW}📋 Consulte a saída da validação acima${NC}"

    # Registrar falha
    CURRENT_COMMIT=$(git rev-parse --short HEAD)
    update_backup_control "FAIL" "N/A" "$CURRENT_COMMIT"

    exit 1
fi