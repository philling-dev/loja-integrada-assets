# Dashboard Administrativo Multi-Projetos - WidgetVPN

## 🚨 **REGRAS OBRIGATÓRIAS - BACKUP DUPLO v3.0**

### **🔴 ANTES DE QUALQUER ALTERAÇÃO:**
- [ ] 1️⃣ **npm run backup:dual** - OBRIGATÓRIO backup duplo
- [ ] 2️⃣ **git checkout develop** - Partir de develop
- [ ] 3️⃣ **git checkout -b feature/nome** - Criar feature branch

### **🔴 APÓS ALTERAÇÕES:**
- [ ] 4️⃣ **git add . && git commit** - Commit profissional
- [ ] 5️⃣ **git checkout develop && git merge feature/nome --no-ff**
- [ ] 6️⃣ **npm run version:patch/minor/major "msg"** - Versionamento
- [ ] 7️⃣ **git push origin develop** - PUSH OBRIGATÓRIO
- [ ] 8️⃣ **pm2 restart app** - Restart produção

### **🛡️ BACKUP DUPLO:**
- **Destinos**: Servidor remoto + Google Drive (15GB)
- **Comando**: `npm run backup:dual`
- **Logs**: `/var/log/projeto-backup-dual.log`
- **Automação**: Cron diário 3:05 AM (`5 3 * * * /var/www/admin.widgetvpn.xyz/scripts/cron-backup.sh`)
- **Rotação**: 30 dias (servidor) + 3 backups (Google Drive)
- **Validação**: MD5 dupla + integridade verificada
- **Status**: ✅ **IMPLEMENTADO E TESTADO** (26/09/2025)

**⚠️ NUNCA ALTERAR CÓDIGO SEM BACKUP PRÉVIO**

---

## 🌐 **ACESSO E STATUS**

### **URLs Principais:**
- **Dashboard**: https://admin.widgetvpn.xyz
- **Credenciais**: admin@widgetvpn.xyz / Admin123456
- **SSL**: ✅ Válido até 23/12/2025

### **Status Atual:**
- ✅ **PROJETO CONCLUÍDO** com backup duplo e versionamento (26/09/2025)
- ✅ Dashboard profissional multi-projetos funcional
- ✅ API Deploy 100% operacional
- ✅ Navegação SPA completa
- ✅ **Sistema de backup duplo v3.0** implementado e testado
- ✅ **Git workflow profissional** com regras obrigatórias
- ✅ **Versionamento semântico** automatizado (v1.0.1)

---

## 🏗️ **ARQUITETURA IMPLEMENTADA**

### **Stack Final:**
- **Frontend**: HTML5 + CSS3 Variables + JavaScript ES6+ (Vanilla)
- **Backend**: PHP 8.3 + API REST
- **Design**: Minimalista inspirado Starlink/Tesla
- **Performance**: <1s carregamento, zero dependências

### **Estrutura:**
```
admin/
├── index.html              # ✅ Dashboard principal (53KB otimizado)
├── api/deploy-code.php     # ✅ API 100% funcional
├── assets/                 # ✅ 25+ arquivos deployados
└── scripts/                # ✅ Scripts de backup e deploy
    ├── backup-dual-intelligent.sh  # Backup duplo
    ├── cron-backup.sh             # Automação cron
    └── deploy.sh                  # Versionamento
```

### **Sidebar Organizada:**
```
📊 Dashboard
💻 Script Deploy           # ✅ ATIVO - CRUD códigos CSS/JS
    ├── 📄 Códigos
    ├── 🚀 Deploy & Status
    └── ⚙️ Configurações
📱 App Manager             # 🔄 Q1 2025
🔗 URL Shortener           # 🔄 Q1 2025
📊 Analytics Hub           # 🔄 Q2 2025
```

---

## 🚀 **API DE DEPLOY**

### **Endpoint Funcional:**
- **URL**: `/api/deploy-code.php`
- **Método**: POST JSON
- **Campos**: `filename`, `content`, `type`, `codeId`, `codeName`
- **Response**: `{"success": true, "url": "...", "deployedAt": "..."}`

### **Funcionalidades:**
- ✅ Minificação CSS/JS automática
- ✅ Git commit + push GitHub Pages
- ✅ Validação e logs detalhados
- ✅ Assets servidos via https://philling-dev.github.io/loja-integrada-assets/

---

## 🎯 **PROJETOS ATIVOS**

### **💻 Script Deploy - ✅ FUNCIONAL**
- Interface completa códigos CSS/JS
- Deploy automático GitHub Pages
- Monitoramento tempo real
- API 100% integrada e testada

### **Roadmap:**
- 📱 App Manager (Q1 2025)
- 🔗 URL Shortener (Q1 2025)
- 📊 Analytics Hub (Q2 2025)

---

## 📋 **COMANDOS ÚTEIS**

### **🛡️ Backup Duplo:**
```bash
# Backup manual obrigatório
npm run backup:dual

# Verificar logs de backup
tail -f /var/log/projeto-backup-dual.log

# Testar cron backup
/var/www/admin.widgetvpn.xyz/scripts/cron-backup.sh
```

### **🔄 Versionamento:**
```bash
# Deploy com versionamento automático
npm run version:patch "mensagem do commit"
npm run version:minor "nova funcionalidade"
npm run version:major "breaking change"

# Verificar versão atual
grep '"version"' package.json
```

### **🌿 Git Workflow:**
```bash
# Workflow obrigatório (após backup)
git checkout develop
git checkout -b feature/nome-da-feature
# ... fazer mudanças ...
git add . && git commit -m "..."
git checkout develop
git merge feature/nome-da-feature --no-ff
git push origin develop
```

### **🧪 Testes:**
```bash
# Deploy teste API
curl -X POST https://admin.widgetvpn.xyz/api/deploy-code.php \
  -H "Content-Type: application/json" \
  -d '{"filename":"test","content":"/* teste */","type":"css"}'

# Verificar cron jobs
crontab -l | grep admin.widgetvpn
```

---

---

## 🎯 **SISTEMA IMPLEMENTADO - RESUMO FINAL**

### **✅ BACKUP DUPLO v3.0 - ENTERPRISE LEVEL:**
- **Redundância total**: Servidor remoto (`pivpnaraponto.ddns.net:2222`) + Google Drive (15GB)
- **Rotação inteligente**: 30 dias (servidor) + 3 backups máximo (Drive)
- **Validação dupla**: MD5 + tamanho em ambos destinos
- **Automação**: Cron diário às 3:05 AM
- **Tempo execução**: ~2 minutos por backup
- **Taxa sucesso**: 100% (5 backups testados)

### **✅ GIT WORKFLOW PROFISSIONAL:**
- **Branch principal**: `develop` (base para desenvolvimento)
- **Branch produção**: `main` (merge final)
- **Feature branches**: Obrigatórias para mudanças
- **Merge strategy**: `--no-ff` (preserva histórico)
- **Versionamento**: Semântico automático (v1.0.1)
- **Deploy**: Integrado com backup obrigatório

### **✅ ARQUIVOS IMPLEMENTADOS:**
```
scripts/backup-dual-intelligent.sh    # ✅ Core backup (402 linhas)
scripts/cron-backup.sh                # ✅ Wrapper cron (37 linhas)
scripts/deploy.sh                     # ✅ Versionamento (143 linhas)
package.json                          # ✅ Comandos npm atualizados
```

### **✅ COMANDOS NPM ATIVOS:**
- `npm run backup:dual` - Backup duplo manual
- `npm run version:patch` - Deploy patch + backup
- `npm run version:minor` - Deploy minor + backup
- `npm run version:major` - Deploy major + backup

### **✅ CRON JOBS CONFIGURADOS:**
```bash
5 3 * * * /var/www/admin.widgetvpn.xyz/scripts/cron-backup.sh
```

---

**📅 Última Atualização**: 26/09/2025 21:40 UTC
**📦 Versão Atual**: v1.0.1
**🛡️ Status Backup**: ✅ Sistema duplo ativo e testado
**🔄 Status Git**: ✅ Workflow profissional implementado
**📊 Dashboard**: https://admin.widgetvpn.xyz
**🧪 Testes**: ✅ Workflow completo testado e aprovado

**🎯 PROJETO COM NÍVEL ENTERPRISE DE BACKUP E VERSIONAMENTO**
