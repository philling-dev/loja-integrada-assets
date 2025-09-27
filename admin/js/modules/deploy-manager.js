// Deploy Manager Module - Handles code deployment functionality
class DeployManager {
    constructor() {
        this.init();
    }

    init() {
        // Deploy manager is ready
        console.log('Deploy Manager initialized');
    }

    // Show new code modal
    showNewCodeModal() {
        const form = document.getElementById('codeForm');
        if (form) {
            form.style.display = 'block';
            document.getElementById('codeFilename').focus();
        }
    }

    // Hide code form
    hideCodeForm() {
        const form = document.getElementById('codeForm');
        if (form) {
            form.style.display = 'none';
            // Clear form
            document.getElementById('codeFilename').value = '';
            document.getElementById('codeContent').value = '';
        }
    }

    // Deploy code to GitHub Pages
    async deployCode() {
        const filename = document.getElementById('codeFilename').value.trim();
        const content = document.getElementById('codeContent').value.trim();
        const type = document.getElementById('codeType').value;

        if (!filename || !content) {
            this.showResult('Por favor, preencha todos os campos.', 'error');
            return;
        }

        this.showResult('Fazendo deploy...', 'loading');

        try {
            const response = await fetch('/api/deploy-code.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    filename: filename,
                    content: content,
                    type: type,
                    codeId: Date.now(),
                    codeName: filename
                })
            });

            const result = await response.json();

            if (result.success) {
                this.showResult(`✅ Deploy realizado com sucesso!<br><strong>URL:</strong> <a href="${result.url}" target="_blank" style="color: var(--blue-500);">${result.url}</a>`, 'success');
                this.hideCodeForm();
            } else {
                this.showResult(`❌ Erro no deploy: ${result.error || 'Erro desconhecido'}`, 'error');
            }
        } catch (error) {
            this.showResult(`❌ Erro de conexão: ${error.message}`, 'error');
        }
    }

    // Test deploy functionality
    async testDeploy() {
        this.showResult('Testando API de deploy...', 'loading');

        const testCode = {
            filename: 'dashboard-clean-test',
            content: '/* Dashboard WidgetVPN Clean Test */\\n.dashboard-clean { background: #f8fafc; color: #1e293b; }\\n/* Professional, minimal, no emojis */',
            type: 'css',
            codeId: Date.now(),
            codeName: 'Dashboard Clean Test'
        };

        try {
            const response = await fetch('/api/deploy-code.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(testCode)
            });

            const result = await response.json();

            if (result.success) {
                this.showResult(`✅ API funcionando!<br><strong>Teste deployado:</strong> <a href="${result.url}" target="_blank" style="color: var(--blue-500);">${result.filename}</a>`, 'success');
            } else {
                this.showResult(`❌ API erro: ${result.error || 'Erro desconhecido'}`, 'error');
            }
        } catch (error) {
            this.showResult(`❌ Erro de conexão: ${error.message}`, 'error');
        }
    }

    // Show result messages
    showResult(message, type) {
        const container = document.getElementById('deployResult');
        if (!container) return;

        const colors = {
            success: 'var(--green-500)',
            error: 'var(--red-500)',
            loading: 'var(--blue-500)'
        };

        container.innerHTML = `
            <div style="padding: 16px; border-left: 4px solid ${colors[type] || 'var(--gray-300)'}; background: var(--gray-50); border-radius: var(--border-radius);">
                ${message}
            </div>
        `;
    }
}

// Global functions for inline handlers
function showNewCodeModal() {
    if (window.deployManager) {
        window.deployManager.showNewCodeModal();
    }
}

function hideCodeForm() {
    if (window.deployManager) {
        window.deployManager.hideCodeForm();
    }
}

function deployCode() {
    if (window.deployManager) {
        window.deployManager.deployCode();
    }
}

function testDeploy() {
    if (window.deployManager) {
        window.deployManager.testDeploy();
    }
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DeployManager;
}