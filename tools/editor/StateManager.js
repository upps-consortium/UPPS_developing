/**
 * StateManager.js - UPPS新アーキテクチャ 状態管理システム
 * 
 * Alpine.js統合とリアクティブ状態管理を提供
 * インターフェース定義書準拠実装
 */

class StateManager {
    constructor(config = {}) {
        // 設定のマージ
        this.config = {
            persistence: true,
            storageKey: 'upps_state',
            autoSave: true,
            autoSaveInterval: 5000,
            ...config
        };

        // 内部状態
        this.state = {};
        this.subscribers = new Map(); // path -> Set<callback>
        this.watchers = new Map();    // path -> Set<callback>
        this.autoSaveTimer = null;
        
        // Alpine.js統合
        this.alpineStores = new Map(); // storeName -> Alpine store reference
        
        // 初期化
        this.initialize();
    }

    /**
     * 初期化処理
     */
    initialize() {
        // 永続化されたデータの読み込み
        if (this.config.persistence) {
            this.load();
        }

        // 自動保存の開始
        if (this.config.autoSave) {
            this.startAutoSave();
        }

        // ブラウザ終了時の自動保存
        if (typeof window !== 'undefined') {
            window.addEventListener('beforeunload', () => {
                this.save();
            });
        }
    }

    /**
     * 状態の設定
     * @param {string} path - ドット記法のパス (e.g., 'user.profile.name')
     * @param {any} value - 設定する値
     */
    setState(path, value) {
        const oldValue = this.getState(path);
        
        // パスに基づいて値を設定
        this._setNestedValue(this.state, path, value);
        
        // 購読者への通知
        this._notifySubscribers(path, value);
        
        // ウォッチャーへの通知
        this._notifyWatchers(path, value, oldValue);
        
        // Alpine.js同期
        this._syncToAlpine(path, value);
        
        console.debug(`StateManager: setState('${path}')`, value);
    }

    /**
     * 状態の取得
     * @param {string} path - ドット記法のパス
     * @returns {any} 取得した値
     */
    getState(path) {
        if (!path) return this.state;
        
        return this._getNestedValue(this.state, path);
    }

    /**
     * 状態のマージ（オブジェクトの場合）
     * @param {string} path - ドット記法のパス
     * @param {object} value - マージするオブジェクト
     */
    mergeState(path, value) {
        if (typeof value !== 'object' || value === null) {
            throw new Error('mergeState requires an object value');
        }

        const currentValue = this.getState(path);
        const mergedValue = {
            ...(typeof currentValue === 'object' ? currentValue : {}),
            ...value
        };
        
        this.setState(path, mergedValue);
    }

    /**
     * 状態の削除
     * @param {string} path - ドット記法のパス
     */
    deleteState(path) {
        const pathParts = path.split('.');
        const lastKey = pathParts.pop();
        const parentPath = pathParts.join('.');
        const parent = parentPath ? this.getState(parentPath) : this.state;
        
        if (parent && typeof parent === 'object' && lastKey in parent) {
            delete parent[lastKey];
            
            // 購読者への通知
            this._notifySubscribers(path, undefined);
            
            // Alpine.js同期
            this._syncToAlpine(path, undefined);
            
            console.debug(`StateManager: deleteState('${path}')`);
        }
    }

    /**
     * 状態変更の購読
     * @param {string} path - 監視するパス
     * @param {Function} callback - コールバック関数
     * @returns {Function} 購読解除関数
     */
    subscribe(path, callback) {
        if (!this.subscribers.has(path)) {
            this.subscribers.set(path, new Set());
        }
        
        this.subscribers.get(path).add(callback);
        
        // 購読解除関数を返す
        return () => {
            const pathSubscribers = this.subscribers.get(path);
            if (pathSubscribers) {
                pathSubscribers.delete(callback);
                if (pathSubscribers.size === 0) {
                    this.subscribers.delete(path);
                }
            }
        };
    }

    /**
     * 状態変更の監視（新旧値を取得）
     * @param {string} path - 監視するパス
     * @param {Function} callback - コールバック関数(newValue, oldValue)
     * @returns {Function} 監視解除関数
     */
    watch(path, callback) {
        if (!this.watchers.has(path)) {
            this.watchers.set(path, new Set());
        }
        
        this.watchers.get(path).add(callback);
        
        // 監視解除関数を返す
        return () => {
            const pathWatchers = this.watchers.get(path);
            if (pathWatchers) {
                pathWatchers.delete(callback);
                if (pathWatchers.size === 0) {
                    this.watchers.delete(path);
                }
            }
        };
    }

    /**
     * Alpine.jsストアとのバインド
     * @param {string} storeName - Alpine.jsのストア名
     */
    bindToAlpine(storeName) {
        if (typeof window === 'undefined' || !window.Alpine) {
            console.warn('StateManager: Alpine.js not found');
            return;
        }

        // Alpine.jsストアの作成
        const storeData = this._convertToAlpineStore(this.state);
        
        window.Alpine.store(storeName, storeData);
        this.alpineStores.set(storeName, storeName);
        
        console.debug(`StateManager: Bound to Alpine store '${storeName}'`);
    }

    /**
     * Alpine.jsストアからの同期
     * @param {string} storeName - Alpine.jsのストア名
     */
    syncFromAlpine(storeName) {
        if (typeof window === 'undefined' || !window.Alpine) {
            console.warn('StateManager: Alpine.js not found');
            return;
        }

        const store = window.Alpine.store(storeName);
        if (store) {
            // Alpine.jsストアから状態を同期
            this.state = { ...store };
            console.debug(`StateManager: Synced from Alpine store '${storeName}'`);
        }
    }

    /**
     * 状態の永続化
     */
    save() {
        if (!this.config.persistence) return;
        
        try {
            const serializedState = JSON.stringify(this.state);
            localStorage.setItem(this.config.storageKey, serializedState);
            console.debug('StateManager: State saved to localStorage');
        } catch (error) {
            console.error('StateManager: Failed to save state', error);
        }
    }

    /**
     * 状態の読み込み
     */
    load() {
        if (!this.config.persistence) return;
        
        try {
            const serializedState = localStorage.getItem(this.config.storageKey);
            if (serializedState) {
                this.state = JSON.parse(serializedState);
                console.debug('StateManager: State loaded from localStorage');
            }
        } catch (error) {
            console.error('StateManager: Failed to load state', error);
            this.state = {};
        }
    }

    /**
     * 状態のリセット
     */
    reset() {
        this.state = {};
        
        // すべての購読者に通知
        for (const [path, subscribers] of this.subscribers) {
            const value = this.getState(path);
            subscribers.forEach(callback => {
                try {
                    callback(value);
                } catch (error) {
                    console.error(`StateManager: Error in subscriber for path '${path}'`, error);
                }
            });
        }
        
        // 永続化されたデータも削除
        if (this.config.persistence) {
            localStorage.removeItem(this.config.storageKey);
        }
        
        console.debug('StateManager: State reset');
    }

    // ==================== 内部メソッド ====================

    /**
     * ネストしたオブジェクトから値を取得
     */
    _getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => {
            return current && current[key] !== undefined ? current[key] : undefined;
        }, obj);
    }

    /**
     * ネストしたオブジェクトに値を設定
     */
    _setNestedValue(obj, path, value) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        
        // 最後のキー以外までのパスを作成
        const target = keys.reduce((current, key) => {
            if (!current[key] || typeof current[key] !== 'object') {
                current[key] = {};
            }
            return current[key];
        }, obj);
        
        target[lastKey] = value;
    }

    /**
     * 購読者への通知
     */
    _notifySubscribers(path, value) {
        // 完全一致のパス
        const exactSubscribers = this.subscribers.get(path);
        if (exactSubscribers) {
            exactSubscribers.forEach(callback => {
                try {
                    callback(value);
                } catch (error) {
                    console.error(`StateManager: Error in subscriber for path '${path}'`, error);
                }
            });
        }

        // 親パスの購読者にも通知
        const pathParts = path.split('.');
        for (let i = pathParts.length - 1; i > 0; i--) {
            const parentPath = pathParts.slice(0, i).join('.');
            const parentSubscribers = this.subscribers.get(parentPath);
            if (parentSubscribers) {
                const parentValue = this.getState(parentPath);
                parentSubscribers.forEach(callback => {
                    try {
                        callback(parentValue);
                    } catch (error) {
                        console.error(`StateManager: Error in parent subscriber for path '${parentPath}'`, error);
                    }
                });
            }
        }
    }

    /**
     * ウォッチャーへの通知
     */
    _notifyWatchers(path, newValue, oldValue) {
        const pathWatchers = this.watchers.get(path);
        if (pathWatchers) {
            pathWatchers.forEach(callback => {
                try {
                    callback(newValue, oldValue);
                } catch (error) {
                    console.error(`StateManager: Error in watcher for path '${path}'`, error);
                }
            });
        }
    }

    /**
     * Alpine.jsへの同期
     */
    _syncToAlpine(path, value) {
        if (typeof window === 'undefined' || !window.Alpine || this.alpineStores.size === 0) {
            return;
        }

        for (const storeName of this.alpineStores.values()) {
            try {
                const store = window.Alpine.store(storeName);
                if (store) {
                    // パスに基づいてAlpine.jsストアを更新
                    this._setNestedValue(store, path, value);
                }
            } catch (error) {
                console.error(`StateManager: Failed to sync to Alpine store '${storeName}'`, error);
            }
        }
    }

    /**
     * Alpine.jsストア用のデータ変換
     */
    _convertToAlpineStore(data) {
        // オブジェクトの深いコピーを作成
        return JSON.parse(JSON.stringify(data));
    }

    /**
     * 自動保存の開始
     */
    startAutoSave() {
        this.stopAutoSave();
        this.autoSaveTimer = setInterval(() => {
            this.save();
        }, this.config.autoSaveInterval);
    }

    /**
     * 自動保存の停止
     */
    stopAutoSave() {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
            this.autoSaveTimer = null;
        }
    }

    /**
     * 破棄処理
     */
    destroy() {
        this.stopAutoSave();
        this.subscribers.clear();
        this.watchers.clear();
        this.alpineStores.clear();
        
        // 最終保存
        if (this.config.persistence) {
            this.save();
        }
        
        console.debug('StateManager: Destroyed');
    }
}

// ES6モジュールとしてエクスポート
export { StateManager };