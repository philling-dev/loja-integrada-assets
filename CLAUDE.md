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
- **Automação**: Cron diário 3:00 AM

**⚠️ NUNCA ALTERAR CÓDIGO SEM BACKUP PRÉVIO**

---

## 🌐 **ACESSO E STATUS**

### **URLs Principais:**
- **Dashboard**: https://admin.widgetvpn.xyz
- **Credenciais**: admin@widgetvpn.xyz / Admin123456
- **SSL**: ✅ Válido até 23/12/2025

### **Status Atual:**
- ✅ **PROJETO CONCLUÍDO** (26/09/2025)
- ✅ Dashboard profissional multi-projetos funcional
- ✅ API Deploy 100% operacional
- ✅ Navegação SPA completa

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
└── assets/                 # ✅ 25+ arquivos deployados
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

```bash
# Backup obrigatório
npm run backup:dual

# Verificar logs
tail -f /var/log/projeto-backup-dual.log

# Deploy teste
curl -X POST https://admin.widgetvpn.xyz/api/deploy-code.php \
  -H "Content-Type: application/json" \
  -d '{"filename":"test","content":"/* teste */","type":"css"}'
```

---

**📅 Última Atualização**: 26/09/2025 16:20 UTC
**Status**: ✅ CONCLUÍDO E REFINADO
**Backup**: ✅ Sistema duplo ativo
**Dashboard**: https://admin.widgetvpn.xyz
**🧪 Teste de Workflow**: Sistema de backup duplo e Git workflow testado e aprovado (Fri Sep 26 21:38:15 -03 2025)
