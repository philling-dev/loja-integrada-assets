// Main Entry Point - Modular Dashboard Initialization
class DashboardApp {
    constructor() {
        this.modules = {};
        this.init();
    }

    async init() {
        console.log('🚀 Dashboard App starting...');

        // Initialize core modules
        await this.loadCoreModules();

        // Initialize utilities and legacy support
        this.initializeUtilities();

        // Start dashboard
        this.startDashboard();

        console.log('✅ Dashboard App ready');
    }

    async loadCoreModules() {
        try {
            // Check if classes are available
            if (typeof PageTemplates !== 'undefined') {
                this.modules.pageTemplates = new PageTemplates();
                window.PageTemplates = this.modules.pageTemplates;
            }

            if (typeof DeployManager !== 'undefined') {
                this.modules.deployManager = new DeployManager();
                window.deployManager = this.modules.deployManager;
            }

            console.log('📦 Core modules loaded');
        } catch (error) {
            console.error('❌ Error loading core modules:', error);
        }
    }

    initializeUtilities() {
        // Set up legacy global functions for existing deploy-script.js
        window.loadDeployedCodes = this.loadDeployedCodes.bind(this);

        // Load utility functions that might be in utils/ directory
        if (window.API && window.Storage && window.Toast) {
            console.log('🔧 Utilities available');
        }
    }

    startDashboard() {
        // Initialize main dashboard
        if (typeof Dashboard !== 'undefined') {
            this.modules.dashboard = new Dashboard();
            window.dashboardInstance = this.modules.dashboard;
            window.dashboard = this.modules.dashboard; // Legacy compatibility
        }

        // Load analytics if available
        this.loadAnalytics();

        console.log('🎛️ Dashboard started');
    }

    async loadAnalytics() {
        try {
            const response = await fetch('/api/analytics.php');
            if (response.ok) {
                const data = await response.json();
                this.updateDashboardMetrics(data);
            }
        } catch (error) {
            console.warn('⚠️ Analytics not available:', error.message);
        }
    }

    updateDashboardMetrics(data) {
        // Update total codes count
        const totalCodesElement = document.getElementById('dash-total-codes');
        if (totalCodesElement && data.stats && data.stats.total) {
            totalCodesElement.textContent = data.stats.total;
        }
    }

    // Legacy function for loadDeployedCodes compatibility
    async loadDeployedCodes() {
        if (window.dashboardInstance && typeof window.dashboardInstance.loadExistingCodes === 'function') {
            return window.dashboardInstance.loadExistingCodes();
        }
    }

    // Lazy loading helper for future modules
    async loadModule(moduleName) {
        if (this.modules[moduleName]) {
            return this.modules[moduleName];
        }

        try {
            const module = await import(`./modules/${moduleName}.js`);
            this.modules[moduleName] = new module.default();
            return this.modules[moduleName];
        } catch (error) {
            console.error(`Failed to load module ${moduleName}:`, error);
            return null;
        }
    }
}

// Auto-start when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.dashboardApp = new DashboardApp();
});

// Legacy support for existing functions
window.addEventListener('load', () => {
    // Ensure any legacy functions still work
    if (typeof loadDeployedCodes === 'function') {
        setTimeout(loadDeployedCodes, 100);
    }
});