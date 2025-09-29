/**
 * Deploy Script Project
 * Gerenciamento de códigos CSS/JS individuais com deploy automático
 */
class DeployScriptProject {
    constructor() {
        this.codes = [];
        this.initialized = false;
        this.currentFilter = '';
        this.currentSearch = '';

        this.init();
    }

    /**
     * Inicialização do projeto
     */
    async init() {
        console.log('🚀 Inicializando Deploy Script Project');

        // Aguardar dependências
        if (!this.checkDependencies()) {
            setTimeout(() => this.init(), 100);
            return;
        }

        // Carregar códigos do storage
        await this.loadCodes();

        // Bind eventos globais
        this.bindGlobalEvents();

        this.initialized = true;
        console.log('✅ Deploy Script Project inicializado');
    }

    /**
     * Verificar dependências
     */
    checkDependencies() {
        const deps = {
            API: !!window.API,
            Toast: !!window.Toast,
            Storage: !!window.Storage,
            Dashboard: !!window.Dashboard
        };

        console.log('🔍 Deploy Script - Verificando dependências:', deps);

        return deps.API && deps.Toast && deps.Storage && deps.Dashboard;
    }

    /**
     * Bind eventos globais
     */
    bindGlobalEvents() {
        // Evento para abrir modal de novo código
        window.addEventListener('openNewCodeModal', () => {
            this.openCodeModal();
        });

        // Evento para fechar todos os modais
        window.addEventListener('closeAllModals', () => {
            this.closeCodeModal();
        });

        // Eventos das páginas específicas
        window.addEventListener('pageLoaded', (e) => {
            if (e.detail.page.startsWith('deploy-script-')) {
                this.handlePageLoad(e.detail.page);
            }
        });
    }

    /**
     * Lidar com carregamento de páginas
     */
    handlePageLoad(page) {
        switch (page) {
            case 'deploy-script-codes':
                this.initCodesPage();
                break;
            case 'deploy-script-deploy':
                this.initDeployPage();
                break;
        }
    }

    // ===========================================
    // GERENCIAMENTO DE CÓDIGOS
    // ===========================================

    /**
     * Carregar códigos do storage
     */
    async loadCodes() {
        try {
            const storedCodes = Storage.get('deploy_script_codes', []);
            this.codes = Array.isArray(storedCodes) ? storedCodes : [];
            console.log(`📄 Códigos carregados: ${this.codes.length}`);
        } catch (error) {
            console.error('❌ Erro ao carregar códigos:', error);
            this.codes = [];
        }
    }

    /**
     * Salvar códigos no storage
     */
    saveCodes() {
        try {
            Storage.set('deploy_script_codes', this.codes);
            console.log(`💾 Códigos salvos: ${this.codes.length}`);
        } catch (error) {
            console.error('❌ Erro ao salvar códigos:', error);
        }
    }

    /**
     * Criar novo código
     */
    createCode(codeData) {
        const code = {
            id: this.generateId(),
            name: codeData.name.trim(),
            content: codeData.content.trim(),
            type: codeData.type || this.detectCodeType(codeData.content),
            deployed: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            deployUrl: null,
            filename: null
        };

        // Gerar filename e URL
        code.filename = this.generateFilename(code);
        code.deployUrl = `https://philling-dev.github.io/loja-integrada-assets/assets/${code.filename}`;

        this.codes.push(code);
        this.saveCodes();

        return code;
    }

    /**
     * Atualizar código existente
     */
    updateCode(id, codeData) {
        const index = this.codes.findIndex(code => code.id === id);
        if (index === -1) return null;

        const existingCode = this.codes[index];

        this.codes[index] = {
            ...existingCode,
            name: codeData.name.trim(),
            content: codeData.content.trim(),
            type: codeData.type || this.detectCodeType(codeData.content),
            updatedAt: new Date().toISOString(),
            deployed: false // Reset deploy status
        };

        // Regerar filename
        this.codes[index].filename = this.generateFilename(this.codes[index]);
        this.codes[index].deployUrl = `https://philling-dev.github.io/loja-integrada-assets/assets/${this.codes[index].filename}`;

        this.saveCodes();
        return this.codes[index];
    }

    /**
     * Excluir código
     */
    deleteCode(id) {
        const index = this.codes.findIndex(code => code.id === id);
        if (index === -1) return false;

        this.codes.splice(index, 1);
        this.saveCodes();
        return true;
    }

    /**
     * Deploy individual de código
     */
    async deployCode(id) {
        const code = this.codes.find(c => c.id === id);
        if (!code) {
            Toast.error('Código não encontrado');
            return;
        }

        const loadingToast = Toast.loading(`Fazendo deploy de "${code.name}"...`);

        try {
            const result = await API.deployCode({
                filename: code.filename,
                content: code.content,
                type: code.type,
                codeId: code.id,
                codeName: code.name
            });

            Toast.hide(loadingToast);

            if (result.success) {
                // Atualizar status do código
                code.deployed = true;
                code.deployedAt = new Date().toISOString();
                this.saveCodes();

                Toast.success(`Deploy de "${code.name}" realizado com sucesso!`);

                // Atualizar interface se estamos na página de códigos
                if (Dashboard.currentPage === 'deploy-script-codes') {
                    this.renderCodesList();
                }
            } else {
                Toast.error(result.message || 'Erro no deploy');
            }
        } catch (error) {
            Toast.hide(loadingToast);
            Toast.error('Erro de conexão no deploy');
            console.error('Deploy error:', error);
        }
    }

    /**
     * Deploy em lote
     */
    async deployAllCodes() {
        const undeployedCodes = this.codes.filter(code => !code.deployed);

        if (undeployedCodes.length === 0) {
            Toast.info('Todos os códigos já estão deployados!');
            return;
        }

        const loadingToast = Toast.loading(`Fazendo deploy de ${undeployedCodes.length} códigos...`);

        try {
            let deployedCount = 0;
            let errorCount = 0;

            for (const code of undeployedCodes) {
                try {
                    const result = await API.deployCode({
                        filename: code.filename,
                        content: code.content,
                        type: code.type,
                        codeId: code.id,
                        codeName: code.name
                    });

                    if (result.success) {
                        code.deployed = true;
                        code.deployedAt = new Date().toISOString();
                        deployedCount++;
                    } else {
                        errorCount++;
                    }
                } catch (error) {
                    errorCount++;
                }

                // Pausa entre deploys
                await this.sleep(1000);
            }

            this.saveCodes();
            Toast.hide(loadingToast);

            if (deployedCount > 0) {
                Toast.success(`${deployedCount} códigos deployados com sucesso!`);
            }

            if (errorCount > 0) {
                Toast.warning(`${errorCount} códigos falharam no deploy`);
            }

            // Atualizar interface
            this.refreshCurrentPage();

        } catch (error) {
            Toast.hide(loadingToast);
            Toast.error('Erro no deploy em lote');
            console.error('Batch deploy error:', error);
        }
    }

    // ===========================================
    // INTERFACE - PÁGINA DE CÓDIGOS
    // ===========================================

    /**
     * Inicializar página de códigos
     */
    initCodesPage() {
        this.renderCodesList();
        this.bindCodesPageEvents();
    }

    /**
     * Renderizar lista de códigos
     */
    renderCodesList() {
        const container = document.getElementById('codes-list');
        if (!container) return;

        const filteredCodes = this.getFilteredCodes();

        if (filteredCodes.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i data-lucide="file-code"></i>
                    <h3>Nenhum código encontrado</h3>
                    <p>${this.codes.length > 0 ? 'Tente ajustar os filtros de busca.' : 'Adicione seu primeiro código para começar.'}</p>
                    <button id="empty-new-code" class="btn btn-primary">
                        <i data-lucide="plus"></i>
                        Adicionar Código
                    </button>
                </div>
            `;

            document.getElementById('empty-new-code')?.addEventListener('click', () => {
                this.openCodeModal();
            });

            return;
        }

        container.innerHTML = `
            <div class="codes-grid">
                ${filteredCodes.map(code => this.renderCodeCard(code)).join('')}
            </div>
        `;

        // Re-inicializar Lucide icons
        if (window.lucide) {
            lucide.createIcons({ nameAttr: 'data-lucide' });
        }
    }

    /**
     * Renderizar card individual de código
     */
    renderCodeCard(code) {
        const truncatedContent = code.content.length > 150
            ? code.content.substring(0, 150) + '...'
            : code.content;

        return `
            <div class="code-card" data-code-id="${code.id}">
                <div class="code-header">
                    <div class="code-title">
                        <h4>${code.name}</h4>
                        <div class="code-badges">
                            <span class="type-badge badge-${code.type}">${code.type.toUpperCase()}</span>
                            <span class="status-badge ${code.deployed ? 'status-deployed' : 'status-local'}">
                                ${code.deployed ? 'Deployado' : 'Local'}
                            </span>
                        </div>
                    </div>
                    <div class="code-actions">
                        <button class="btn btn-sm btn-secondary" onclick="DeployScript.editCode('${code.id}')" title="Editar">
                            <i data-lucide="edit"></i>
                        </button>
                        <button class="btn btn-sm btn-primary" onclick="DeployScript.deployCode('${code.id}')" title="Deploy">
                            <i data-lucide="rocket"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="DeployScript.confirmDeleteCode('${code.id}')" title="Excluir">
                            <i data-lucide="trash-2"></i>
                        </button>
                    </div>
                </div>

                <div class="code-preview">
                    <pre><code>${this.escapeHtml(truncatedContent)}</code></pre>
                </div>

                <div class="code-footer">
                    <div class="code-meta">
                        <small><i data-lucide="clock"></i> ${this.formatDate(code.updatedAt)}</small>
                        <small><i data-lucide="file-text"></i> ${this.formatBytes(code.content.length)}</small>
                    </div>
                    ${code.deployed && code.deployUrl ? `
                        <div class="code-deploy">
                            <a href="${code.deployUrl}" target="_blank" class="deploy-link">
                                <i data-lucide="external-link"></i>
                                Ver Online
                            </a>
                        </div>
                    ` : ''}
                </div>
                ${code.deployed && code.deployUrl ? `
                    <div class="code-snippet">
                        <label>Tag para usar na Loja Integrada:</label>
                        <div class="snippet-container">
                            <code class="snippet-code">${this.escapeHtml(this.generateHtmlTag(code))}</code>
                            <button class="btn btn-sm btn-secondary" onclick="DeployScript.copySnippet('${code.id}')" title="Copiar">
                                <i data-lucide="copy"></i>
                            </button>
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    /**
     * Bind eventos da página de códigos
     */
    bindCodesPageEvents() {
        // Botão novo código
        const newCodeBtn = document.getElementById('new-code-btn');
        if (newCodeBtn) {
            newCodeBtn.addEventListener('click', () => this.openCodeModal());
        }

        // Busca
        const searchInput = document.getElementById('codes-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.currentSearch = e.target.value.toLowerCase();
                this.renderCodesList();
            });
        }

        // Filtro por tipo
        const filterSelect = document.getElementById('codes-filter');
        if (filterSelect) {
            filterSelect.addEventListener('change', (e) => {
                this.currentFilter = e.target.value;
                this.renderCodesList();
            });
        }
    }

    /**
     * Obter códigos filtrados
     */
    getFilteredCodes() {
        return this.codes.filter(code => {
            const matchesSearch = !this.currentSearch ||
                code.name.toLowerCase().includes(this.currentSearch) ||
                code.content.toLowerCase().includes(this.currentSearch);

            const matchesFilter = !this.currentFilter || code.type === this.currentFilter;

            return matchesSearch && matchesFilter;
        });
    }

    // ===========================================
    // INTERFACE - PÁGINA DE DEPLOY
    // ===========================================

    /**
     * Inicializar página de deploy
     */
    async initDeployPage() {
        this.updateDeployStats();
        this.bindDeployPageEvents();
        await this.loadDeployHistory();
    }

    /**
     * Atualizar estatísticas de deploy
     */
    updateDeployStats() {
        const totalCodes = this.codes.length;
        const deployedCodes = this.codes.filter(code => code.deployed).length;

        document.getElementById('total-codes-stat').textContent = totalCodes;
        document.getElementById('deployed-codes-stat').textContent = deployedCodes;

        const lastDeployedCode = this.codes
            .filter(code => code.deployed && code.deployedAt)
            .sort((a, b) => new Date(b.deployedAt) - new Date(a.deployedAt))[0];

        if (lastDeployedCode) {
            document.getElementById('last-deploy').textContent =
                this.formatRelativeTime(lastDeployedCode.deployedAt);
        }
    }

    /**
     * Bind eventos da página de deploy
     */
    bindDeployPageEvents() {
        const deployAllBtn = document.getElementById('deploy-all-btn');
        if (deployAllBtn) {
            deployAllBtn.addEventListener('click', () => {
                this.deployAllCodes();
            });
        }
    }

    /**
     * Carregar histórico de deploy
     */
    async loadDeployHistory() {
        const historyContainer = document.getElementById('deploy-history-list');
        if (!historyContainer) return;

        const deployedCodes = this.codes
            .filter(code => code.deployed && code.deployedAt)
            .sort((a, b) => new Date(b.deployedAt) - new Date(a.deployedAt))
            .slice(0, 10); // Últimos 10

        if (deployedCodes.length === 0) {
            historyContainer.innerHTML = `
                <div class="empty-state">
                    <i data-lucide="clock"></i>
                    <p>Nenhum deploy realizado ainda</p>
                </div>
            `;
            return;
        }

        historyContainer.innerHTML = deployedCodes.map(code => `
            <div class="deploy-history-item">
                <div class="deploy-info">
                    <div class="deploy-name">${code.name}</div>
                    <div class="deploy-meta">
                        <span class="type-badge badge-${code.type}">${code.type}</span>
                        <span class="deploy-time">${this.formatRelativeTime(code.deployedAt)}</span>
                    </div>
                </div>
                <div class="deploy-actions">
                    ${code.deployUrl ? `
                        <a href="${code.deployUrl}" target="_blank" class="deploy-link">
                            <i data-lucide="external-link"></i>
                        </a>
                    ` : ''}
                </div>
            </div>
        `).join('');

        if (window.lucide) {
            lucide.createIcons({ nameAttr: 'data-lucide' });
        }
    }

    // ===========================================
    // MODAL DE CÓDIGO
    // ===========================================

    /**
     * Abrir modal de código
     */
    openCodeModal(code = null) {
        this.createCodeModal(code);
    }

    /**
     * Criar modal de código
     */
    createCodeModal(code = null) {
        const isEdit = !!code;
        const modalId = 'code-modal';

        // Remover modal existente
        const existingModal = document.getElementById(modalId);
        if (existingModal) {
            existingModal.remove();
        }

        const modal = document.createElement('div');
        modal.id = modalId;
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>${isEdit ? 'Editar Código' : 'Novo Código'}</h3>
                        <button type="button" class="modal-close" onclick="DeployScript.closeCodeModal()">
                            <i data-lucide="x"></i>
                        </button>
                    </div>
                    <form id="code-form">
                        <div class="modal-body">
                            <div class="form-group">
                                <label for="code-name">Nome do Código</label>
                                <input type="text" id="code-name" name="name" value="${isEdit ? code.name : ''}" required
                                       placeholder="Ex: Dropdown Menu Principal" class="form-control">
                            </div>
                            <div class="form-group">
                                <label for="code-content">Código</label>
                                <textarea id="code-content" name="content" required
                                          placeholder="Cole seu código CSS ou JavaScript aqui..."
                                          class="form-control code-textarea">${isEdit ? code.content : ''}</textarea>
                            </div>
                            <div class="form-group">
                                <label for="code-type">Tipo</label>
                                <select id="code-type" name="type" class="form-select">
                                    <option value="css" ${isEdit && code.type === 'css' ? 'selected' : ''}>CSS</option>
                                    <option value="js" ${isEdit && code.type === 'js' ? 'selected' : ''}>JavaScript</option>
                                </select>
                                <small class="form-hint">Será detectado automaticamente baseado no conteúdo</small>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" onclick="DeployScript.closeCodeModal()">
                                Cancelar
                            </button>
                            <button type="submit" class="btn btn-primary">
                                <i data-lucide="save"></i>
                                ${isEdit ? 'Atualizar' : 'Criar'} Código
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Mostrar modal
        setTimeout(() => {
            modal.classList.add('active');
            document.getElementById('code-name').focus();
        }, 10);

        // Bind eventos
        this.bindModalEvents(modal, code);

        // Inicializar Lucide icons
        if (window.lucide) {
            lucide.createIcons({ nameAttr: 'data-lucide' });
        }
    }

    /**
     * Bind eventos do modal
     */
    bindModalEvents(modal, code = null) {
        const form = modal.querySelector('#code-form');
        const contentTextarea = modal.querySelector('#code-content');
        const typeSelect = modal.querySelector('#code-type');

        // Submit do formulário
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleCodeSubmit(form, code);
        });

        // Auto-detecção de tipo
        contentTextarea.addEventListener('input', () => {
            const content = contentTextarea.value;
            const detectedType = this.detectCodeType(content);
            typeSelect.value = detectedType;
        });

        // Fechar modal ao clicar fora
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeCodeModal();
            }
        });

        // Atalhos de teclado
        modal.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeCodeModal();
            }
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                form.dispatchEvent(new Event('submit'));
            }
        });
    }

    /**
     * Lidar com submit do código
     */
    handleCodeSubmit(form, existingCode = null) {
        const formData = new FormData(form);
        const codeData = {
            name: formData.get('name'),
            content: formData.get('content'),
            type: formData.get('type')
        };

        // Validação
        if (!codeData.name || !codeData.content) {
            Toast.error('Preencha todos os campos obrigatórios');
            return;
        }

        try {
            if (existingCode) {
                this.updateCode(existingCode.id, codeData);
                Toast.success('Código atualizado com sucesso!');
            } else {
                this.createCode(codeData);
                Toast.success('Código criado com sucesso!');
            }

            this.closeCodeModal();
            this.refreshCurrentPage();

        } catch (error) {
            Toast.error('Erro ao salvar código');
            console.error('Save code error:', error);
        }
    }

    /**
     * Fechar modal de código
     */
    closeCodeModal() {
        const modal = document.getElementById('code-modal');
        if (modal) {
            modal.classList.remove('active');
            setTimeout(() => modal.remove(), 300);
        }
    }

    /**
     * Editar código
     */
    editCode(id) {
        const code = this.codes.find(c => c.id === id);
        if (code) {
            this.openCodeModal(code);
        }
    }

    /**
     * Confirmar exclusão de código
     */
    confirmDeleteCode(id) {
        const code = this.codes.find(c => c.id === id);
        if (!code) return;

        if (confirm(`Tem certeza que deseja excluir "${code.name}"?`)) {
            if (this.deleteCode(id)) {
                Toast.success('Código excluído com sucesso!');
                this.refreshCurrentPage();
            }
        }
    }

    // ===========================================
    // UTILITÁRIOS
    // ===========================================

    /**
     * Atualizar página atual
     */
    refreshCurrentPage() {
        const currentPage = Dashboard.currentPage;
        if (currentPage.startsWith('deploy-script-')) {
            this.handlePageLoad(currentPage);
        }
    }

    /**
     * Detectar tipo de código
     */
    detectCodeType(content) {
        if (content.includes('{') && (content.includes(':') || content.includes('@media') || content.includes('!important'))) {
            return 'css';
        }
        if (content.includes('function') || content.includes('$(') || content.includes('document.') || content.includes('console.')) {
            return 'js';
        }
        return 'css'; // Default
    }

    /**
     * Gerar filename
     */
    generateFilename(code) {
        const cleanName = code.name.toLowerCase()
            .replace(/[^a-z0-9]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');

        const ext = code.type === 'css' ? 'css' : 'js';
        return `${cleanName}-${code.id.substring(0, 8)}.min.${ext}`;
    }

    /**
     * Gerar ID único
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    /**
     * Formatar data
     */
    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('pt-BR');
    }

    /**
     * Formatar tempo relativo
     */
    formatRelativeTime(dateString) {
        const now = new Date();
        const date = new Date(dateString);
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Agora há pouco';
        if (diffMins < 60) return `Há ${diffMins} minutos`;
        if (diffHours < 24) return `Há ${diffHours} horas`;
        return `Há ${diffDays} dias`;
    }

    /**
     * Formatar bytes
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    /**
     * Escapar HTML
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Sleep utility
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Gerar tag HTML (script ou link) baseado no tipo
     */
    generateHtmlTag(code) {
        if (code.type === 'css') {
            return `<link rel="stylesheet" href="${code.deployUrl}">`;
        } else {
            return `<script src="${code.deployUrl}"></script>`;
        }
    }

    /**
     * Copiar snippet para clipboard
     */
    async copySnippet(id) {
        const code = this.codes.find(c => c.id === id);
        if (!code) return;

        const snippet = this.generateHtmlTag(code);

        try {
            await navigator.clipboard.writeText(snippet);
            Toast.success('Tag copiada para a área de transferência!');
        } catch (error) {
            // Fallback para navegadores antigos
            const textarea = document.createElement('textarea');
            textarea.value = snippet;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            Toast.success('Tag copiada para a área de transferência!');
        }
    }
}

// Instância global
let DeployScript;

// Inicialização quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    DeployScript = new DeployScriptProject();
    window.DeployScript = DeployScript;
});

// Export para módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DeployScriptProject;
}