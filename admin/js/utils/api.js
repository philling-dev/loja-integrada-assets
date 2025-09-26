/**
 * API Client para Dashboard Administrativo
 * Handles all API communications with the PHP backend
 */
class APIClient {
    constructor() {
        this.baseURL = '/api';
        this.defaultHeaders = {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
        };
    }

    /**
     * Make HTTP request with error handling
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;

        const config = {
            headers: { ...this.defaultHeaders, ...options.headers },
            ...options
        };

        try {
            const response = await fetch(url, config);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            }

            return await response.text();
        } catch (error) {
            console.error(`API Request failed: ${endpoint}`, error);
            throw error;
        }
    }

    /**
     * GET request
     */
    async get(endpoint, params = {}) {
        const url = new URL(`${this.baseURL}${endpoint}`, window.location.origin);
        Object.keys(params).forEach(key => {
            if (params[key] !== null && params[key] !== undefined) {
                url.searchParams.append(key, params[key]);
            }
        });

        return this.request(url.pathname + url.search, {
            method: 'GET'
        });
    }

    /**
     * POST request
     */
    async post(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    /**
     * PUT request
     */
    async put(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    /**
     * DELETE request
     */
    async delete(endpoint) {
        return this.request(endpoint, {
            method: 'DELETE'
        });
    }

    // ===========================================
    // DEPLOY SCRIPT PROJECT METHODS
    // ===========================================

    /**
     * Deploy code to GitHub Pages
     * Uses existing API: /api/deploy-code.php
     */
    async deployCode(codeData) {
        try {
            const response = await this.post('/deploy-code.php', {
                filename: codeData.filename,
                content: codeData.content,
                type: codeData.type || 'css',
                codeId: codeData.codeId || Date.now(),
                codeName: codeData.codeName || codeData.filename
            });

            if (response.success) {
                return {
                    success: true,
                    filename: response.filename,
                    url: response.url,
                    deployedAt: response.deployedAt,
                    message: `Código deployado com sucesso!`
                };
            } else {
                throw new Error(response.error || 'Erro no deploy');
            }
        } catch (error) {
            return {
                success: false,
                error: error.message,
                message: `Erro no deploy: ${error.message}`
            };
        }
    }

    /**
     * Get deployed assets list
     * Fetches from GitHub Pages index.json
     */
    async getDeployedAssets() {
        try {
            const response = await fetch('https://philling-dev.github.io/loja-integrada-assets/assets/index.json');
            if (!response.ok) {
                throw new Error('Falha ao carregar lista de assets');
            }

            const data = await response.json();
            return {
                success: true,
                assets: data.assets || [],
                lastUpdate: data.lastUpdate
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                assets: []
            };
        }
    }

    /**
     * Get deploy statistics
     */
    async getDeployStats() {
        try {
            const assetsData = await this.getDeployedAssets();

            if (!assetsData.success) {
                throw new Error('Falha ao carregar estatísticas');
            }

            const assets = assetsData.assets;
            const total = assets.length;

            // Analyze by type
            const byType = assets.reduce((acc, asset) => {
                const ext = asset.filename.split('.').pop().toLowerCase();
                const type = ['css', 'min.css'].includes(ext) ? 'CSS' :
                           ['js', 'min.js'].includes(ext) ? 'JavaScript' : 'Outros';
                acc[type] = (acc[type] || 0) + 1;
                return acc;
            }, {});

            // Recent deploys (last 7 days)
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            const recent = assets.filter(asset => {
                const deployDate = new Date(asset.deployedAt);
                return deployDate >= sevenDaysAgo;
            }).length;

            return {
                success: true,
                stats: {
                    total,
                    recent,
                    byType,
                    lastUpdate: assetsData.lastUpdate
                }
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // ===========================================
    // AUTHENTICATION METHODS
    // ===========================================

    /**
     * Login (placeholder for future implementation)
     */
    async login(credentials) {
        // TODO: Implement when auth system is ready
        return {
            success: true,
            user: {
                email: 'admin@widgetvpn.xyz',
                role: 'super_admin'
            }
        };
    }

    /**
     * Check auth status
     */
    async checkAuth() {
        // TODO: Implement when auth system is ready
        return {
            authenticated: true,
            user: {
                email: 'admin@widgetvpn.xyz',
                role: 'super_admin'
            }
        };
    }
}

// Global API instance
const API = new APIClient();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APIClient;
}