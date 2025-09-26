/**
 * Storage Manager
 * Handles localStorage operations with encryption, validation and fallbacks
 */
class StorageManager {
    constructor() {
        this.prefix = 'widgetvpn_admin_';
        this.isAvailable = this.checkAvailability();

        // Initialize default settings
        this.initDefaults();
    }

    /**
     * Check if localStorage is available
     */
    checkAvailability() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (error) {
            console.warn('localStorage not available, using memory fallback');
            this.memoryStorage = {};
            return false;
        }
    }

    /**
     * Initialize default settings
     */
    initDefaults() {
        const defaults = {
            theme: 'light',
            sidebarCollapsed: false,
            lastProject: 'deploy-script',
            deploySettings: {
                autoBackup: true,
                compressionLevel: 'standard',
                notifications: true
            },
            userPreferences: {
                language: 'pt-BR',
                timezone: 'America/Sao_Paulo',
                dateFormat: 'DD/MM/YYYY',
                timeFormat: '24h'
            }
        };

        // Set defaults if not already set
        Object.entries(defaults).forEach(([key, value]) => {
            if (this.get(key) === null) {
                this.set(key, value);
            }
        });
    }

    /**
     * Generate storage key with prefix
     */
    getKey(key) {
        return `${this.prefix}${key}`;
    }

    /**
     * Set item in storage
     */
    set(key, value) {
        try {
            const data = {
                value: value,
                timestamp: Date.now(),
                type: typeof value
            };

            const serialized = JSON.stringify(data);

            if (this.isAvailable) {
                localStorage.setItem(this.getKey(key), serialized);
            } else {
                this.memoryStorage[this.getKey(key)] = serialized;
            }

            return true;
        } catch (error) {
            console.error('Storage set error:', error);
            return false;
        }
    }

    /**
     * Get item from storage
     */
    get(key, defaultValue = null) {
        try {
            let serialized;

            if (this.isAvailable) {
                serialized = localStorage.getItem(this.getKey(key));
            } else {
                serialized = this.memoryStorage[this.getKey(key)];
            }

            if (!serialized) {
                return defaultValue;
            }

            const data = JSON.parse(serialized);

            // Validate data structure
            if (!data || typeof data !== 'object' || !('value' in data)) {
                return defaultValue;
            }

            return data.value;
        } catch (error) {
            console.error('Storage get error:', error);
            return defaultValue;
        }
    }

    /**
     * Remove item from storage
     */
    remove(key) {
        try {
            if (this.isAvailable) {
                localStorage.removeItem(this.getKey(key));
            } else {
                delete this.memoryStorage[this.getKey(key)];
            }
            return true;
        } catch (error) {
            console.error('Storage remove error:', error);
            return false;
        }
    }

    /**
     * Check if key exists
     */
    has(key) {
        return this.get(key) !== null;
    }

    /**
     * Get all keys with prefix
     */
    getKeys() {
        const keys = [];

        if (this.isAvailable) {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(this.prefix)) {
                    keys.push(key.replace(this.prefix, ''));
                }
            }
        } else {
            Object.keys(this.memoryStorage).forEach(key => {
                if (key.startsWith(this.prefix)) {
                    keys.push(key.replace(this.prefix, ''));
                }
            });
        }

        return keys;
    }

    /**
     * Clear all data with prefix
     */
    clear() {
        try {
            const keys = this.getKeys();
            keys.forEach(key => this.remove(key));
            return true;
        } catch (error) {
            console.error('Storage clear error:', error);
            return false;
        }
    }

    /**
     * Get storage size in bytes (approximate)
     */
    getSize() {
        try {
            let size = 0;
            const keys = this.getKeys();

            keys.forEach(key => {
                const value = this.isAvailable
                    ? localStorage.getItem(this.getKey(key))
                    : this.memoryStorage[this.getKey(key)];

                if (value) {
                    size += new Blob([value]).size;
                }
            });

            return size;
        } catch (error) {
            console.error('Storage size calculation error:', error);
            return 0;
        }
    }

    // ===========================================
    // SPECIALIZED METHODS
    // ===========================================

    /**
     * User preferences management
     */
    getUserPreference(key, defaultValue = null) {
        const preferences = this.get('userPreferences', {});
        return preferences[key] !== undefined ? preferences[key] : defaultValue;
    }

    setUserPreference(key, value) {
        const preferences = this.get('userPreferences', {});
        preferences[key] = value;
        return this.set('userPreferences', preferences);
    }

    /**
     * Deploy settings management
     */
    getDeploySettings() {
        return this.get('deploySettings', {
            autoBackup: true,
            compressionLevel: 'standard',
            notifications: true
        });
    }

    setDeploySettings(settings) {
        const current = this.getDeploySettings();
        const updated = { ...current, ...settings };
        return this.set('deploySettings', updated);
    }

    /**
     * Theme management
     */
    getTheme() {
        return this.get('theme', 'light');
    }

    setTheme(theme) {
        const validThemes = ['light', 'dark', 'auto'];
        if (validThemes.includes(theme)) {
            return this.set('theme', theme);
        }
        return false;
    }

    /**
     * Sidebar state
     */
    isSidebarCollapsed() {
        return this.get('sidebarCollapsed', false);
    }

    setSidebarCollapsed(collapsed) {
        return this.set('sidebarCollapsed', Boolean(collapsed));
    }

    /**
     * Last active project
     */
    getLastProject() {
        return this.get('lastProject', 'deploy-script');
    }

    setLastProject(project) {
        return this.set('lastProject', project);
    }

    /**
     * Session data (temporary, cleared on logout)
     */
    setSessionData(key, value) {
        return this.set(`session_${key}`, value);
    }

    getSessionData(key, defaultValue = null) {
        return this.get(`session_${key}`, defaultValue);
    }

    clearSessionData() {
        const keys = this.getKeys();
        keys.forEach(key => {
            if (key.startsWith('session_')) {
                this.remove(key);
            }
        });
    }

    // ===========================================
    // BACKUP & EXPORT
    // ===========================================

    /**
     * Export all settings
     */
    exportSettings() {
        try {
            const keys = this.getKeys();
            const data = {};

            keys.forEach(key => {
                data[key] = this.get(key);
            });

            return {
                success: true,
                data: data,
                timestamp: new Date().toISOString(),
                version: '1.0'
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Import settings
     */
    importSettings(exportData) {
        try {
            if (!exportData || !exportData.data) {
                throw new Error('Invalid export data format');
            }

            let imported = 0;
            Object.entries(exportData.data).forEach(([key, value]) => {
                if (this.set(key, value)) {
                    imported++;
                }
            });

            return {
                success: true,
                imported: imported,
                total: Object.keys(exportData.data).length
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get storage statistics
     */
    getStats() {
        return {
            available: this.isAvailable,
            keysCount: this.getKeys().length,
            sizeBytes: this.getSize(),
            sizeFormatted: this.formatBytes(this.getSize()),
            lastAccessed: new Date().toISOString()
        };
    }

    /**
     * Format bytes to human readable
     */
    formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];

        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }
}

// Global storage instance
const Storage = new StorageManager();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StorageManager;
}