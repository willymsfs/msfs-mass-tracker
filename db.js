// db.js - IndexedDB implementation
class MassTrackerDB {
    constructor() {
        this.dbName = 'MSFSMassTrackerDB';
        this.dbVersion = 1;
        this.db = null;
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Create object stores
                if (!db.objectStoreNames.contains('masses')) {
                    db.createObjectStore('masses', { keyPath: 'date' });
                }
                
                if (!db.objectStoreNames.contains('suffrages')) {
                    db.createObjectStore('suffrages', { keyPath: 'id' });
                }
                
                if (!db.objectStoreNames.contains('receptions')) {
                    db.createObjectStore('receptions', { keyPath: 'id' });
                }
                
                if (!db.objectStoreNames.contains('personalIntentions')) {
                    db.createObjectStore('personalIntentions', { keyPath: 'id' });
                }
                
                if (!db.objectStoreNames.contains('settings')) {
                    const settingsStore = db.createObjectStore('settings', { keyPath: 'id' });
                    // Initialize default settings
                    settingsStore.add({
                        id: 'currentSettings',
                        currentSerial: 0,
                        fixedIntentions: [
                            { day: 18, month: 0, occasion: "Gladwin Birthday" },
                            { day: 16, month: 1, occasion: "Dominic Birthday" },
                            // ... other fixed intentions
                        ],
                        goodFridays: ["2024-03-29", "2025-04-18", "2026-04-03"]
                    });
                }
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                resolve(this);
            };

            request.onerror = (event) => {
                console.error('Database error:', event.target.error);
                reject(event.target.error);
            };
        });
    }

    // Masses operations
    async getMass(date) {
        return this._get('masses', date);
    }

    async getAllMasses() {
        return this._getAll('masses');
    }

    async saveMass(massData) {
        return this._save('masses', massData);
    }

    async deleteMass(date) {
        return this._delete('masses', date);
    }

    // Suffrages operations
    async getSuffrage(id) {
        return this._get('suffrages', id);
    }

    async getAllSuffrages() {
        return this._getAll('suffrages');
    }

    async saveSuffrage(suffrageData) {
        return this._save('suffrages', suffrageData);
    }

    async deleteSuffrage(id) {
        return this._delete('suffrages', id);
    }

    // Receptions operations
    async getReception(id) {
        return this._get('receptions', id);
    }

    async getAllReceptions() {
        return this._getAll('receptions');
    }

    async saveReception(receptionData) {
        return this._save('receptions', receptionData);
    }

    async deleteReception(id) {
        return this._delete('receptions', id);
    }

    // Settings operations
    async getSettings() {
        return this._get('settings', 'currentSettings');
    }

    async updateSettings(settings) {
        return this._save('settings', { id: 'currentSettings', ...settings });
    }

    // Generic CRUD operations
    _get(storeName, key) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(key);

            request.onsuccess = () => resolve(request.result);
            request.onerror = (event) => reject(event.target.error);
        });
    }

    _getAll(storeName) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = (event) => reject(event.target.error);
        });
    }

    _save(storeName, data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(data);

            request.onsuccess = () => resolve(request.result);
            request.onerror = (event) => reject(event.target.error);
        });
    }

    _delete(storeName, key) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(key);

            request.onsuccess = () => resolve(true);
            request.onerror = (event) => reject(event.target.error);
        });
    }
}

// Create a singleton instance
const db = new MassTrackerDB();

// Initialize and export
export default db;
