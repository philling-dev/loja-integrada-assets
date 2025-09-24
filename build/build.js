const fs = require('fs-extra');
const path = require('path');
const CleanCSS = require('clean-css');
const { minify } = require('terser');
const chalk = require('chalk');

class BuildSystem {
    constructor() {
        this.rootDir = path.resolve(__dirname, '..');
        this.adminDir = path.join(this.rootDir, 'admin');
        this.assetsDir = path.join(this.rootDir, 'assets');
        this.codesFile = path.join(this.adminDir, 'codes.json');

        this.cleanCSS = new CleanCSS({
            level: 2,
            returnPromise: true
        });
    }

    async build() {
        console.log(chalk.blue('🚀 Iniciando build dos assets...'));

        try {
            // Limpar diretório de assets
            await this.cleanAssets();

            // Carregar códigos salvos
            const codes = await this.loadCodes();

            // Processar cada código
            for (const code of codes) {
                if (code.active) {
                    await this.processCode(code);
                }
            }

            // Gerar arquivo de índice
            await this.generateIndex(codes);

            console.log(chalk.green('✅ Build concluído com sucesso!'));

        } catch (error) {
            console.error(chalk.red('❌ Erro durante o build:'), error);
            process.exit(1);
        }
    }

    async cleanAssets() {
        console.log(chalk.yellow('🧹 Limpando assets anteriores...'));

        await fs.ensureDir(path.join(this.assetsDir, 'css'));
        await fs.ensureDir(path.join(this.assetsDir, 'js'));

        await fs.emptyDir(path.join(this.assetsDir, 'css'));
        await fs.emptyDir(path.join(this.assetsDir, 'js'));
    }

    async loadCodes() {
        try {
            // Tentar carregar do arquivo
            if (await fs.pathExists(this.codesFile)) {
                return await fs.readJson(this.codesFile);
            }

            // Se não existir, retornar códigos de exemplo
            return this.getExampleCodes();

        } catch (error) {
            console.log(chalk.yellow('⚠️  Usando códigos de exemplo...'));
            return this.getExampleCodes();
        }
    }

    getExampleCodes() {
        return [
            {
                id: 'dropdown-menu-001',
                name: 'Dropdown Menu Moderno',
                location: 'header',
                type: 'css',
                pages: 'all',
                content: `/* Dropdown Menu Moderno */
.custom-dropdown {
    position: relative;
    display: inline-block;
}

.dropdown-content {
    display: none;
    position: absolute;
    background-color: #f9f9f9;
    min-width: 160px;
    box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2);
    z-index: 1;
    border-radius: 4px;
    overflow: hidden;
}

.custom-dropdown:hover .dropdown-content {
    display: block;
    animation: fadeIn 0.2s ease-in;
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
}

.dropdown-content a {
    color: black;
    padding: 12px 16px;
    text-decoration: none;
    display: block;
    transition: background-color 0.2s;
}

.dropdown-content a:hover {
    background-color: #f1f1f1;
}`,
                active: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                id: 'analytics-enhanced-002',
                name: 'Analytics Enhanced',
                location: 'header',
                type: 'js',
                pages: 'all',
                content: `// Analytics Enhanced
(function() {
    'use strict';

    console.log('🔍 Analytics Enhanced carregado');

    // Configuração
    const config = {
        trackClicks: true,
        trackScroll: true,
        trackTiming: true
    };

    // Track eventos customizados
    function trackEvent(action, category, label, value) {
        if (typeof gtag !== 'undefined') {
            gtag('event', action, {
                event_category: category,
                event_label: label,
                value: value
            });
        } else {
            console.log('Event tracked:', { action, category, label, value });
        }
    }

    // Track cliques em elementos
    if (config.trackClicks) {
        document.addEventListener('click', function(e) {
            const element = e.target;
            if (element.tagName === 'A' || element.tagName === 'BUTTON') {
                trackEvent('click', 'interaction', element.textContent.trim());
            }
        });
    }

    // Track scroll depth
    if (config.trackScroll) {
        let maxScroll = 0;
        window.addEventListener('scroll', function() {
            const scrollPercent = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
            if (scrollPercent > maxScroll && scrollPercent % 25 === 0) {
                maxScroll = scrollPercent;
                trackEvent('scroll', 'engagement', scrollPercent + '%');
            }
        });
    }

    // Disponibilizar globalmente
    window.trackCustomEvent = trackEvent;
    window.analyticsConfig = config;
})();`,
                active: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }
        ];
    }

    async processCode(code) {
        console.log(chalk.blue(`📝 Processando: ${code.name}`));

        const filename = this.generateFilename(code);
        let processed = code.content;

        if (code.type === 'css') {
            // Minificar CSS
            const result = await this.cleanCSS.minify(code.content);
            processed = result.styles;

            // Salvar arquivo CSS
            const filepath = path.join(this.assetsDir, 'css', filename);
            await fs.writeFile(filepath, processed);

        } else if (code.type === 'js') {
            // Minificar JavaScript
            const result = await minify(code.content);
            processed = result.code;

            // Salvar arquivo JS
            const filepath = path.join(this.assetsDir, 'js', filename);
            await fs.writeFile(filepath, processed);
        }

        console.log(chalk.green(`   ✅ ${filename} gerado`));
    }

    generateFilename(code) {
        const slug = code.name.toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();

        return `${slug}-${code.id}.min.${code.type === 'css' ? 'css' : 'js'}`;
    }

    async generateIndex(codes) {
        console.log(chalk.blue('📄 Gerando arquivo de índice...'));

        const activeCodes = codes.filter(code => code.active);
        const cssFiles = activeCodes.filter(code => code.type === 'css');
        const jsFiles = activeCodes.filter(code => code.type === 'js');

        const indexData = {
            generated: new Date().toISOString(),
            version: '1.0.0',
            totalCodes: activeCodes.length,
            files: {
                css: cssFiles.map(code => ({
                    id: code.id,
                    name: code.name,
                    filename: this.generateFilename(code),
                    location: code.location,
                    pages: code.pages,
                    url: `https://philling-dev.github.io/loja-integrada-assets/assets/css/${this.generateFilename(code)}`
                })),
                js: jsFiles.map(code => ({
                    id: code.id,
                    name: code.name,
                    filename: this.generateFilename(code),
                    location: code.location,
                    pages: code.pages,
                    url: `https://philling-dev.github.io/loja-integrada-assets/assets/js/${this.generateFilename(code)}`
                }))
            }
        };

        await fs.writeJson(path.join(this.assetsDir, 'index.json'), indexData, { spaces: 2 });

        // Gerar README para assets
        const readme = this.generateAssetsReadme(indexData);
        await fs.writeFile(path.join(this.assetsDir, 'README.md'), readme);

        console.log(chalk.green('   ✅ index.json e README.md gerados'));
    }

    generateAssetsReadme(indexData) {
        return `# Assets da Loja Integrada

> Arquivos minificados e otimizados para uso na Loja Integrada
> Gerado automaticamente em: ${new Date(indexData.generated).toLocaleString('pt-BR')}

## 📊 Estatísticas

- **Total de códigos ativos:** ${indexData.totalCodes}
- **Arquivos CSS:** ${indexData.files.css.length}
- **Arquivos JavaScript:** ${indexData.files.js.length}

## 🎨 Arquivos CSS

${indexData.files.css.map(file => `
### ${file.name}
- **Arquivo:** \`${file.filename}\`
- **Local:** ${file.location}
- **Páginas:** ${file.pages}
- **URL:** \`${file.url}\`

**Código para Loja Integrada:**
\`\`\`html
<link rel="stylesheet" href="${file.url}">
\`\`\`
`).join('\n')}

## 📜 Arquivos JavaScript

${indexData.files.js.map(file => `
### ${file.name}
- **Arquivo:** \`${file.filename}\`
- **Local:** ${file.location}
- **Páginas:** ${file.pages}
- **URL:** \`${file.url}\`

**Código para Loja Integrada:**
\`\`\`html
<script src="${file.url}"></script>
\`\`\`
`).join('\n')}

---

*Gerado pelo sistema de build automático*
`;
    }
}

// Executar build se chamado diretamente
if (require.main === module) {
    const builder = new BuildSystem();
    builder.build();
}

module.exports = BuildSystem;