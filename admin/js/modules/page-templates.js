// Page Templates Module - Dynamic content templates
class PageTemplates {
    constructor() {
        this.init();
    }

    init() {
        console.log('Page Templates initialized');
    }

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

                <div class="card">
                    <div class="card-header">
                        <div>
                            <div class="card-title">📱 App Manager</div>
                            <div class="card-subtitle">Gerenciamento de aplicações mobile</div>
                        </div>
                    </div>
                    <div class="metric">
                        <div class="metric-value" style="color: var(--blue-400);">Em Desenvolvimento</div>
                        <div class="metric-label">status</div>
                    </div>
                    <div class="metric">
                        <div class="metric-value">Q1 2025</div>
                        <div class="metric-label">previsão</div>
                    </div>
                    <button class="btn btn-secondary" disabled>
                        Em Breve
                    </button>
                </div>

                <div class="card">
                    <div class="card-header">
                        <div>
                            <div class="card-title">🔗 URL Shortener</div>
                            <div class="card-subtitle">Encurtador de URLs personalizado</div>
                        </div>
                    </div>
                    <div class="metric">
                        <div class="metric-value" style="color: var(--blue-400);">Em Desenvolvimento</div>
                        <div class="metric-label">status</div>
                    </div>
                    <div class="metric">
                        <div class="metric-value">Q1 2025</div>
                        <div class="metric-label">previsão</div>
                    </div>
                    <button class="btn btn-secondary" disabled>
                        Em Breve
                    </button>
                </div>

                <div class="card">
                    <div class="card-header">
                        <div>
                            <div class="card-title">📊 Analytics Hub</div>
                            <div class="card-subtitle">Central de análise e métricas</div>
                        </div>
                    </div>
                    <div class="metric">
                        <div class="metric-value" style="color: var(--blue-400);">Em Desenvolvimento</div>
                        <div class="metric-label">status</div>
                    </div>
                    <div class="metric">
                        <div class="metric-value">Q2 2025</div>
                        <div class="metric-label">previsão</div>
                    </div>
                    <button class="btn btn-secondary" disabled>
                        Em Breve
                    </button>
                </div>
            </div>

            <div class="card" style="margin-top: 24px;">
                <div class="card-header">
                    <div>
                        <div class="card-title">🚀 Ações Rápidas</div>
                        <div class="card-subtitle">Tarefas mais comuns</div>
                    </div>
                </div>
                <div style="display: flex; gap: 12px; flex-wrap: wrap;">
                    <a href="#" class="btn btn-primary" data-page="script-codes">
                        <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clip-rule="evenodd"/>
                        </svg>
                        Novo Código
                    </a>
                    <a href="#" class="btn btn-secondary" data-page="script-deploy">
                        <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
                        </svg>
                        Deploy & Status
                    </a>
                </div>
            </div>
        `;
    }

    getScriptCodesContent() {
        return `
            <div class="loading">
                <div class="loading-spinner"></div>
                <p>Carregando códigos deployados...</p>
            </div>
            <script>
                if (window.loadDeployedCodes) {
                    window.loadDeployedCodes();
                }
            </script>
        `;
    }

    getScriptDeployContent() {
        return `
            <div class="card">
                <div class="card-header">
                    <div>
                        <div class="card-title">🚀 Deploy Código</div>
                        <div class="card-subtitle">Enviar novos códigos CSS/JS para GitHub Pages</div>
                    </div>
                </div>

                <div style="display: flex; gap: 12px; margin-bottom: 24px;">
                    <button class="btn btn-primary" onclick="showNewCodeModal()">
                        <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clip-rule="evenodd"/>
                        </svg>
                        Novo Deploy
                    </button>
                    <button class="btn btn-secondary" onclick="testDeploy()">
                        <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                        </svg>
                        Testar API
                    </button>
                </div>

                <div id="deployResult"></div>

                <div id="codeForm" style="display: none; margin-top: 24px; padding: 24px; border: 1px solid var(--gray-200); border-radius: var(--border-radius); background: var(--gray-50);">
                    <h3 style="margin: 0 0 16px 0; color: var(--gray-900);">Deploy Novo Código</h3>

                    <div style="margin-bottom: 16px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 500; color: var(--gray-700);">Nome do arquivo:</label>
                        <input type="text" id="codeFilename" placeholder="ex: meu-estilo-customizado" style="width: 100%; padding: 12px; border: 1px solid var(--gray-300); border-radius: var(--border-radius); font-size: 14px;">
                    </div>

                    <div style="margin-bottom: 16px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 500; color: var(--gray-700);">Tipo:</label>
                        <select id="codeType" style="width: 100%; padding: 12px; border: 1px solid var(--gray-300); border-radius: var(--border-radius); font-size: 14px;">
                            <option value="css">CSS</option>
                            <option value="js">JavaScript</option>
                        </select>
                    </div>

                    <div style="margin-bottom: 16px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 500; color: var(--gray-700);">Código:</label>
                        <textarea id="codeContent" rows="10" placeholder="Digite seu código aqui..." style="width: 100%; padding: 12px; border: 1px solid var(--gray-300); border-radius: var(--border-radius); font-size: 14px; font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;"></textarea>
                    </div>

                    <div style="display: flex; gap: 12px;">
                        <button class="btn btn-primary" onclick="deployCode()">
                            <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd"/>
                            </svg>
                            Fazer Deploy
                        </button>
                        <button class="btn btn-secondary" onclick="hideCodeForm()">
                            Cancelar
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    getScriptSettingsContent() {
        return `
            <div class="card">
                <div class="card-header">
                    <div>
                        <div class="card-title">⚙️ Configurações Script Deploy</div>
                        <div class="card-subtitle">Configurações do sistema de deployment</div>
                    </div>
                </div>
                <p style="color: var(--gray-600);">Configurações em desenvolvimento...</p>
            </div>
        `;
    }

    getSystemSettingsContent() {
        return `
            <div class="card">
                <div class="card-header">
                    <div>
                        <div class="card-title">🔧 Configurações do Sistema</div>
                        <div class="card-subtitle">Configurações gerais</div>
                    </div>
                </div>
                <p style="color: var(--gray-600);">Configurações em desenvolvimento...</p>
            </div>
        `;
    }

    getSystemLogsContent() {
        return `
            <div class="card">
                <div class="card-header">
                    <div>
                        <div class="card-title">📋 Logs do Sistema</div>
                        <div class="card-subtitle">Histórico de atividades</div>
                    </div>
                </div>
                <p style="color: var(--gray-600);">Logs em desenvolvimento...</p>
            </div>
        `;
    }
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PageTemplates;
}