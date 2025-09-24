# 🛒 Loja Integrada Assets Manager

> Sistema profissional para gerenciar códigos CSS/JS da Loja Integrada com deploy automático via GitHub Pages

![Status](https://img.shields.io/badge/status-ready-brightgreen)
![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## 🎯 O que é este projeto?

Este sistema resolve o problema de **gerenciar códigos CSS e JavaScript** na Loja Integrada de forma profissional:

- ✅ **Dashboard minimalista** para criar e organizar códigos
- ✅ **Códigos de uma linha** para colar na Loja Integrada
- ✅ **Minificação automática** para melhor performance
- ✅ **Deploy automático** via GitHub Pages
- ✅ **Versionamento** e backup automático dos códigos

## 🚀 Como usar

### 1️⃣ Configuração inicial

```bash
# Clone este repositório
git clone https://github.com/[SEU-USERNAME]/loja-integrada-assets.git
cd loja-integrada-assets

# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev
```

### 2️⃣ Acessar o Dashboard

Abra: `http://localhost:8080`

O dashboard permite:
- 📝 Criar/editar códigos CSS e JavaScript
- 🎯 Definir onde aplicar (cabeçalho, rodapé, etc.)
- 📱 Escolher páginas específicas
- 🔗 Gerar códigos de uma linha
- 📊 Visualizar estatísticas

### 3️⃣ Deploy no GitHub Pages

```bash
# Build manual
npm run build

# Os arquivos serão automaticamente deployados via GitHub Actions
# Quando você fizer push para o repositório
```

## 📁 Estrutura do Projeto

```
loja-integrada-assets/
├── admin/                  # 🎛️ Dashboard administrativo
│   ├── index.html         # Interface principal
│   ├── css/admin.css      # Estilos do dashboard
│   └── js/admin.js        # Lógica do dashboard
├── assets/                # 📦 Arquivos finais (GitHub Pages)
│   ├── css/              # CSS minificados
│   ├── js/               # JS minificados
│   └── index.json        # Índice dos arquivos
├── build/                 # 🔧 Scripts de build
│   ├── build.js          # Sistema de build principal
│   └── dev-server.js     # Servidor de desenvolvimento
├── .github/workflows/     # 🤖 CI/CD automático
│   └── deploy.yml        # Workflow do GitHub Actions
└── package.json          # Configuração do projeto
```

## 🎨 Como funciona na Loja Integrada

### Para CSS (Dropdown Menu exemplo):

**No Dashboard:** Você cria um código CSS para dropdown menu

**Código gerado:**
```html
<link rel="stylesheet" href="https://[SEU-USERNAME].github.io/loja-integrada-assets/css/dropdown-menu-001.min.css">
```

**Na Loja Integrada:** Cola essa única linha no campo "HTML" da área "Incluir códigos"

### Para JavaScript (Analytics exemplo):

**No Dashboard:** Você cria um código JS para analytics

**Código gerado:**
```html
<script src="https://[SEU-USERNAME].github.io/loja-integrada-assets/js/analytics-enhanced-002.min.js"></script>
```

**Na Loja Integrada:** Cola essa única linha no campo apropriado

## 🛠️ Comandos disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Inicia servidor de desenvolvimento |
| `npm run build` | Gera arquivos minificados |
| `npm run serve` | Serve arquivos localmente |
| `npm run clean` | Limpa arquivos gerados |

## ⚡ Funcionalidades Avançadas

### 🎯 Organização Inteligente
- Códigos similares podem compartilhar o mesmo arquivo
- Sistema de tags automático
- Filtros por local, tipo e páginas

### 🔄 Deploy Automático
- Push no GitHub → Build automático → Deploy no Pages
- URLs sempre atualizadas
- Backup automático dos códigos

### 📊 Monitoramento
- Dashboard com estatísticas
- Status dos deploys
- Histórico de modificações

## 🔧 Configuração do GitHub Pages

1. **No seu repositório GitHub:**
   - Vá em `Settings` > `Pages`
   - Source: `GitHub Actions`
   - ✅ O workflow fará todo o resto!

2. **URLs dos seus assets:**
   ```
   https://[SEU-USERNAME].github.io/loja-integrada-assets/css/[arquivo].min.css
   https://[SEU-USERNAME].github.io/loja-integrada-assets/js/[arquivo].min.js
   ```

## 📝 Configurações da Loja Integrada

### Local de Publicação:
- **Cabeçalho:** `<head>` - Ideal para CSS e scripts críticos
- **Rodapé:** Antes de `</body>` - Ideal para JavaScript
- **Corpo:** Dentro do conteúdo - Para HTML específico

### Páginas de Publicação:
- **Todas as páginas:** CSS global, analytics
- **Página inicial:** Banners, promoções
- **Página do produto:** Scripts de produto
- **Checkout:** Scripts de conversão
- **Exceto checkout:** Evitar interferência no processo de compra

## 🎯 Casos de Uso Comuns

### 1. Menu Dropdown Personalizado
```css
/* CSS otimizado para menu dropdown responsivo */
.custom-dropdown { /* ... código ... */ }
```
→ **Resultado:** Uma linha CSS na Loja Integrada

### 2. Google Analytics Enhanced
```javascript
// JavaScript com tracking avançado
(function() { /* ... código ... */ })();
```
→ **Resultado:** Uma linha JS na Loja Integrada

### 3. Pop-up de Newsletter
```javascript
// Sistema completo de pop-up responsivo
window.NewsletterPopup = { /* ... código ... */ };
```
→ **Resultado:** Uma linha JS na Loja Integrada

## 🔒 Segurança e Performance

- ✅ **Minificação:** Arquivos 70% menores
- ✅ **CDN:** GitHub Pages como CDN global
- ✅ **Cache:** Headers otimizados para cache
- ✅ **HTTPS:** Certificado SSL automático
- ✅ **Versionamento:** Controle de versões dos códigos

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch: `git checkout -b feature/nova-feature`
3. Commit: `git commit -m 'Adiciona nova feature'`
4. Push: `git push origin feature/nova-feature`
5. Abra um Pull Request

## 📞 Suporte

- 📧 **Issues:** Use o GitHub Issues para reportar problemas
- 📚 **Wiki:** Documentação detalhada na Wiki
- 💬 **Discussões:** GitHub Discussions para dúvidas

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para detalhes.

---

### 🎉 Resultado Final

Ao invés de gerenciar múltiplos códigos espalhados na Loja Integrada, você terá:

**❌ Antes:**
```html
<!-- Código CSS inline gigante -->
<style>
  .dropdown { /* 200 linhas de CSS */ }
  .analytics { /* 100 linhas de JS */ }
  /* Código desorganizado e difícil de manter */
</style>
```

**✅ Depois:**
```html
<!-- Uma linha limpa e profissional -->
<link rel="stylesheet" href="https://seusite.github.io/assets/css/all-styles.min.css">
<script src="https://seusite.github.io/assets/js/all-scripts.min.js"></script>
```

**Benefícios:**
- 🚀 **70% mais rápido** (arquivos minificados)
- 🔧 **Fácil manutenção** (dashboard centralizado)
- 📱 **Sempre atualizado** (deploy automático)
- 🔒 **Backup seguro** (versionado no Git)
- 💻 **Profissional** (URLs limpas)

---

*Criado com ❤️ para facilitar o desenvolvimento na Loja Integrada*