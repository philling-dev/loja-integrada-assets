// Sistema de Gerenciamento de Códigos da Loja Integrada
class LojaIntegradaManager {
    constructor() {
        this.codes = this.loadCodes();
        this.init();
    }

    // Inicialização
    init() {
        this.bindEvents();
        this.renderCodes();
        this.updateStats();
    }

    // Eventos
    bindEvents() {
        // Modal
        document.getElementById('btnNewCode').addEventListener('click', () => this.openModal());
        document.getElementById('closeModal').addEventListener('click', () => this.closeModal());
        document.getElementById('btnCancel').addEventListener('click', () => this.closeModal());

        // Formulário
        document.getElementById('codeForm').addEventListener('submit', (e) => this.handleSubmit(e));

        // Filtros
        document.getElementById('searchCodes').addEventListener('input', (e) => this.filterCodes());
        document.getElementById('filterLocation').addEventListener('change', (e) => this.filterCodes());
        document.getElementById('filterType').addEventListener('change', (e) => this.filterCodes());

        // Refresh
        document.getElementById('btnRefresh').addEventListener('click', () => this.refreshCodes());

        // Click fora do modal
        document.getElementById('codeModal').addEventListener('click', (e) => {
            if (e.target.id === 'codeModal') this.closeModal();
        });
    }

    // Gerenciamento de dados
    loadCodes() {
        const stored = localStorage.getItem('loja-integrada-codes');
        return stored ? JSON.parse(stored) : [];
    }

    saveCodes() {
        localStorage.setItem('loja-integrada-codes', JSON.stringify(this.codes));
        this.updateStats();
    }

    // CRUD Operations
    createCode(codeData) {
        const code = {
            id: this.generateId(),
            name: codeData.name,
            location: codeData.location,
            type: codeData.type,
            pages: codeData.pages,
            content: codeData.content,
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
        const index = this.codes.findIndex(code => code.id === id);
        if (index !== -1) {
            this.codes.splice(index, 1);
            this.saveCodes();
            this.renderCodes();
            this.showToast('Código removido com sucesso!', 'success');
        }
    }

    toggleCodeStatus(id) {
        const code = this.codes.find(code => code.id === id);
        if (code) {
            code.active = !code.active;
            code.updatedAt = new Date().toISOString();
            this.saveCodes();
            this.renderCodes();
            this.showToast(`Código ${code.active ? 'ativado' : 'desativado'}!`, 'success');
        }
    }

    // Geração de IDs únicos
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Geração de códigos para Loja Integrada
    generateOneLineCode(code) {
        const baseUrl = 'https://admin.widgetvpn.xyz';
        const filename = this.generateFilename(code);

        if (code.type === 'css') {
            return `<link rel="stylesheet" href="${baseUrl}/assets/css/${filename}">`;
        } else if (code.type === 'js') {
            return `<script src="${baseUrl}/assets/js/${filename}"></script>`;
        } else {
            return `<!-- HTML: ${code.name} -->\n${code.content}`;
        }
    }

    generateFilename(code) {
        const slug = code.name.toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();

        return `${slug}-${code.id}.min.${code.type === 'css' ? 'css' : 'js'}`;
    }

    // Interface
    openModal(code = null) {
        const modal = document.getElementById('codeModal');
        const form = document.getElementById('codeForm');

        if (code) {
            document.getElementById('modalTitle').textContent = 'Editar Código';
            document.getElementById('codeName').value = code.name;
            document.getElementById('codeLocation').value = code.location;
            document.getElementById('codeType').value = code.type;
            document.getElementById('codePages').value = code.pages;
            document.getElementById('codeContent').value = code.content;
            form.dataset.editId = code.id;
        } else {
            document.getElementById('modalTitle').textContent = 'Novo Código';
            form.reset();
            delete form.dataset.editId;
        }

        modal.classList.add('active');
    }

    closeModal() {
        document.getElementById('codeModal').classList.remove('active');
    }

    handleSubmit(e) {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);

        const codeData = {
            name: document.getElementById('codeName').value,
            location: document.getElementById('codeLocation').value,
            type: document.getElementById('codeType').value,
            pages: document.getElementById('codePages').value,
            content: document.getElementById('codeContent').value
        };

        if (form.dataset.editId) {
            this.updateCode(form.dataset.editId, codeData);
            this.showToast('Código atualizado com sucesso!', 'success');
        } else {
            this.createCode(codeData);
            this.showToast('Código criado com sucesso!', 'success');
        }

        this.closeModal();
        this.renderCodes();
    }

    renderCodes() {
        const container = document.getElementById('codesList');
        const filteredCodes = this.getFilteredCodes();

        if (filteredCodes.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-code"></i>
                    <h3>Nenhum código encontrado</h3>
                    <p>Crie seu primeiro código para começar!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = filteredCodes.map(code => `
            <div class="code-item" data-id="${code.id}">
                <div class="code-info">
                    <div class="code-name">${code.name}</div>
                    <div class="code-meta">
                        <span class="code-badge badge-${code.type}">${code.type.toUpperCase()}</span>
                        <span class="code-badge">${this.getLocationLabel(code.location)}</span>
                        <span class="code-badge">${this.getPagesLabel(code.pages)}</span>
                        <span class="code-badge ${code.active ? 'badge-css' : 'badge-js'}">
                            ${code.active ? 'Ativo' : 'Inativo'}
                        </span>
                    </div>
                    <div class="code-link">
                        ${this.generateOneLineCode(code)}
                    </div>
                </div>
                <div class="code-actions">
                    <button class="btn btn-sm btn-secondary" onclick="manager.copyCode('${code.id}')">
                        <i class="fas fa-copy"></i>
                    </button>
                    <button class="btn btn-sm btn-secondary" onclick="manager.openModal(manager.codes.find(c => c.id === '${code.id}'))">
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

    getFilteredCodes() {
        const search = document.getElementById('searchCodes').value.toLowerCase();
        const locationFilter = document.getElementById('filterLocation').value;
        const typeFilter = document.getElementById('filterType').value;

        return this.codes.filter(code => {
            const matchesSearch = code.name.toLowerCase().includes(search);
            const matchesLocation = !locationFilter || code.location === locationFilter;
            const matchesType = !typeFilter || code.type === typeFilter;
            return matchesSearch && matchesLocation && matchesType;
        });
    }

    filterCodes() {
        this.renderCodes();
    }

    refreshCodes() {
        this.renderCodes();
        this.updateStats();
        this.showToast('Lista atualizada!', 'success');
    }

    copyCode(id) {
        const code = this.codes.find(c => c.id === id);
        if (code) {
            const oneLineCode = this.generateOneLineCode(code);
            navigator.clipboard.writeText(oneLineCode).then(() => {
                this.showToast('Código copiado para a área de transferência!', 'success');
            });
        }
    }

    updateStats() {
        const activeCodes = this.codes.filter(code => code.active);
        const cssCodes = this.codes.filter(code => code.type === 'css');
        const jsCodes = this.codes.filter(code => code.type === 'js');

        document.getElementById('totalCodes').textContent = activeCodes.length;
        document.getElementById('totalCSS').textContent = cssCodes.length;
        document.getElementById('totalJS').textContent = jsCodes.length;
        document.getElementById('deployStatus').textContent = 'online';
    }

    // Utilitários
    getLocationLabel(location) {
        const labels = {
            'header': 'Cabeçalho',
            'footer': 'Rodapé',
            'body': 'Corpo'
        };
        return labels[location] || location;
    }

    getPagesLabel(pages) {
        const labels = {
            'all': 'Todas as páginas',
            'home': 'Home',
            'product': 'Produto',
            'category': 'Categoria',
            'cart': 'Carrinho',
            'checkout': 'Checkout',
            'finalization': 'Finalização',
            'except-checkout': 'Exceto checkout'
        };
        return labels[pages] || pages;
    }

    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = `toast ${type} show`;

        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    // Exportar/Importar dados
    exportCodes() {
        const data = {
            version: '1.0',
            exportDate: new Date().toISOString(),
            codes: this.codes
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `loja-integrada-codes-${new Date().toISOString().split('T')[0]}.json`;
        a.click();

        URL.revokeObjectURL(url);
        this.showToast('Códigos exportados com sucesso!', 'success');
    }

    importCodes(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (data.codes && Array.isArray(data.codes)) {
                    this.codes = [...this.codes, ...data.codes];
                    this.saveCodes();
                    this.renderCodes();
                    this.showToast(`${data.codes.length} códigos importados!`, 'success');
                }
            } catch (error) {
                this.showToast('Erro ao importar códigos!', 'error');
            }
        };
        reader.readAsText(file);
    }
}

// Inicializar o sistema
const manager = new LojaIntegradaManager();

// Adicionar alguns códigos de exemplo se não houver nenhum
if (manager.codes.length === 0) {
    // Exemplo 1: CSS para dropdown menu
    manager.createCode({
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
}

.custom-dropdown:hover .dropdown-content {
    display: block;
}

.dropdown-content a {
    color: black;
    padding: 12px 16px;
    text-decoration: none;
    display: block;
}

.dropdown-content a:hover {
    background-color: #f1f1f1;
}`
    });

    // Exemplo 2: JavaScript para analytics
    manager.createCode({
        name: 'Google Analytics Enhanced',
        location: 'header',
        type: 'js',
        pages: 'all',
        content: `// Google Analytics Enhanced
(function() {
    // Seu código de analytics aqui
    console.log('Analytics carregado');

    // Track eventos customizados
    function trackEvent(action, category, label) {
        if (typeof gtag !== 'undefined') {
            gtag('event', action, {
                event_category: category,
                event_label: label
            });
        }
    }

    // Disponibilizar globalmente
    window.trackCustomEvent = trackEvent;
})();`
    });

    manager.renderCodes();
}