// Simple SPA Router with URL persistence
class Dashboard {
    constructor() {
        this.currentPage = 'dashboard';
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadFromUrl();
    }

    // Load page from URL hash or localStorage
    loadFromUrl() {
        const urlHash = window.location.hash.slice(1);
        const savedPage = localStorage.getItem('dashboard-current-page');
        const pageToLoad = urlHash || savedPage || 'dashboard';
        this.showPage(pageToLoad);
    }

    // Save current page state
    savePageState(page) {
        localStorage.setItem('dashboard-current-page', page);
        window.location.hash = page;
    }

    bindEvents() {
        // Navigation
        document.addEventListener('click', (e) => {
            const navItem = e.target.closest('[data-page]');
            if (navItem && !navItem.classList.contains('disabled')) {
                e.preventDefault();
                const page = navItem.getAttribute('data-page');
                this.showPage(page);

                // Close mobile menu on navigation
                if (window.innerWidth <= 768) {
                    const sidebar = document.getElementById('sidebar');
                    const overlay = document.getElementById('mobileOverlay');
                    if (sidebar) sidebar.classList.remove('active');
                    if (overlay) overlay.classList.remove('active');
                }
            }
        });

        // Mobile menu
        const mobileBtn = document.getElementById('mobileMenuBtn');
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('mobileOverlay');

        if (mobileBtn) {
            mobileBtn.addEventListener('click', () => {
                sidebar.classList.toggle('active');
                overlay.classList.toggle('active');
            });
        }

        if (overlay) {
            overlay.addEventListener('click', () => {
                sidebar.classList.remove('active');
                overlay.classList.remove('active');
            });
        }

        // Listen for URL hash changes (browser back/forward)
        window.addEventListener('hashchange', () => {
            this.loadFromUrl();
        });
    }

    // Project toggle functionality
    toggleProject(projectId, forceOpen = false) {
        const projectGroup = document.querySelector(`[data-project="${projectId}"]`);

        if (!projectGroup) return;

        const isExpanded = projectGroup.classList.contains('expanded');

        // If forcing open (from navigation), just expand this project
        if (forceOpen) {
            // Close all other projects first
            document.querySelectorAll('.nav-group').forEach(group => {
                group.classList.remove('expanded');
            });

            // Open this project
            projectGroup.classList.add('expanded');
            return;
        }

        // Normal toggle behavior
        if (isExpanded) {
            // Close this project
            projectGroup.classList.remove('expanded');
        } else {
            // Close all other projects first
            document.querySelectorAll('.nav-group').forEach(group => {
                group.classList.remove('expanded');
            });

            // Open this project
            projectGroup.classList.add('expanded');
        }
    }

    showPage(page) {
        // Update navigation - remove all active states
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });

        // Auto-expand and highlight project if accessing submenu
        if (page.includes('script-')) {
            this.toggleProject('script-deploy', true);

            // Keep project header highlighted when in submenu
            const projectHeader = document.querySelector('[data-project="script-deploy"] .project-header');
            if (projectHeader) {
                projectHeader.classList.add('active');
            }
        }

        // Set active state on current page
        const activeItem = document.querySelector(`[data-page="${page}"]`);
        if (activeItem) {
            activeItem.classList.add('active');
        }

        // Update title
        const titles = {
            'dashboard': 'Dashboard Multi-Projetos',
            'script-codes': 'Script Deploy - Códigos',
            'script-deploy': 'Script Deploy - Deploy & Status',
            'script-settings': 'Script Deploy - Configurações',
            'system-settings': 'Sistema - Configurações',
            'system-logs': 'Sistema - Logs'
        };

        document.getElementById('pageTitle').textContent = titles[page] || 'Dashboard';

        // Save page state for persistence
        this.savePageState(page);

        // Load content
        this.loadContent(page);
    }

    loadContent(page) {
        const content = document.getElementById('mainContent');

        const pages = {
            'dashboard': window.PageTemplates?.getDashboardContent() || this.getDashboardContent(),
            'script-codes': window.PageTemplates?.getScriptCodesContent() || this.getScriptCodesContent(),
            'script-deploy': window.PageTemplates?.getScriptDeployContent() || this.getScriptDeployContent(),
            'script-settings': window.PageTemplates?.getScriptSettingsContent() || this.getScriptSettingsContent(),
            'system-settings': window.PageTemplates?.getSystemSettingsContent() || this.getSystemSettingsContent(),
            'system-logs': window.PageTemplates?.getSystemLogsContent() || this.getSystemLogsContent()
        };

        content.innerHTML = pages[page] || pages['dashboard'];
        this.currentPage = page;

        // Load codes if on script-codes page
        if (page === 'script-codes') {
            setTimeout(() => this.loadExistingCodes(), 100);
        }
    }

    // Fallback content methods
    getDashboardContent() {
        return `
            <div class="card-grid">
                <div class="card">
                    <div class="card-header">
                        <div>
                            <div class="card-title">💻 Script Deploy</div>
                            <div class="card-subtitle">Sistema de deployment de códigos CSS/JS</div>
                        </div>
                    </div>
                    <div class="metric">
                        <div class="metric-value" style="color: var(--green-500);">Ativo</div>
                        <div class="metric-label">status</div>
                    </div>
                    <div class="metric">
                        <div class="metric-value" id="dash-total-codes">-</div>
                        <div class="metric-label">códigos deployados</div>
                    </div>
                    <a href="#" class="btn btn-primary" data-page="script-codes">
                        <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clip-rule="evenodd"/>
                        </svg>
                        Gerenciar Códigos
                    </a>
                </div>
            </div>
        `;
    }

    getScriptCodesContent() {
        return `
            <div class="card">
                <div class="card-header">
                    <div>
                        <div class="card-title">Gerenciar Códigos</div>
                        <div class="card-subtitle">CSS e JavaScript para deploy</div>
                    </div>
                </div>
                <div id="deployResult" style="margin-bottom: 24px;"></div>
                <div id="existingCodesContainer">
                    <div style="text-align: center; padding: 40px; color: var(--gray-500);">
                        <div>Carregando códigos...</div>
                    </div>
                </div>
            </div>
        `;
    }

    getScriptDeployContent() {
        return `
            <div class="card">
                <div class="card-header">
                    <div>
                        <div class="card-title">🚀 Deploy & Status</div>
                        <div class="card-subtitle">Sistema de deployment</div>
                    </div>
                </div>
                <div id="deployResult"></div>
            </div>
        `;
    }

    getScriptSettingsContent() {
        return `
            <div class="card">
                <div class="card-header">
                    <div>
                        <div class="card-title">⚙️ Configurações</div>
                        <div class="card-subtitle">Configurações do script deploy</div>
                    </div>
                </div>
                <p>Configurações em desenvolvimento...</p>
            </div>
        `;
    }

    getSystemSettingsContent() {
        return `
            <div class="card">
                <div class="card-header">
                    <div>
                        <div class="card-title">🔧 Sistema</div>
                        <div class="card-subtitle">Configurações globais</div>
                    </div>
                </div>
                <p>Configurações em desenvolvimento...</p>
            </div>
        `;
    }

    getSystemLogsContent() {
        return `
            <div class="card">
                <div class="card-header">
                    <div>
                        <div class="card-title">📋 Logs</div>
                        <div class="card-subtitle">Histórico de atividades</div>
                    </div>
                </div>
                <p>Logs em desenvolvimento...</p>
            </div>
        `;
    }

    // Load existing codes functionality
    async loadExistingCodes() {
        console.log('🔄 loadExistingCodes called');
        const container = document.getElementById('existingCodesContainer');
        if (!container) {
            console.warn('❌ existingCodesContainer not found');
            return;
        }

        // Show loading with spinner
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: var(--gray-500);">
                <div class="loading-spinner" style="width: 24px; height: 24px; border: 2px solid var(--gray-300); border-top: 2px solid var(--blue-500); border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 16px;"></div>
                <div>Carregando códigos deployados...</div>
            </div>
        `;

        try {
            console.log('🌐 Fetching from GitHub Pages...');
            const response = await fetch('https://philling-dev.github.io/loja-integrada-assets/assets/index.json');

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('📦 Data received:', data);

            if (!data || typeof data !== 'object') {
                throw new Error('Invalid data format received');
            }

            const codes = Object.values(data);
            console.log(`✅ Found ${codes.length} codes`);

            if (codes.length === 0) {
                container.innerHTML = `
                    <div style="text-align: center; padding: 40px; color: var(--gray-500);">
                        <svg width="48" height="48" fill="currentColor" viewBox="0 0 20 20" style="margin-bottom: 16px; opacity: 0.5;">
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                            <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd"/>
                        </svg>
                        <div>Nenhum código encontrado</div>
                        <div style="margin-top: 8px; font-size: 14px;">Clique em "Novo Código" para criar o primeiro</div>
                    </div>
                `;
                return;
            }

            // Sort by deployed date (newest first)
            codes.sort((a, b) => new Date(b.deployedAt) - new Date(a.deployedAt));

            // Group by type
            const cssFiles = codes.filter(code => code.type === 'css');
            const jsFiles = codes.filter(code => code.type === 'js');

            let html = `
                <div style="margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center;">
                    <div style="font-size: 18px; font-weight: 600; color: var(--gray-900);">
                        📁 Total: ${codes.length} códigos deployados
                    </div>
                    <button onclick="window.dashboardInstance.loadExistingCodes()" class="btn btn-secondary" style="padding: 8px 16px; font-size: 12px;">
                        <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd"/>
                        </svg>
                        Atualizar
                    </button>
                </div>
            `;

            if (cssFiles.length > 0) {
                html += `
                    <div style="margin-bottom: 32px;">
                        <h3 style="margin-bottom: 16px; color: var(--gray-700); font-size: 16px; font-weight: 600; display: flex; align-items: center;">
                            <span style="background: linear-gradient(135deg, #2563eb, #3b82f6); background-clip: text; -webkit-background-clip: text; color: transparent;">
                                🎨 CSS Files (${cssFiles.length})
                            </span>
                        </h3>
                        <div style="display: grid; gap: 12px;">
                            ${cssFiles.map(code => this.renderCodeItem(code)).join('')}
                        </div>
                    </div>
                `;
            }

            if (jsFiles.length > 0) {
                html += `
                    <div style="margin-bottom: 16px;">
                        <h3 style="margin-bottom: 16px; color: var(--gray-700); font-size: 16px; font-weight: 600; display: flex; align-items: center;">
                            <span style="background: linear-gradient(135deg, #f59e0b, #f97316); background-clip: text; -webkit-background-clip: text; color: transparent;">
                                ⚡ JavaScript Files (${jsFiles.length})
                            </span>
                        </h3>
                        <div style="display: grid; gap: 12px;">
                            ${jsFiles.map(code => this.renderCodeItem(code)).join('')}
                        </div>
                    </div>
                `;
            }

            container.innerHTML = html;
            console.log('✅ Codes loaded successfully');

        } catch (error) {
            console.error('❌ Error loading codes:', error);
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: var(--red-500);">
                    <svg width="48" height="48" fill="currentColor" viewBox="0 0 20 20" style="margin-bottom: 16px; opacity: 0.5;">
                        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
                    </svg>
                    <div>❌ Erro ao carregar códigos</div>
                    <div style="margin-top: 8px; font-size: 14px; color: var(--gray-600);">${error.message}</div>
                    <button onclick="window.dashboardInstance.loadExistingCodes()" class="btn btn-secondary" style="margin-top: 16px;">
                        🔄 Tentar Novamente
                    </button>
                </div>
            `;
        }
    }

    renderCodeItem(code) {
        const deployedDate = new Date(code.deployedAt).toLocaleString('pt-BR');
        const sizeKB = (code.size / 1024).toFixed(1);
        const typeColor = code.type === 'css' ? '#3b82f6' : '#f97316';

        return `
            <div style="border: 1px solid var(--gray-200); border-radius: var(--border-radius); padding: 16px; background: white;">
                <div style="display: flex; align-items: center; margin-bottom: 8px;">
                    <span style="background: ${typeColor}; color: white; padding: 3px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; margin-right: 12px;">
                        ${code.type.toUpperCase()}
                    </span>
                    <strong>${code.name}</strong>
                </div>
                <div style="font-size: 12px; color: var(--gray-500); margin-bottom: 8px;">
                    📅 ${deployedDate} | 📦 ${sizeKB}KB
                </div>
                <div style="font-size: 11px; color: var(--gray-400); word-break: break-all;">
                    🔗 ${code.url}
                </div>
            </div>
        `;
    }
}

// Global project toggle function for inline onClick handlers
function toggleProject(projectId) {
    if (window.dashboardInstance) {
        window.dashboardInstance.toggleProject(projectId);
    }
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Dashboard;
}