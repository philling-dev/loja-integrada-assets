# Dashboard Administrativo WidgetVPN - Memória Contextual

## 🌐 **IDENTIDADE & ACESSO**

**Dashboard**: https://admin.widgetvpn.xyz/admin/index.html
**Credenciais**: admin@widgetvpn.xyz / Admin123456
**Versão Atual**: v1.1.0
**Status**: ✅ **SISTEMA COMPLETO EM PRODUÇÃO**
**SSL**: ✅ Válido até 23/12/2025

---

## 🚨 **REGRAS OBRIGATÓRIAS**

### **🔴 ANTES DE QUALQUER ALTERAÇÃO:**
```bash
npm run backup:dual          # 1. BACKUP DUPLO OBRIGATÓRIO
git checkout develop         # 2. Partir de develop
git checkout -b feature/nome  # 3. Feature branch
```

### **🔴 APÓS ALTERAÇÕES:**
```bash
git add . && git commit       # 4. Commit profissional
git checkout develop && git merge feature/nome --no-ff  # 5. Merge preservando histórico
npm run version:patch "msg"   # 6. Versionamento semântico
git push origin develop       # 7. PUSH OBRIGATÓRIO
```

**⚠️ NUNCA ALTERAR CÓDIGO SEM BACKUP PRÉVIO**

---

## 🏗️ **ARQUITETURA TÉCNICA**

### **Stack:**
- **Frontend**: HTML5 + CSS3 Variables + JavaScript ES6 (Vanilla)
- **Backend**: PHP 8.3 + API REST
- **Deploy**: GitHub Pages automático
- **Backup**: Servidor remoto + Google Drive (duplo)

### **Estrutura Principal:**
```
admin/
├── index.html              # Dashboard principal (interface SPA)
├── api/deploy-code.php     # API deploy CSS/JS → GitHub Pages
├── assets/index.json       # Índice códigos deployados (38+ arquivos)
└── scripts/                # Automações (backup, sync, deploy)
```

### **APIs Funcionais:**
- `/api/deploy-code.php` - Deploy CSS/JS para GitHub Pages
- `/api/analytics.php` - Métricas sistema
- `/api/notifications.php` - SSE tempo real

---

## 🎯 **FUNCIONALIDADES ATIVAS**

### **💻 Script Deploy - FUNCIONAL COMPLETO**
- ✅ **Interface Profissional**: Cards com hover effects, badges status
- ✅ **Edição Inline**: Carrega código existente para edição
- ✅ **Re-deploy Individual**: Redeploy códigos com feedback visual
- ✅ **Status Visual**: Badges ✅ Deployed / ⏳ Local
- ✅ **Organização**: CSS (azul) vs JS (laranja) separados
- ✅ **5 Ações**: Editar, Re-deploy, Copiar URL, Abrir, Deletar
- ✅ **38+ Códigos**: 27 CSS + 11 JS ativos no GitHub Pages

### **🛡️ Sistema Backup Duplo v3.0:**
- **Destinos**: Servidor remoto + Google Drive (15GB)
- **Comando**: `npm run backup:dual`
- **Automação**: Cron 3:05 AM diário
- **Validação**: MD5 dupla + integridade
- **Rotação**: 30 dias (servidor) + 3 backups (Drive)

---

## 📋 **COMANDOS ESSENCIAIS**

### **Backup & Deploy:**
```bash
npm run backup:dual                    # Backup duplo manual
npm run version:patch "mensagem"       # Deploy patch + backup
npm run version:minor "nova feature"   # Deploy minor + backup
```

### **Teste API Deploy:**
```bash
curl -X POST https://admin.widgetvpn.xyz/api/deploy-code.php \
  -H "Content-Type: application/json" \
  -d '{"filename":"test","content":"/* teste */","type":"css"}'
```

### **Verificações:**
```bash
crontab -l | grep admin.widgetvpn  # Verificar cron jobs
tail -f /var/log/projeto-backup-dual.log  # Logs backup
```

---

## 🔄 **AUTOMAÇÕES ATIVAS**

- **Backup Diário**: 3:05 AM (cron-backup.sh)
- **Sync GitHub**: 4:00 AM (cron-sync-github.sh)
- **Deploy Automático**: CSS/JS → GitHub Pages
- **Notificações**: SSE tempo real

---

## 🚀 **ROADMAP**

**Q1 2025:**
- 📱 App Manager
- 🔗 URL Shortener

**Q2 2025:**
- 📊 Analytics Hub

---

## 🧪 **STATUS TÉCNICO**

- **Total Assets**: 38 arquivos (27 CSS + 11 JS)
- **GitHub Pages**: https://philling-dev.github.io/loja-integrada-assets/
- **Performance**: <1s carregamento
- **Uptime**: 100% (sistema estático)
- **Backup**: ✅ Último 26/09 22:49 (176KB)

---

**📅 Atualização**: 26/09/2025
**🎯 Status**: Sistema enterprise completo e auditado
**🔄 Branch**: develop (commit 7ea5116)