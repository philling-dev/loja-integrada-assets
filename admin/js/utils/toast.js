/**
 * Toast Notification System
 * Professional toast notifications with multiple types and auto-dismiss
 */
class ToastManager {
    constructor() {
        this.container = null;
        this.toasts = new Map();
        this.defaultDuration = 4000;
        this.maxToasts = 5;

        this.init();
    }

    /**
     * Initialize toast container
     */
    init() {
        // Find existing container or create new one
        this.container = document.getElementById('toast-container');

        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'toast-container';
            this.container.className = 'toast-container';
            document.body.appendChild(this.container);
        }
    }

    /**
     * Show toast notification
     */
    show(message, type = 'info', options = {}) {
        const config = {
            duration: options.duration || this.defaultDuration,
            persistent: options.persistent || false,
            action: options.action || null,
            id: options.id || this.generateId()
        };

        // Remove existing toast with same ID
        if (this.toasts.has(config.id)) {
            this.hide(config.id);
        }

        // Limit number of toasts
        if (this.toasts.size >= this.maxToasts) {
            const oldestId = this.toasts.keys().next().value;
            this.hide(oldestId);
        }

        const toast = this.createToast(message, type, config);
        this.container.appendChild(toast.element);
        this.toasts.set(config.id, toast);

        // Animate in
        requestAnimationFrame(() => {
            toast.element.classList.add('toast-show');
        });

        // Auto-dismiss if not persistent
        if (!config.persistent && config.duration > 0) {
            toast.timeout = setTimeout(() => {
                this.hide(config.id);
            }, config.duration);
        }

        return config.id;
    }

    /**
     * Hide specific toast
     */
    hide(id) {
        const toast = this.toasts.get(id);
        if (!toast) return;

        // Clear timeout
        if (toast.timeout) {
            clearTimeout(toast.timeout);
        }

        // Animate out
        toast.element.classList.add('toast-hide');

        setTimeout(() => {
            if (toast.element.parentNode) {
                toast.element.parentNode.removeChild(toast.element);
            }
            this.toasts.delete(id);
        }, 300);
    }

    /**
     * Hide all toasts
     */
    hideAll() {
        const ids = Array.from(this.toasts.keys());
        ids.forEach(id => this.hide(id));
    }

    /**
     * Create toast element
     */
    createToast(message, type, config) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'polite');

        const icon = this.getIcon(type);
        const actionButton = config.action
            ? `<button class="toast-action" type="button">${config.action.label}</button>`
            : '';

        toast.innerHTML = `
            <div class="toast-content">
                <div class="toast-icon">
                    ${icon}
                </div>
                <div class="toast-message">${message}</div>
                ${actionButton}
                <button class="toast-close" type="button" aria-label="Fechar">
                    <i data-lucide="x"></i>
                </button>
            </div>
        `;

        // Initialize Lucide icons
        if (window.lucide) {
            lucide.createIcons({ nameAttr: 'data-lucide' });
        }

        // Add event listeners
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => {
            this.hide(config.id);
        });

        if (config.action) {
            const actionBtn = toast.querySelector('.toast-action');
            actionBtn.addEventListener('click', (e) => {
                config.action.callback(e);
                if (config.action.dismiss !== false) {
                    this.hide(config.id);
                }
            });
        }

        // Pause auto-dismiss on hover
        toast.addEventListener('mouseenter', () => {
            if (this.toasts.get(config.id)?.timeout) {
                clearTimeout(this.toasts.get(config.id).timeout);
            }
        });

        toast.addEventListener('mouseleave', () => {
            if (!config.persistent && config.duration > 0) {
                const toastData = this.toasts.get(config.id);
                if (toastData) {
                    toastData.timeout = setTimeout(() => {
                        this.hide(config.id);
                    }, 2000); // Reduced time after hover
                }
            }
        });

        return {
            element: toast,
            timeout: null
        };
    }

    /**
     * Get icon for toast type
     */
    getIcon(type) {
        const icons = {
            success: '<i data-lucide="check-circle"></i>',
            error: '<i data-lucide="alert-circle"></i>',
            warning: '<i data-lucide="alert-triangle"></i>',
            info: '<i data-lucide="info"></i>',
            loading: '<i data-lucide="loader-2"></i>'
        };

        return icons[type] || icons.info;
    }

    /**
     * Generate unique ID
     */
    generateId() {
        return `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    // ===========================================
    // CONVENIENCE METHODS
    // ===========================================

    /**
     * Success toast
     */
    success(message, options = {}) {
        return this.show(message, 'success', options);
    }

    /**
     * Error toast
     */
    error(message, options = {}) {
        return this.show(message, 'error', {
            duration: 6000, // Longer for errors
            ...options
        });
    }

    /**
     * Warning toast
     */
    warning(message, options = {}) {
        return this.show(message, 'warning', options);
    }

    /**
     * Info toast
     */
    info(message, options = {}) {
        return this.show(message, 'info', options);
    }

    /**
     * Loading toast
     */
    loading(message, options = {}) {
        return this.show(message, 'loading', {
            persistent: true,
            ...options
        });
    }

    /**
     * Promise-based loading toast
     */
    async promise(promise, messages = {}) {
        const defaultMessages = {
            loading: 'Carregando...',
            success: 'Sucesso!',
            error: 'Erro na operação'
        };

        const config = { ...defaultMessages, ...messages };
        const loadingId = this.loading(config.loading);

        try {
            const result = await promise;
            this.hide(loadingId);
            this.success(config.success);
            return result;
        } catch (error) {
            this.hide(loadingId);
            this.error(config.error);
            throw error;
        }
    }
}

// Global toast instance
const Toast = new ToastManager();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ToastManager;
}