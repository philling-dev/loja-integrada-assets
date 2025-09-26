# 🔄 GUIA DE IMPLEMENTAÇÃO - BACKUP DUPLO INTELIGENTE

**Versão**: 3.0 | **Redundância Total**: Servidor Remoto + Google Drive | **Rotação Automática**

---

## 🎯 **OBJETIVO**

Implementar sistema de backup duplo com redundância total para seu projeto, seguindo as melhores práticas de DevOps e automação.

---

## 🚨 **CHECKLIST OBRIGATÓRIO - SEMPRE SEGUIR**

**🔴 ANTES DE QUALQUER ALTERAÇÃO DE CÓDIGO:**
- [ ] 1️⃣ **npm run backup:dual** - OBRIGATÓRIO backup duplo antes de mudanças
- [ ] 2️⃣ **git checkout develop** - Sempre partir de develop
- [ ] 3️⃣ **git checkout -b feature/nome-da-alteracao** - Criar feature branch

**🔴 APÓS ALTERAÇÕES DE CÓDIGO:**
- [ ] 4️⃣ **git add .** - Adicionar alterações
- [ ] 5️⃣ **git commit** - Com template profissional
- [ ] 6️⃣ **git checkout develop && git merge feature/nome --no-ff** - Merge para develop
- [ ] 7️⃣ **npm run version:patch/minor/major "mensagem"** - Versionamento semântico
- [ ] 8️⃣ **git push origin develop** - PUSH OBRIGATÓRIO
- [ ] 9️⃣ **pm2 restart [nome-do-app]** - Restart produção

---

## 🛡️ **SISTEMA DE BACKUP DUPLO v3.0**

### **📋 REQUISITOS:**
1. **Servidor VPS** com SSH configurado
2. **Conta Google Drive** (15GB gratuito)
3. **rclone** instalado
4. **Node.js/npm** para scripts
5. **Cron** para automação

### **🔧 ETAPAS DE IMPLEMENTAÇÃO:**

#### **1️⃣ INSTALAR RCLONE:**
```bash
curl https://rclone.org/install.sh | sudo bash
```

#### **2️⃣ CONFIGURAR SERVIDOR REMOTO:**
```bash
# Configurar chave SSH para backup
ssh-keygen -t rsa -b 4096 -f /root/.ssh/backup_key
ssh-copy-id -i /root/.ssh/backup_key.pub user@servidor-remoto.com

# Testar conexão
ssh -i /root/.ssh/backup_key user@servidor-remoto.com "exit"
```

#### **3️⃣ CRIAR SCRIPT CONFIGURAÇÃO GOOGLE DRIVE:**
```bash
# scripts/setup-google-drive.sh
#!/bin/bash

# Configuração automática do Google Drive via rclone
# Criar remote "drive" para Google Drive
# Incluir instruções OAuth para servidor VPS
```

#### **4️⃣ CRIAR SCRIPT BACKUP DUPLO:**
```bash
# scripts/backup-dual-intelligent.sh
#!/bin/bash

# CONFIGURAÇÕES PERSONALIZÁVEIS
PROJECT_DIR="/var/www/seu-projeto"
REMOTE_SERVER="seu-servidor.com"
REMOTE_PORT="22"
REMOTE_USER="usuario"
REMOTE_BASE_DIR="/home/usuario/backups/seu-projeto"
SSH_KEY="/root/.ssh/backup_key"
GDRIVE_REMOTE="drive"
GDRIVE_BASE_DIR="Backups-Projeto"
MAX_GDRIVE_BACKUPS=3

# Resto da implementação...
```

#### **5️⃣ ATUALIZAR PACKAGE.JSON:**
```json
{
  "scripts": {
    "backup:dual": "scripts/backup-dual-intelligent.sh",
    "backup": "scripts/backup-intelligent.sh",
    "setup:gdrive": "scripts/setup-google-drive.sh"
  }
}
```

#### **6️⃣ CONFIGURAR CRON AUTOMÁTICO:**
```bash
# scripts/cron-backup.sh
#!/bin/bash
cd /var/www/seu-projeto
npm run backup:dual >> /var/log/projeto-backup-dual.log 2>&1

# Adicionar ao crontab:
# 0 3 * * * /var/www/seu-projeto/scripts/cron-backup.sh
```

---

## 🔄 **FUNCIONALIDADES IMPLEMENTADAS**

### **✅ BACKUP DUPLO:**
- **Destino 1**: Servidor remoto via SSH
- **Destino 2**: Google Drive via rclone
- **Validação**: MD5 + tamanho para ambos destinos
- **Estrutura**: Organizada por ano/mês

### **✅ ROTAÇÃO AUTOMÁTICA:**
- **Servidor remoto**: 30 dias + máximo 3 por mês
- **Google Drive**: Máximo 3 backups (mais recentes)
- **Limpeza**: Automática em ambos destinos

### **✅ AUTOMAÇÃO:**
- **Cron diário**: Todo dia às 3:00 AM
- **Logs centralizados**: `/var/log/projeto-backup-dual.log`
- **Tags Git**: Automáticas para rastreamento

---

## 📊 **COMANDOS ESSENCIAIS**

### **🔧 CONFIGURAÇÃO INICIAL:**
```bash
# 1. Configurar Google Drive (primeira vez)
npm run setup:gdrive

# 2. Testar backup duplo
npm run backup:dual

# 3. Verificar logs
tail -f /var/log/projeto-backup-dual.log
```

### **📝 MONITORAMENTO:**
```bash
# Verificar servidor remoto
ssh -i /root/.ssh/backup_key user@servidor.com "ls -la /home/user/backups/projeto/"

# Verificar Google Drive
rclone ls drive:Backups-Projeto/2025/09/

# Status do espaço Google Drive
rclone about drive:
```

### **🚀 BACKUP MANUAL:**
```bash
# Backup duplo (recomendado)
npm run backup:dual

# Backup simples (apenas servidor)
npm run backup
```

---

## 🎨 **ESTRUTURA DE ARQUIVOS**

```
projeto/
├── scripts/
│   ├── backup-dual-intelligent.sh    # Backup duplo principal
│   ├── backup-intelligent.sh         # Backup simples
│   ├── setup-google-drive.sh         # Configuração Google Drive
│   ├── cron-backup.sh               # Wrapper para cron
│   └── deploy.sh                    # Deploy versionado
├── package.json                     # Scripts npm
└── CLAUDE.md                       # Memória do assistente
```

---

## 🛡️ **SEGURANÇA E VALIDAÇÃO**

### **🔐 VALIDAÇÕES:**
- **Integridade**: Verificação MD5 em ambos destinos
- **Conectividade**: Teste SSH antes de envio
- **Espaço**: Monitoramento de disco remoto
- **Logs**: Registro detalhado de todas operações

### **🚨 ALERTAS:**
- **Falha backup**: Log de erro com detalhes
- **Espaço crítico**: Aviso >85% uso disco
- **Conexão falha**: Retry automático

---

## 📋 **PERSONALIZAÇÃO PARA SEU PROJETO**

### **🔧 VARIÁVEIS A PERSONALIZAR:**

1. **PROJECT_DIR**: Diretório do seu projeto
2. **REMOTE_SERVER**: Seu servidor de backup
3. **REMOTE_USER**: Usuário SSH do servidor
4. **REMOTE_BASE_DIR**: Diretório destino no servidor
5. **GDRIVE_BASE_DIR**: Pasta no Google Drive
6. **MAX_GDRIVE_BACKUPS**: Quantos backups manter (recomendado: 3)

### **📝 LOGS PERSONALIZADOS:**
- Alterar `/var/log/projeto-backup-dual.log` para seu projeto
- Configurar rotação de logs conforme necessidade

### **⚙️ EXCLUSÕES BACKUP:**
```bash
# Personalizar exclusões no tar:
--exclude='node_modules'
--exclude='*.log'
--exclude='*.tmp'
--exclude='.git/objects'
--exclude='seu-diretorio-temporario'
```

---

## 🎯 **BENEFÍCIOS ALCANÇADOS**

✅ **Zero ponto único de falha**
✅ **15GB gratuito Google Drive**
✅ **Backup automático diário**
✅ **Rotação inteligente**
✅ **Validação dupla de integridade**
✅ **Logs centralizados**
✅ **Rollback rápido**

---

## 🚀 **PRÓXIMOS PASSOS**

1. **Adaptar scripts** para seu projeto específico
2. **Configurar credenciais** SSH e Google Drive
3. **Testar backup duplo** manualmente
4. **Configurar cron** para automação
5. **Monitorar logs** nas primeiras execuções
6. **Documentar** configurações específicas

---

**🛡️ REDUNDÂNCIA TOTAL GARANTIDA | BACKUP DUPLO AUTOMÁTICO | ZERO DOWNTIME**