/**
 * Dashboard Core - Navegação SPA e Gerenciamento de Estado
 * Sistema modular com integração API/Toast/Storage
 */
class DashboardCore {
    constructor() {
        this.currentPage = 'overview';
        this.sidebarCollapsed = false;
        this.initialized = false;

        this.init();
    }

    /**
     * Inicialização do dashboard
     */
    async init() {
        console.log('🚀 Inicializando Dashboard Core');
        console.log('🔍 Dashboard this:', this);

        // Verificar dependências (warn but don't block)
        if (!this.checkDependencies()) {
            console.warn('⚠️ Algumas dependências não encontradas, continuando mesmo assim');
        }

        // Inicializar componentes
        this.initNavigation();
        this.initSidebar();
        this.initMobileMenu();
        this.bindGlobalEvents();

        // Restaurar estado
        this.restoreState();

        // Carregar página inicial
        const savedPage = Storage ? Storage.getLastProject() : 'overview';
        this.showPage(savedPage || 'overview');

        this.initialized = true;
        console.log('✅ Dashboard Core inicializado');
        console.log('🌍 Window.Dashboard:', window.Dashboard);

        // Inicializar Lucide icons
        if (window.lucide) {
            lucide.createIcons({ nameAttr: 'data-lucide' });
        }

        // Adicionar função de teste global
        window.testDeployScript = () => {
            console.log('🧪 Testando Deploy Script...');
            this.toggleProject('deploy-script');
        };

        console.log('🧪 Use window.testDeployScript() para testar');
    }

    /**
     * Verificar se utilitários estão disponíveis
     */
    checkDependencies() {
        const deps = ['API', 'Toast', 'Storage'];
        const missing = deps.filter(dep => !window[dep]);

        if (missing.length > 0) {
            console.error('❌ Dependências faltando:', missing);
            return false;
        }

        return true;
    }

    // ===========================================
    // NAVEGAÇÃO SPA
    // ===========================================

    /**
     * Inicializar sistema de navegação
     */
    initNavigation() {
        // Event delegation para links de navegação
        document.addEventListener('click', (e) => {
            const navLink = e.target.closest('[data-page]');
            if (navLink) {
                e.preventDefault();
                const page = navLink.getAttribute('data-page');
                this.showPage(page);
            }
        });

        // Event delegation para toggles de projeto
        document.addEventListener('click', (e) => {
            console.log('🖱️ Click detectado:', e.target);

            const projectToggle = e.target.closest('.project-toggle');
            if (projectToggle) {
                console.log('🎯 Project toggle encontrado:', projectToggle);
                e.preventDefault();
                e.stopPropagation();
                const projectId = projectToggle.getAttribute('data-project');
                console.log('📁 Project ID:', projectId);
                this.toggleProject(projectId);
                return;
            }

            // Também verificar se é um submenu item
            const submenuItem = e.target.closest('.submenu-item');
            if (submenuItem) {
                console.log('📋 Submenu item clicado:', submenuItem);
                e.preventDefault();
                const page = submenuItem.getAttribute('data-page');
                if (page) {
                    console.log('🧭 Navegando para página:', page);
                    this.showPage(page);
                }
            }
        });

        // Navegação por teclado
        document.addEventListener('keydown', (e) => {
            if (e.altKey && e.key >= '1' && e.key <= '5') {
                e.preventDefault();
                const pages = ['overview', 'deploy-script-codes', 'deploy-script-deploy', 'deploy-script-settings'];
                const index = parseInt(e.key) - 1;
                if (pages[index]) {
                    this.showPage(pages[index]);
                }
            }
        });
    }

    /**
     * Mostrar página específica
     */
    async showPage(page) {
        console.log(`📄 Navegando para: ${page || 'overview'}`);

        // Use default page if none specified
        if (!page) page = 'overview';

        // Atualizar navegação visual
        this.updateNavigationState(page);

        // Renderizar conteúdo
        try {
            await this.renderPageContent(page);

            // Salvar estado
            this.currentPage = page;
            if (Storage) Storage.setLastProject(page);

            // Atualizar breadcrumb
            this.updateBreadcrumb(page);

        } catch (error) {
            console.error('❌ Erro ao carregar página:', error);
            Toast.error('Erro ao carregar página');
        }
    }

    /**
     * Atualizar estado visual da navegação
     */
    updateNavigationState(page) {
        // Remover estado ativo
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });

        // Adicionar estado ativo
        const activeItem = document.querySelector(`[data-page="${page}"]`)?.closest('.nav-item');
        if (activeItem) {
            activeItem.classList.add('active');
        }

        // Expandir projeto pai se necessário
        if (page.includes('-')) {
            const [projectId] = page.split('-');
            this.expandProject(projectId, false);
        }
    }

    /**
     * Renderizar conteúdo da página
     */
    async renderPageContent(page) {
        const mainContent = document.getElementById('main-content');
        if (!mainContent) {
            console.error('❌ Container main-content não encontrado');
            return;
        }

        // Mostrar loading
        mainContent.innerHTML = `
            <div class="loading-container">
                <div class="loading-spinner">
                    <i data-lucide="loader-2" class="animate-spin"></i>
                </div>
                <p>Carregando...</p>
            </div>
        `;

        // Simular carregamento mínimo para UX
        await new Promise(resolve => setTimeout(resolve, 200));

        // Obter configuração da página
        const pageConfig = this.getPageConfig(page);

        // Renderizar página
        mainContent.innerHTML = `
            <div class="content-header">
                <h1>${pageConfig.title}</h1>
                ${pageConfig.subtitle ? `<p class="content-subtitle">${pageConfig.subtitle}</p>` : ''}
            </div>
            <div class="content-body">
                ${pageConfig.content}
            </div>
        `;

        // Executar lógica específica da página
        await this.executePageLogic(page);

        // Notificar outros componentes sobre mudança de página
        window.dispatchEvent(new CustomEvent('pageLoaded', {
            detail: { page: page }
        }));

        // Re-inicializar Lucide icons
        if (window.lucide) {
            lucide.createIcons({ nameAttr: 'data-lucide' });
        }
    }

    /**
     * Obter configuração da página
     */
    getPageConfig(page) {
        const pages = {
            'overview': {
                title: 'Dashboard Overview',
                subtitle: 'Visão geral de todos os projetos',
                content: this.getOverviewContent()
            },
            'deploy-script-codes': {
                title: 'Códigos Individuais',
                subtitle: 'Gerenciamento de códigos CSS e JavaScript',
                content: this.getCodesPageContent()
            },
            'deploy-script-deploy': {
                title: 'Deploy & Status',
                subtitle: 'Monitoramento e controle de deploys',
                content: this.getDeployPageContent()
            },
            'deploy-script-settings': {
                title: 'Configurações',
                subtitle: 'Configurações do sistema e preferências',
                content: this.getSettingsPageContent()
            }
        };

        return pages[page] || {
            title: 'Página não encontrada',
            content: this.get404Content()
        };
    }

    /**
     * Executar lógica específica da página
     */
    async executePageLogic(page) {
        switch (page) {
            case 'overview':
                await this.initOverviewPage();
                break;
            case 'deploy-script-codes':
                await this.initCodesPage();
                break;
            case 'deploy-script-deploy':
                await this.initDeployPage();
                break;
            case 'deploy-script-settings':
                await this.initSettingsPage();
                break;
        }
    }

    // ===========================================
    // SIDEBAR & LAYOUT
    // ===========================================

    /**
     * Inicializar sidebar
     */
    initSidebar() {
        const sidebarToggle = document.getElementById('sidebarToggle');
        const sidebar = document.getElementById('sidebar');

        if (sidebarToggle && sidebar) {
            sidebarToggle.addEventListener('click', () => {
                this.toggleSidebar();
            });
        }
    }

    /**
     * Toggle sidebar
     */
    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        if (!sidebar) return;

        this.sidebarCollapsed = !this.sidebarCollapsed;
        sidebar.classList.toggle('collapsed', this.sidebarCollapsed);

        if (Storage) Storage.setSidebarCollapsed(this.sidebarCollapsed);

        // Disparar evento para outros componentes
        window.dispatchEvent(new CustomEvent('sidebarToggle', {
            detail: { collapsed: this.sidebarCollapsed }
        }));
    }

    /**
     * Inicializar menu mobile
     */
    initMobileMenu() {
        const mobileToggle = document.getElementById('mobileToggle');
        const sidebar = document.getElementById('sidebar');

        if (mobileToggle && sidebar) {
            mobileToggle.addEventListener('click', () => {
                sidebar.classList.toggle('mobile-active');
            });

            // Fechar menu mobile ao clicar fora
            document.addEventListener('click', (e) => {
                if (window.innerWidth <= 768) {
                    if (!sidebar.contains(e.target) && !mobileToggle.contains(e.target)) {
                        sidebar.classList.remove('mobile-active');
                    }
                }
            });
        }
    }

    /**
     * Toggle projeto na sidebar
     */
    toggleProject(projectId) {
        console.log('🔄 Toggle project chamado para:', projectId);
        this.expandProject(projectId, true);
    }

    /**
     * Expandir projeto específico
     */
    expandProject(projectId, toggle = false) {
        console.log('🔍 Expand project chamado:', { projectId, toggle });

        const projectElement = document.querySelector(`[data-project="${projectId}"]`);
        console.log('📍 Project element:', projectElement);

        const navGroup = projectElement?.closest('.nav-group');
        console.log('📁 Nav group:', navGroup);

        const submenu = navGroup?.querySelector('.nav-submenu');
        console.log('📋 Submenu:', submenu);

        if (!projectElement || !navGroup || !submenu) {
            console.error('❌ Elementos não encontrados!');
            return;
        }

        const isExpanded = navGroup.classList.contains('expanded');
        console.log('🔄 Is expanded:', isExpanded);

        if (toggle) {
            console.log('🧹 Fechando todos os projetos primeiro...');
            // Fechar todos os projetos primeiro
            document.querySelectorAll('.nav-group').forEach(group => {
                group.classList.remove('expanded');
                const groupSubmenu = group.querySelector('.nav-submenu');
                if (groupSubmenu) {
                    groupSubmenu.style.display = 'none';
                }
            });
        }

        // Expandir/recolher o projeto atual
        if (!isExpanded || !toggle) {
            console.log('✅ Expandindo projeto...');
            navGroup.classList.add('expanded');
            submenu.style.display = 'block';
            console.log('📝 Submenu display após expansão:', submenu.style.display);
            if (Storage) Storage.setSessionData('expandedProject', projectId);
        } else if (toggle) {
            console.log('❌ Recolhendo projeto...');
            navGroup.classList.remove('expanded');
            submenu.style.display = 'none';
            if (Storage) Storage.setSessionData('expandedProject', null);
        }
    }

    // ===========================================
    // CONTEÚDO DAS PÁGINAS
    // ===========================================

    getOverviewContent() {
        return `
            <div class="overview-grid">
                <div class="overview-card">
                    <div class="card-header">
                        <div class="card-title">
                            <i data-lucide="file-code"></i>
                            <h3>Deploy Script</h3>
                        </div>
                        <div class="status-badge status-active">Ativo</div>
                    </div>
                    <div class="card-body">
                        <div class="metrics-grid">
                            <div class="metric">
                                <span class="metric-value" id="overview-codes-count">-</span>
                                <span class="metric-label">Códigos</span>
                            </div>
                            <div class="metric">
                                <span class="metric-value" id="overview-deployed-count">-</span>
                                <span class="metric-label">Deployados</span>
                            </div>
                        </div>
                        <div class="card-actions">
                            <button data-page="deploy-script-codes" class="btn btn-primary btn-sm">
                                <i data-lucide="code"></i>
                                Gerenciar Códigos
                            </button>
                        </div>
                    </div>
                </div>

                <div class="overview-card">
                    <div class="card-header">
                        <div class="card-title">
                            <i data-lucide="activity"></i>
                            <h3>Performance</h3>
                        </div>
                        <div class="status-badge status-success">Online</div>
                    </div>
                    <div class="card-body">
                        <div class="metrics-grid">
                            <div class="metric">
                                <span class="metric-value">GitHub Pages</span>
                                <span class="metric-label">CDN</span>
                            </div>
                            <div class="metric">
                                <span class="metric-value" id="overview-performance">-</span>
                                <span class="metric-label">Otimização</span>
                            </div>
                        </div>
                        <div class="card-actions">
                            <button data-page="deploy-script-deploy" class="btn btn-primary btn-sm">
                                <i data-lucide="rocket"></i>
                                Ver Deploy
                            </button>
                        </div>
                    </div>
                </div>

                <div class="overview-card">
                    <div class="card-header">
                        <div class="card-title">
                            <i data-lucide="zap"></i>
                            <h3>Ações Rápidas</h3>
                        </div>
                    </div>
                    <div class="card-body">
                        <div class="quick-actions">
                            <button id="quick-new-code" class="btn btn-primary btn-block">
                                <i data-lucide="plus"></i>
                                Novo Código
                            </button>
                            <button data-page="deploy-script-deploy" class="btn btn-secondary btn-block">
                                <i data-lucide="upload"></i>
                                Deploy Rápido
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    getCodesPageContent() {
        return `
            <div class="page-toolbar">
                <div class="toolbar-left">
                    <button id="new-code-btn" class="btn btn-primary">
                        <i data-lucide="plus"></i>
                        Novo Código
                    </button>
                    <div class="search-box">
                        <i data-lucide="search"></i>
                        <input type="text" id="codes-search" placeholder="Buscar códigos...">
                    </div>
                </div>
                <div class="toolbar-right">
                    <select id="codes-filter" class="form-select">
                        <option value="">Todos os tipos</option>
                        <option value="css">CSS</option>
                        <option value="js">JavaScript</option>
                    </select>
                </div>
            </div>
            <div id="codes-list" class="codes-grid">
                <div class="loading-placeholder">Carregando códigos...</div>
            </div>
        `;
    }

    getDeployPageContent() {
        return `
            <div class="deploy-grid">
                <div class="deploy-card">
                    <div class="card-header">
                        <div class="card-title">
                            <i data-lucide="server"></i>
                            <h3>Status do Deploy</h3>
                        </div>
                    </div>
                    <div class="card-body">
                        <div class="status-grid">
                            <div class="status-item">
                                <span class="status-label">GitHub Pages:</span>
                                <div class="status-badge status-success" id="deploy-status">Online</div>
                            </div>
                            <div class="status-item">
                                <span class="status-label">Último Deploy:</span>
                                <span id="last-deploy">-</span>
                            </div>
                        </div>
                        <button id="deploy-all-btn" class="btn btn-primary btn-block">
                            <i data-lucide="rocket"></i>
                            Deploy Todos os Códigos
                        </button>
                    </div>
                </div>

                <div class="deploy-card">
                    <div class="card-header">
                        <div class="card-title">
                            <i data-lucide="bar-chart-3"></i>
                            <h3>Estatísticas</h3>
                        </div>
                    </div>
                    <div class="card-body">
                        <div class="stats-grid">
                            <div class="stat-item">
                                <span class="stat-value" id="total-codes-stat">0</span>
                                <span class="stat-label">Total de Códigos</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-value" id="deployed-codes-stat">0</span>
                                <span class="stat-label">Deployados</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div id="deploy-history" class="deploy-history">
                <h3>Histórico de Deploy</h3>
                <div id="deploy-history-list">
                    <div class="loading-placeholder">Carregando histórico...</div>
                </div>
            </div>
        `;
    }

    getSettingsPageContent() {
        return `
            <div class="settings-sections">
                <div class="settings-section">
                    <h3>
                        <i data-lucide="settings"></i>
                        Configurações Gerais
                    </h3>
                    <div class="settings-grid">
                        <div class="setting-item">
                            <label class="setting-label">
                                <input type="checkbox" id="auto-minify" checked>
                                <span class="checkmark"></span>
                                Minificação automática
                            </label>
                            <small>Otimizar códigos automaticamente no deploy</small>
                        </div>
                        <div class="setting-item">
                            <label class="setting-label">
                                <input type="checkbox" id="auto-backup" checked>
                                <span class="checkmark"></span>
                                Backup automático
                            </label>
                            <small>Fazer backup antes de cada deploy</small>
                        </div>
                    </div>
                </div>

                <div class="settings-section">
                    <h3>
                        <i data-lucide="database"></i>
                        Armazenamento
                    </h3>
                    <div class="storage-info">
                        <div class="storage-item">
                            <span class="storage-label">Códigos salvos:</span>
                            <span id="storage-codes-count">0</span>
                        </div>
                        <div class="storage-item">
                            <span class="storage-label">Espaço usado:</span>
                            <span id="storage-size">0 KB</span>
                        </div>
                    </div>
                    <div class="storage-actions">
                        <button id="export-settings" class="btn btn-secondary">
                            <i data-lucide="download"></i>
                            Exportar Configurações
                        </button>
                        <button id="clear-storage" class="btn btn-danger">
                            <i data-lucide="trash-2"></i>
                            Limpar Armazenamento
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    get404Content() {
        return `
            <div class="empty-state">
                <i data-lucide="alert-triangle"></i>
                <h3>Página não encontrada</h3>
                <p>A página solicitada não existe ou foi movida.</p>
                <button data-page="overview" class="btn btn-primary">
                    <i data-lucide="home"></i>
                    Voltar ao Dashboard
                </button>
            </div>
        `;
    }

    // ===========================================
    // INICIALIZAÇÃO DAS PÁGINAS
    // ===========================================

    async initOverviewPage() {
        // Carregar estatísticas do overview
        try {
            const stats = await API.getDeployStats();
            if (stats.success) {
                document.getElementById('overview-codes-count').textContent = stats.stats.total;
                document.getElementById('overview-deployed-count').textContent = stats.stats.total - stats.stats.recent;
                document.getElementById('overview-performance').textContent = '85%';
            }
        } catch (error) {
            console.error('Erro ao carregar estatísticas:', error);
        }

        // Bind eventos do overview
        const quickNewCode = document.getElementById('quick-new-code');
        if (quickNewCode) {
            quickNewCode.addEventListener('click', () => {
                this.showPage('deploy-script-codes');
                setTimeout(() => {
                    // Disparar evento para abrir modal
                    window.dispatchEvent(new CustomEvent('openNewCodeModal'));
                }, 300);
            });
        }
    }

    async initCodesPage() {
        console.log('Inicializando página de códigos...');
        // A lógica específica será implementada no projeto Deploy Script
    }

    async initDeployPage() {
        console.log('Inicializando página de deploy...');
        // Carregar status e estatísticas de deploy
    }

    async initSettingsPage() {
        console.log('Inicializando página de configurações...');
        // Carregar configurações atuais
        this.loadSettingsData();
        this.bindSettingsEvents();
    }

    // ===========================================
    // UTILITÁRIOS
    // ===========================================

    /**
     * Atualizar breadcrumb
     */
    updateBreadcrumb(page) {
        const breadcrumbContainer = document.querySelector('.breadcrumb');
        if (!breadcrumbContainer) return;

        const breadcrumbMap = {
            'overview': ['Dashboard'],
            'deploy-script-codes': ['Deploy Script', 'Códigos'],
            'deploy-script-deploy': ['Deploy Script', 'Deploy'],
            'deploy-script-settings': ['Deploy Script', 'Configurações']
        };

        const items = breadcrumbMap[page] || ['Dashboard'];
        breadcrumbContainer.innerHTML = items.map((item, index) => {
            const isLast = index === items.length - 1;
            return isLast
                ? `<span class="breadcrumb-current">${item}</span>`
                : `<span class="breadcrumb-item">${item}</span>`;
        }).join('<span class="breadcrumb-separator">/</span>');
    }

    /**
     * Restaurar estado da aplicação
     */
    restoreState() {
        if (!Storage) return;

        // Restaurar sidebar
        const sidebarCollapsed = Storage.isSidebarCollapsed();
        if (sidebarCollapsed) {
            const sidebar = document.getElementById('sidebar');
            if (sidebar) {
                this.sidebarCollapsed = true;
                sidebar.classList.add('collapsed');
            }
        }

        // Restaurar projeto expandido
        const expandedProject = Storage.getSessionData('expandedProject');
        if (expandedProject) {
            setTimeout(() => {
                this.expandProject(expandedProject, false);
            }, 100);
        }
    }

    /**
     * Bind eventos globais
     */
    bindGlobalEvents() {
        // Atalhos de teclado globais
        document.addEventListener('keydown', (e) => {
            // ESC para fechar modais
            if (e.key === 'Escape') {
                window.dispatchEvent(new CustomEvent('closeAllModals'));
            }

            // Ctrl+N para novo código
            if (e.ctrlKey && e.key === 'n') {
                e.preventDefault();
                this.showPage('deploy-script-codes');
                setTimeout(() => {
                    window.dispatchEvent(new CustomEvent('openNewCodeModal'));
                }, 300);
            }

            // Ctrl+D para deploy
            if (e.ctrlKey && e.key === 'd') {
                e.preventDefault();
                this.showPage('deploy-script-deploy');
            }
        });

        // Redimensionamento da janela
        window.addEventListener('resize', () => {
            // Fechar menu mobile em telas grandes
            if (window.innerWidth > 768) {
                const sidebar = document.getElementById('sidebar');
                if (sidebar) {
                    sidebar.classList.remove('mobile-active');
                }
            }
        });
    }

    /**
     * Carregar dados das configurações
     */
    loadSettingsData() {
        if (!Storage) return;

        const stats = Storage.getStats();

        const codesCount = document.getElementById('storage-codes-count');
        const storageSize = document.getElementById('storage-size');
        const autoMinify = document.getElementById('auto-minify');
        const autoBackup = document.getElementById('auto-backup');

        if (codesCount) codesCount.textContent = stats.keysCount || 0;
        if (storageSize) storageSize.textContent = stats.sizeFormatted || '0 KB';

        // Carregar configurações
        const deploySettings = Storage.getDeploySettings();
        if (autoMinify) autoMinify.checked = deploySettings.autoMinify !== false;
        if (autoBackup) autoBackup.checked = deploySettings.autoBackup !== false;
    }

    /**
     * Bind eventos das configurações
     */
    bindSettingsEvents() {
        if (!Storage) return;

        // Salvar configurações automaticamente
        const autoMinify = document.getElementById('auto-minify');
        const autoBackup = document.getElementById('auto-backup');

        if (autoMinify) {
            autoMinify.addEventListener('change', (e) => {
                Storage.setDeploySettings({ autoMinify: e.target.checked });
                if (Toast) Toast.info('Configuração salva');
            });
        }

        if (autoBackup) {
            autoBackup.addEventListener('change', (e) => {
                Storage.setDeploySettings({ autoBackup: e.target.checked });
                if (Toast) Toast.info('Configuração salva');
            });
        }

        // Exportar configurações
        const exportBtn = document.getElementById('export-settings');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                const exportData = Storage.exportSettings();
                if (exportData.success) {
                    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `widgetvpn-dashboard-settings-${new Date().toISOString().split('T')[0]}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                    if (Toast) Toast.success('Configurações exportadas');
                }
            });
        }

        // Limpar armazenamento
        const clearBtn = document.getElementById('clear-storage');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                if (confirm('Tem certeza que deseja limpar todo o armazenamento? Esta ação não pode ser desfeita.')) {
                    Storage.clear();
                    if (Toast) Toast.warning('Armazenamento limpo');
                    setTimeout(() => window.location.reload(), 1000);
                }
            });
        }
    }
}

// Instância global
let Dashboard;

// Inicialização quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    Dashboard = new DashboardCore();
    window.Dashboard = Dashboard;
});

// Export para módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DashboardCore;
}