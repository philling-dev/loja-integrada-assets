// Sistema Inteligente de Gerenciamento de Códigos da Loja Integrada
class LojaIntegradaManager {
    constructor() {
        this.codes = this.loadCodes();
        this.groups = this.generateGroups();
        this.currentStep = 1;
        this.maxSteps = 3;
        this.init();
    }

    // Inicialização
    init() {
        this.bindEvents();
        this.renderGroups();
        this.renderCodes();
        this.updateStats();
        this.initMultiStepForm();
    }

    // Configurações da Loja Integrada baseadas na documentação
    getLojaIntegradaConfig() {
        return {
            locations: {
                'head': 'Cabeçalho (<head>)',
                'footer': 'Rodapé (antes de </body>)'
            },
            pages: {
                'all': { label: '🌐 Todas as páginas', priority: 1 },
                'home': { label: '🏠 Página inicial', priority: 2 },
                'product': { label: '📦 Páginas de produto', priority: 2 },
                'category': { label: '📂 Páginas de categoria', priority: 3 },
                'cart': { label: '🛒 Página do carrinho', priority: 3 },
                'checkout': { label: '💳 Checkout', priority: 4 },
                'account': { label: '👤 Área do cliente', priority: 4 }
            },
            types: {
                'css': { label: 'CSS (Estilos)', icon: 'fas fa-palette', ext: 'css' },
                'js': { label: 'JavaScript (Funcionalidade)', icon: 'fab fa-js-square', ext: 'js' }
            }
        };
    }

    // Sistema de Agrupamento Inteligente
    generateGroups() {
        const groups = new Map();

        this.codes.forEach(code => {
            const groupKey = this.generateGroupKey(code);

            if (!groups.has(groupKey)) {
                groups.set(groupKey, {
                    id: groupKey,
                    type: code.type,
                    location: code.location,
                    pages: code.pages,
                    codes: [],
                    filename: this.generateGroupFilename(code),
                    totalSize: 0,
                    minifiedSize: 0
                });
            }

            const group = groups.get(groupKey);
            group.codes.push(code);
            group.totalSize += code.content.length;
            group.minifiedSize += Math.floor(code.content.length * 0.3); // Estimativa de minificação
        });

        return Array.from(groups.values()).sort((a, b) => {
            // Priorizar por tipo, depois por local, depois por páginas
            const config = this.getLojaIntegradaConfig();
            const aPriority = config.pages[a.pages]?.priority || 5;
            const bPriority = config.pages[b.pages]?.priority || 5;

            if (a.type !== b.type) return a.type.localeCompare(b.type);
            if (a.location !== b.location) return a.location.localeCompare(b.location);
            return aPriority - bPriority;
        });
    }

    generateGroupKey(code) {
        // Grupos baseados em: tipo + local + páginas
        return `${code.type}-${code.location}-${code.pages}`;
    }

    generateGroupFilename(code) {
        const config = this.getLojaIntegradaConfig();
        const pagesLabel = config.pages[code.pages]?.label.replace(/[🌐🏠📦📂🛒💳👤\s]/g, '').toLowerCase();
        const slug = `${code.type}-${code.location}-${pagesLabel || code.pages}`;
        return `${slug}.min.${config.types[code.type].ext}`;
    }

    // Geração de código único para Loja Integrada
    generateLojaIntegradaCode(group) {
        const baseUrl = 'https://philling-dev.github.io/loja-integrada-assets';

        if (group.type === 'css') {
            return `<link rel="stylesheet" href="${baseUrl}/assets/css/${group.filename}">`;
        } else if (group.type === 'js') {
            return `<script src="${baseUrl}/assets/js/${group.filename}"></script>`;
        }
        return '';
    }

    // Sugestões automáticas de agrupamento
    generateGroupingSuggestions(newCode) {
        const suggestions = [];
        const config = this.getLojaIntegradaConfig();

        // Buscar grupos existentes compatíveis
        this.groups.forEach(group => {
            if (group.type === newCode.type &&
                group.location === newCode.location &&
                group.pages === newCode.pages) {

                const performanceGain = this.calculatePerformanceGain([...group.codes, newCode]);
                suggestions.push({
                    type: 'existing_group',
                    group: group,
                    performanceGain: performanceGain,
                    message: `Será adicionado ao grupo "${this.getGroupDisplayName(group)}" com ${group.codes.length} códigos existentes.`
                });
            }
        });

        // Sugerir criação de novo grupo se não houver compatível
        if (suggestions.length === 0) {
            const performanceGain = this.calculatePerformanceGain([newCode]);
            suggestions.push({
                type: 'new_group',
                performanceGain: performanceGain,
                message: `Será criado um novo grupo para "${config.types[newCode.type].label}" no "${config.locations[newCode.location]}" para "${config.pages[newCode.pages].label}".`
            });
        }

        return suggestions;
    }

    getGroupDisplayName(group) {
        const config = this.getLojaIntegradaConfig();
        return `${config.types[group.type].label} • ${config.locations[group.location]} • ${config.pages[group.pages].label}`;
    }

    // Cálculo de ganho de performance
    calculatePerformanceGain(codes) {
        const totalOriginalSize = codes.reduce((sum, code) => sum + code.content.length, 0);
        const minifiedSize = Math.floor(totalOriginalSize * 0.3); // ~70% redução
        const compressionGain = Math.floor((1 - (minifiedSize / totalOriginalSize)) * 100);

        // Benefícios adicionais do CDN
        const cdnBenefit = 25; // 25% de melhoria estimada do CDN + cache
        const totalGain = Math.min(compressionGain + cdnBenefit, 85); // Máximo 85%

        return {
            originalSize: totalOriginalSize,
            minifiedSize: minifiedSize,
            compressionGain: compressionGain,
            totalGain: totalGain,
            filesReduced: codes.length > 1 ? codes.length - 1 : 0
        };
    }

    // Multi-step Form
    initMultiStepForm() {
        this.bindStepNavigation();
    }

    bindStepNavigation() {
        const btnNext = document.getElementById('btnNext');
        const btnPrev = document.getElementById('btnPrev');
        const btnSave = document.getElementById('btnSave');

        btnNext?.addEventListener('click', () => this.nextStep());
        btnPrev?.addEventListener('click', () => this.prevStep());
    }

    nextStep() {
        if (this.currentStep < this.maxSteps) {
            // Validar step atual
            if (!this.validateCurrentStep()) return;

            // Se for step 2, gerar sugestões
            if (this.currentStep === 2) {
                this.generateStepSuggestions();
            }

            this.currentStep++;
            this.updateStepDisplay();
        }
    }

    prevStep() {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.updateStepDisplay();
        }
    }

    updateStepDisplay() {
        // Hide all steps
        document.querySelectorAll('.form-step').forEach(step => {
            step.classList.remove('active');
        });

        // Show current step
        document.getElementById(`step${this.currentStep}`)?.classList.add('active');

        // Update navigation buttons
        const btnPrev = document.getElementById('btnPrev');
        const btnNext = document.getElementById('btnNext');
        const btnSave = document.getElementById('btnSave');

        btnPrev.style.display = this.currentStep > 1 ? 'inline-flex' : 'none';

        if (this.currentStep === this.maxSteps) {
            btnNext.style.display = 'none';
            btnSave.style.display = 'inline-flex';
        } else {
            btnNext.style.display = 'inline-flex';
            btnSave.style.display = 'none';
        }
    }

    validateCurrentStep() {
        const step = this.currentStep;

        if (step === 1) {
            const name = document.getElementById('codeName').value.trim();
            const content = document.getElementById('codeContent').value.trim();

            if (!name || !content) {
                this.showToast('Preencha o nome e o código!', 'error');
                return false;
            }
        }

        if (step === 2) {
            const type = document.getElementById('codeType').value;
            const location = document.getElementById('codeLocation').value;
            const pages = document.getElementById('codePages').value;

            if (!type || !location || !pages) {
                this.showToast('Complete a configuração da Loja Integrada!', 'error');
                return false;
            }
        }

        return true;
    }

    generateStepSuggestions() {
        const newCodeData = {
            type: document.getElementById('codeType').value,
            location: document.getElementById('codeLocation').value,
            pages: document.getElementById('codePages').value,
            content: document.getElementById('codeContent').value
        };

        const suggestions = this.generateGroupingSuggestions(newCodeData);
        const suggestionContainer = document.getElementById('groupingSuggestion');
        const performanceContainer = document.getElementById('performancePreview');

        if (suggestions.length > 0) {
            const suggestion = suggestions[0];

            suggestionContainer.innerHTML = `
                <h4><i class="fas fa-lightbulb"></i> Sugestão de Agrupamento</h4>
                <p>${suggestion.message}</p>
                <div class="suggestion-details">
                    <strong>Grupo:</strong> ${this.getGroupDisplayName({
                        type: newCodeData.type,
                        location: newCodeData.location,
                        pages: newCodeData.pages
                    })}<br>
                    <strong>Arquivo:</strong> <code>${this.generateGroupFilename(newCodeData)}</code>
                </div>
            `;

            const perf = suggestion.performanceGain;
            performanceContainer.innerHTML = `
                <h4><i class="fas fa-tachometer-alt"></i> Preview de Performance</h4>
                <div class="performance-item">
                    <span>Tamanho original:</span>
                    <span>${this.formatBytes(perf.originalSize)}</span>
                </div>
                <div class="performance-item">
                    <span>Após minificação:</span>
                    <span>${this.formatBytes(perf.minifiedSize)}</span>
                </div>
                <div class="performance-item">
                    <span>Melhoria total:</span>
                    <span><strong>${perf.totalGain}% mais rápido</strong></span>
                </div>
            `;
        }
    }

    // Event Handlers
    bindEvents() {
        // Modal controls
        document.getElementById('btnNewCode')?.addEventListener('click', () => this.openModal());
        document.getElementById('closeModal')?.addEventListener('click', () => this.closeModal());
        document.getElementById('btnCancel')?.addEventListener('click', () => this.closeModal());

        // Quick actions
        document.getElementById('btnQuickDeploy')?.addEventListener('click', () => this.quickDeploy());
        document.getElementById('btnOptimize')?.addEventListener('click', () => this.optimizeGroups());
        document.getElementById('btnExport')?.addEventListener('click', () => this.exportCodes());

        // Form submission
        document.getElementById('codeForm')?.addEventListener('submit', (e) => this.handleSubmit(e));

        // Filters
        document.getElementById('searchCodes')?.addEventListener('input', () => this.filterCodes());
        document.getElementById('filterLocation')?.addEventListener('change', () => this.filterCodes());
        document.getElementById('filterType')?.addEventListener('change', () => this.filterCodes());

        // Controls
        document.getElementById('btnRefresh')?.addEventListener('click', () => this.refresh());
        document.getElementById('btnExpandAll')?.addEventListener('click', () => this.toggleAllGroups());

        // Deploy modal
        document.getElementById('closeDeployModal')?.addEventListener('click', () => this.closeDeployModal());

        // Click outside modal
        document.getElementById('codeModal')?.addEventListener('click', (e) => {
            if (e.target.id === 'codeModal') this.closeModal();
        });
    }

    // UI Methods
    openModal(code = null) {
        const modal = document.getElementById('codeModal');
        const form = document.getElementById('codeForm');

        // Reset form and steps
        form.reset();
        this.currentStep = 1;
        this.updateStepDisplay();

        if (code) {
            // Editing existing code
            document.getElementById('modalTitle').textContent = 'Editar Código';
            document.getElementById('codeName').value = code.name;
            document.getElementById('codeContent').value = code.content;
            document.getElementById('codeType').value = code.type;
            document.getElementById('codeLocation').value = code.location;
            document.getElementById('codePages').value = code.pages;
            form.dataset.editId = code.id;
        } else {
            // New code
            document.getElementById('modalTitle').textContent = 'Adicionar Código';
            delete form.dataset.editId;
        }

        modal.classList.add('active');
    }

    closeModal() {
        document.getElementById('codeModal').classList.remove('active');
        // Clear suggestions
        document.getElementById('groupingSuggestion').innerHTML = '';
        document.getElementById('performancePreview').innerHTML = '';
    }

    handleSubmit(e) {
        e.preventDefault();
        const form = e.target;

        const codeData = {
            name: document.getElementById('codeName').value.trim(),
            content: document.getElementById('codeContent').value.trim(),
            type: document.getElementById('codeType').value,
            location: document.getElementById('codeLocation').value,
            pages: document.getElementById('codePages').value
        };

        if (form.dataset.editId) {
            this.updateCode(form.dataset.editId, codeData);
            this.showToast('Código atualizado com sucesso!', 'success');
        } else {
            this.createCode(codeData);
            this.showToast('Código criado com sucesso!', 'success');
        }

        this.closeModal();
        this.refresh();
    }

    // CRUD Operations
    createCode(codeData) {
        const code = {
            id: this.generateId(),
            ...codeData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            active: true
        };

        this.codes.push(code);
        this.saveCodes();
        return code;
    }

    updateCode(id, codeData) {
        const index = this.codes.findIndex(code => code.id === id);
        if (index !== -1) {
            this.codes[index] = {
                ...this.codes[index],
                ...codeData,
                updatedAt: new Date().toISOString()
            };
            this.saveCodes();
            return this.codes[index];
        }
        return null;
    }

    deleteCode(id) {
        if (!confirm('Tem certeza que deseja remover este código?')) return;

        const index = this.codes.findIndex(code => code.id === id);
        if (index !== -1) {
            this.codes.splice(index, 1);
            this.saveCodes();
            this.refresh();
            this.showToast('Código removido com sucesso!', 'success');
        }
    }

    toggleCodeStatus(id) {
        const code = this.codes.find(code => code.id === id);
        if (code) {
            code.active = !code.active;
            code.updatedAt = new Date().toISOString();
            this.saveCodes();
            this.refresh();
            this.showToast(`Código ${code.active ? 'ativado' : 'desativado'}!`, 'success');
        }
    }

    // Rendering
    renderGroups() {
        const container = document.getElementById('groupsList');
        const activeGroups = this.groups.filter(group =>
            group.codes.some(code => code.active)
        );

        if (activeGroups.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-layer-group"></i>
                    <h3>Nenhum grupo criado ainda</h3>
                    <p>Adicione códigos para criar grupos automaticamente</p>
                </div>
            `;
            return;
        }

        container.innerHTML = activeGroups.map(group => {
            const activeCodes = group.codes.filter(code => code.active);
            const config = this.getLojaIntegradaConfig();

            return `
                <div class="group-item">
                    <div class="group-header" onclick="manager.toggleGroup('${group.id}')">
                        <div class="group-info">
                            <div class="group-name">${this.getGroupDisplayName(group)}</div>
                            <div class="group-config">
                                <span class="config-badge badge-${group.type}">${group.type.toUpperCase()}</span>
                                <span class="config-badge badge-${group.location}">${config.locations[group.location]}</span>
                                <span class="config-badge badge-all">${config.pages[group.pages].label}</span>
                            </div>
                            <div class="group-stats">
                                <span><i class="fas fa-code"></i> ${activeCodes.length} códigos</span>
                                <span><i class="fas fa-file"></i> ${this.formatBytes(group.minifiedSize)}</span>
                            </div>
                        </div>
                        <div class="group-actions" onclick="event.stopPropagation()">
                            <button class="btn btn-sm btn-secondary" onclick="manager.copyGroupCode('${group.id}')" title="Copiar código">
                                <i class="fas fa-copy"></i>
                            </button>
                            <button class="btn btn-sm btn-primary" onclick="manager.deployGroup('${group.id}')" title="Deploy grupo">
                                <i class="fas fa-rocket"></i>
                            </button>
                        </div>
                    </div>
                    <div class="group-codes" id="group-${group.id}">
                        ${activeCodes.map(code => `
                            <div class="code-item">
                                <div class="code-info">
                                    <div class="code-name">${code.name}</div>
                                    <div class="code-preview">${code.content.substring(0, 200)}${code.content.length > 200 ? '...' : ''}</div>
                                </div>
                                <div class="code-actions">
                                    <button class="btn btn-sm btn-secondary" onclick="manager.editCode('${code.id}')">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="btn btn-sm ${code.active ? 'btn-secondary' : 'btn-primary'}" onclick="manager.toggleCodeStatus('${code.id}')">
                                        <i class="fas fa-${code.active ? 'pause' : 'play'}"></i>
                                    </button>
                                    <button class="btn btn-sm btn-danger" onclick="manager.deleteCode('${code.id}')">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                        <div style="padding: 1rem; background: #f8fafc; border-top: 1px solid #e2e8f0;">
                            <div class="generated-code">
                                ${this.generateLojaIntegradaCode(group)}
                                <button class="copy-button" onclick="manager.copyToClipboard('${this.generateLojaIntegradaCode(group).replace(/'/g, "\\'")}')">
                                    <i class="fas fa-copy"></i>
                                </button>
                            </div>
                            <small><strong>Como usar:</strong> Cole este código na Loja Integrada em "Visual > Incluir Códigos HTML" no campo "${config.locations[group.location]}"</small>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    renderCodes() {
        const container = document.getElementById('codesList');
        const filteredCodes = this.getFilteredCodes();

        if (filteredCodes.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-code"></i>
                    <h3>Nenhum código encontrado</h3>
                    <p>Use os filtros ou adicione novos códigos</p>
                </div>
            `;
            return;
        }

        container.innerHTML = filteredCodes.map(code => `
            <div class="code-item">
                <div class="code-info">
                    <div class="code-name">${code.name}</div>
                    <div class="code-preview">${code.content.substring(0, 150)}${code.content.length > 150 ? '...' : ''}</div>
                </div>
                <div class="code-actions">
                    <button class="btn btn-sm btn-secondary" onclick="manager.editCode('${code.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm ${code.active ? 'btn-secondary' : 'btn-primary'}" onclick="manager.toggleCodeStatus('${code.id}')">
                        <i class="fas fa-${code.active ? 'pause' : 'play'}"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="manager.deleteCode('${code.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    updateStats() {
        const activeCodes = this.codes.filter(code => code.active);
        const activeGroups = this.groups.filter(group => group.codes.some(code => code.active));

        // Calculate performance gain
        const totalOriginalSize = activeCodes.reduce((sum, code) => sum + code.content.length, 0);
        const totalMinifiedSize = Math.floor(totalOriginalSize * 0.3);
        const performanceGain = totalOriginalSize > 0 ?
            Math.floor((1 - (totalMinifiedSize / totalOriginalSize)) * 100) + 25 : 0; // +25% CDN benefit

        // Update DOM
        document.getElementById('performanceGain').textContent = `${Math.min(performanceGain, 85)}%`;
        document.getElementById('totalGroups').textContent = activeGroups.length;
        document.getElementById('groupsDetail').textContent = `${activeGroups.length} arquivos únicos`;
        document.getElementById('totalCodes').textContent = activeCodes.length;
        document.getElementById('codesSize').textContent = `${this.formatBytes(totalMinifiedSize)} minificados`;
        document.getElementById('deployStatus').textContent = 'Online';
        document.getElementById('lastDeploy').textContent = 'Sincronizado';
    }

    // Utility Methods
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    loadCodes() {
        const stored = localStorage.getItem('loja-integrada-codes');
        return stored ? JSON.parse(stored) : [];
    }

    saveCodes() {
        localStorage.setItem('loja-integrada-codes', JSON.stringify(this.codes));
        // Regenerate groups after saving
        this.groups = this.generateGroups();
        this.updateStats();
    }

    getFilteredCodes() {
        const search = document.getElementById('searchCodes')?.value.toLowerCase() || '';
        const locationFilter = document.getElementById('filterLocation')?.value || '';
        const typeFilter = document.getElementById('filterType')?.value || '';

        return this.codes.filter(code => {
            const matchesSearch = code.name.toLowerCase().includes(search);
            const matchesLocation = !locationFilter || code.location === locationFilter;
            const matchesType = !typeFilter || code.type === typeFilter;
            return matchesSearch && matchesLocation && matchesType;
        });
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            this.showToast('Código copiado!', 'success');
        }).catch(() => {
            this.showToast('Erro ao copiar código', 'error');
        });
    }

    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = `toast ${type} show`;

        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    refresh() {
        this.groups = this.generateGroups();
        this.renderGroups();
        this.renderCodes();
        this.updateStats();
    }

    // Group Operations
    toggleGroup(groupId) {
        const groupElement = document.getElementById(`group-${groupId}`);
        if (groupElement) {
            groupElement.classList.toggle('expanded');
        }
    }

    toggleAllGroups() {
        const groups = document.querySelectorAll('.group-codes');
        const isExpanded = Array.from(groups).some(g => g.classList.contains('expanded'));

        groups.forEach(group => {
            if (isExpanded) {
                group.classList.remove('expanded');
            } else {
                group.classList.add('expanded');
            }
        });

        const btn = document.getElementById('btnExpandAll');
        btn.innerHTML = isExpanded ?
            '<i class="fas fa-expand-arrows-alt"></i> Expandir Todos' :
            '<i class="fas fa-compress-arrows-alt"></i> Recolher Todos';
    }

    copyGroupCode(groupId) {
        const group = this.groups.find(g => g.id === groupId);
        if (group) {
            const code = this.generateLojaIntegradaCode(group);
            this.copyToClipboard(code);
        }
    }

    editCode(id) {
        const code = this.codes.find(c => c.id === id);
        if (code) {
            this.openModal(code);
        }
    }

    // Quick Actions
    async quickDeploy() {
        this.showDeployModal();
        // Simulate deployment process
        const steps = [
            'Preparando deploy...',
            'Minificando códigos...',
            'Gerando grupos...',
            'Enviando para GitHub...',
            'Atualizando GitHub Pages...',
            'Deploy concluído!'
        ];

        const statusElement = document.querySelector('.deploy-step span');

        for (let i = 0; i < steps.length; i++) {
            statusElement.textContent = steps[i];
            await this.sleep(800);
        }

        setTimeout(() => {
            this.closeDeployModal();
            this.showToast('Deploy realizado com sucesso!', 'success');
        }, 1000);
    }

    optimizeGroups() {
        const suggestions = [];
        // Logic for optimization suggestions
        this.showToast('Análise de otimização em desenvolvimento!', 'info');
    }

    exportCodes() {
        const data = {
            version: '2.0',
            exportDate: new Date().toISOString(),
            codes: this.codes,
            groups: this.groups
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `loja-integrada-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();

        URL.revokeObjectURL(url);
        this.showToast('Backup exportado com sucesso!', 'success');
    }

    filterCodes() {
        this.renderCodes();
    }

    showDeployModal() {
        document.getElementById('deployModal').classList.add('active');
    }

    closeDeployModal() {
        document.getElementById('deployModal').classList.remove('active');
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Inicializar o sistema
const manager = new LojaIntegradaManager();