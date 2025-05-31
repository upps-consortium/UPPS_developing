/**
 * AppController.js - UPPS新アーキテクチャ アプリケーション制御システム
 * 
 * アプリケーション全体のライフサイクル、UI制御、モジュール統合を管理
 * インターフェース定義書準拠実装
 */

class AppController {
    constructor(options = {}) {
        // 設定
        this.options = {
            autoStart: true,
            enableAlpine: true,
            defaultTab: 'basic',
            persistState: true,
            ...options
        };

        // コアシステム
        this.eventBus = null;
        this.stateManager = null;
        this.moduleRegistry = null;

        // アプリケーション状態
        this.applicationState = {
            activeTab: this.options.defaultTab,
            persona: this._getDefaultPersonaData(),
            ui: {
                modalStack: [],
                notifications: [],
                theme: 'light',
                loading: false
            },
            settings: {
                autoSave: true,
                debugMode: false,
                language: 'ja'
            }
        };

        // UI制御
        this.activeModals = new Set();
        this.notificationCounter = 0;
        
        // ライフサイクル状態
        this.isInitialized = false;
        this.isStarted = false;
        this.isDestroyed = false;

        this.log('AppController created');
    }

    /**
     * アプリケーションを初期化
     * @returns {Promise<void>}
     */
    async initialize() {
        if (this.isInitialized) {
            this.log('AppController already initialized');
            return;
        }

        if (this.isDestroyed) {
            throw new Error('Cannot initialize destroyed AppController');
        }

        this.log('Initializing AppController...');

        try {
            // コアシステムの初期化
            await this._initializeCoreSystem();
            
            // Alpine.js統合
            if (this.options.enableAlpine) {
                await this._initializeAlpine();
            }
            
            // ドメインモジュールの登録
            await this._registerDomainModules();
            
            // UI システムの初期化
            await this._initializeUISystem();
            
            // イベントハンドリングの設定
            this._setupEventHandlers();
            
            this.isInitialized = true;
            this.log('AppController initialized successfully');
            this.eventBus.emit('app:initialized');

        } catch (error) {
            this.log(`AppController initialization failed: ${error.message}`);
            this.eventBus?.emit('app:initialization:failed', { error: error.message });
            throw error;
        }
    }

    /**
     * アプリケーションを開始
     * @returns {Promise<void>}
     */
    async start() {
        if (!this.isInitialized) {
            if (this.options.autoStart) {
                await this.initialize();
            } else {
                throw new Error('AppController must be initialized before starting');
            }
        }

        if (this.isStarted) {
            this.log('AppController already started');
            return;
        }

        this.log('Starting AppController...');

        try {
            // 状態の復元
            await this._restoreApplicationState();
            
            // モジュールの開始
            await this.moduleRegistry.start();
            
            // デフォルトタブの読み込み
            await this.switchTab(this.applicationState.activeTab);
            
            this.isStarted = true;
            this.log('AppController started successfully');
            this.eventBus.emit('app:started');

        } catch (error) {
            this.log(`AppController start failed: ${error.message}`);
            this.eventBus.emit('app:start:failed', { error: error.message });
            throw error;
        }
    }

    /**
     * アプリケーションを停止
     * @returns {Promise<void>}
     */
    async stop() {
        if (!this.isStarted) {
            this.log('AppController not started');
            return;
        }

        this.log('Stopping AppController...');

        try {
            // アプリケーション状態を保存
            await this._saveApplicationState();
            
            // モジュールの停止
            await this.moduleRegistry.stop();
            
            // UI のクリーンアップ
            this._cleanupUI();
            
            this.isStarted = false;
            this.log('AppController stopped successfully');
            this.eventBus.emit('app:stopped');

        } catch (error) {
            this.log(`AppController stop failed: ${error.message}`);
            this.eventBus.emit('app:stop:failed', { error: error.message });
        }
    }

    /**
     * アプリケーションを破棄
     * @returns {Promise<void>}
     */
    async destroy() {
        if (this.isDestroyed) {
            this.log('AppController already destroyed');
            return;
        }

        this.log('Destroying AppController...');

        try {
            // 先に停止
            if (this.isStarted) {
                await this.stop();
            }
            
            // モジュールレジストリの破棄
            if (this.moduleRegistry) {
                await this.moduleRegistry.destroy();
            }
            
            // コアシステムの破棄
            if (this.stateManager) {
                this.stateManager.destroy();
            }
            
            if (this.eventBus) {
                this.eventBus.destroy();
            }
            
            // 状態のリセット
            this.isInitialized = false;
            this.isStarted = false;
            this.isDestroyed = true;
            
            this.log('AppController destroyed successfully');

        } catch (error) {
            this.log(`AppController destroy failed: ${error.message}`);
        }
    }

    /**
     * アプリケーション状態を取得
     * @returns {Object} アプリケーション状態
     */
    getState() {
        return { ...this.applicationState };
    }

    /**
     * アプリケーション状態を設定
     * @param {Object} state - 設定する状態（部分更新）
     */
    setState(state) {
        this.applicationState = {
            ...this.applicationState,
            ...state
        };
        
        // StateManagerと同期
        if (this.stateManager) {
            this.stateManager.setState('app', this.applicationState);
        }
        
        this.eventBus?.emit('app:state:changed', { state: this.applicationState });
    }

    /**
     * モジュールを動的に読み込み
     * @param {string} name - モジュール名
     * @returns {Promise<void>}
     */
    async loadModule(name) {
        if (!this.moduleRegistry.has(name)) {
            throw new Error(`Module '${name}' is not registered`);
        }

        // 既に初期化・開始済みの場合はスキップ
        const module = this.moduleRegistry.get(name);
        const moduleState = this.moduleRegistry.moduleStates.get(name);
        
        if (moduleState === 'started') {
            this.log(`Module '${name}' already loaded and started`);
            return;
        }

        this.log(`Loading module: ${name}`);
        
        try {
            if (moduleState === 'registered') {
                await this.moduleRegistry._initializeModule(name);
            }
            
            if (this.isStarted) {
                await this.moduleRegistry._startModule(name);
            }
            
            this.eventBus.emit('app:module:loaded', { name });
            
        } catch (error) {
            this.log(`Failed to load module '${name}': ${error.message}`);
            this.eventBus.emit('app:module:load:failed', { name, error: error.message });
            throw error;
        }
    }

    /**
     * モジュールを動的にアンロード
     * @param {string} name - モジュール名
     * @returns {Promise<void>}
     */
    async unloadModule(name) {
        if (!this.moduleRegistry.has(name)) {
            this.log(`Module '${name}' not found for unloading`);
            return;
        }

        this.log(`Unloading module: ${name}`);
        
        try {
            await this.moduleRegistry._stopModule(name);
            this.eventBus.emit('app:module:unloaded', { name });
            
        } catch (error) {
            this.log(`Failed to unload module '${name}': ${error.message}`);
            this.eventBus.emit('app:module:unload:failed', { name, error: error.message });
        }
    }

    /**
     * タブを切り替え
     * @param {string} tabId - タブID
     * @returns {Promise<void>}
     */
    async switchTab(tabId) {
        const validTabs = ['basic', 'emotion', 'personality', 'memory', 'association', 'cognitive'];
        
        if (!validTabs.includes(tabId)) {
            throw new Error(`Invalid tab ID: ${tabId}`);
        }

        if (this.applicationState.activeTab === tabId) {
            this.log(`Tab '${tabId}' already active`);
            return;
        }

        this.log(`Switching to tab: ${tabId}`);
        
        try {
            // タブ切り替え前のイベント
            this.eventBus.emit('tab:before:change', { 
                from: this.applicationState.activeTab, 
                to: tabId 
            });
            
            // 状態更新
            this.setState({ activeTab: tabId });
            
            // Alpine.jsのリアクティブ更新（Alpine.js使用時）
            if (this.options.enableAlpine && window.Alpine) {
                const appStore = window.Alpine.store('app');
                if (appStore) {
                    appStore.activeTab = tabId;
                }
            }
            
            // タブ切り替え後のイベント
            this.eventBus.emit('tab:changed', { 
                from: this.applicationState.activeTab, 
                to: tabId 
            });
            
            this.log(`Tab switched to: ${tabId}`);

        } catch (error) {
            this.log(`Tab switch failed: ${error.message}`);
            this.eventBus.emit('tab:change:failed', { tabId, error: error.message });
            throw error;
        }
    }

    /**
     * モーダルを表示
     * @param {string} modalId - モーダルID
     * @param {any} data - モーダルデータ
     */
    showModal(modalId, data = null) {
        if (this.activeModals.has(modalId)) {
            this.log(`Modal '${modalId}' already shown`);
            return;
        }

        this.log(`Showing modal: ${modalId}`);
        
        this.activeModals.add(modalId);
        this.applicationState.ui.modalStack.push(modalId);
        
        this.eventBus.emit('modal:show', { modalId, data });
        
        // Alpine.jsとの同期
        this._syncUIState();
    }

    /**
     * モーダルを非表示
     * @param {string} modalId - モーダルID
     */
    hideModal(modalId) {
        if (!this.activeModals.has(modalId)) {
            this.log(`Modal '${modalId}' not shown`);
            return;
        }

        this.log(`Hiding modal: ${modalId}`);
        
        this.activeModals.delete(modalId);
        const stackIndex = this.applicationState.ui.modalStack.indexOf(modalId);
        if (stackIndex !== -1) {
            this.applicationState.ui.modalStack.splice(stackIndex, 1);
        }
        
        this.eventBus.emit('modal:hide', { modalId });
        
        // Alpine.jsとの同期
        this._syncUIState();
    }

    /**
     * 通知を表示
     * @param {string} message - メッセージ
     * @param {string} type - 通知タイプ
     */
    showNotification(message, type = 'info') {
        const notification = {
            id: `notification_${++this.notificationCounter}`,
            message,
            type,
            timestamp: Date.now()
        };

        this.log(`Showing notification: ${type} - ${message}`);
        
        this.applicationState.ui.notifications.push(notification);
        
        this.eventBus.emit('notification:show', { notification });
        
        // Alpine.jsとの同期
        this._syncUIState();
        
        // 自動削除（5秒後）
        setTimeout(() => {
            this._removeNotification(notification.id);
        }, 5000);
    }

    // ==================== 内部メソッド ====================

    /**
     * コアシステムの初期化
     */
    async _initializeCoreSystem() {
        const { EventBus } = await import('./EventBus.js');
        const { StateManager } = await import('./StateManager.js');
        const { ModuleRegistry } = await import('./ModuleRegistry.js');

        this.eventBus = new EventBus({ enableLogging: this.options.debugMode });
        this.stateManager = new StateManager({
            persistence: this.options.persistState,
            storageKey: 'upps_app_state'
        });
        this.moduleRegistry = new ModuleRegistry(this.eventBus, this.stateManager);

        this.log('Core systems initialized');
    }

    /**
     * Alpine.js統合の初期化
     */
    async _initializeAlpine() {
        if (typeof window === 'undefined' || !window.Alpine) {
            this.log('Alpine.js not available, skipping Alpine integration');
            return;
        }

        // アプリケーション状態をAlpine.jsストアとして設定
        this.stateManager.setState('app', this.applicationState);
        this.stateManager.bindToAlpine('app');
        
        this.log('Alpine.js integration initialized');
    }

    /**
     * ドメインモジュールの登録（プレースホルダー）
     */
    async _registerDomainModules() {
        // Phase 2で実装される各ドメインモジュールの登録
        // 現時点では空の実装
        this.log('Domain modules registration ready (Phase 2)');
    }

    /**
     * UIシステムの初期化
     */
    async _initializeUISystem() {
        // UI制御の初期設定
        this.applicationState.ui.loading = false;
        this.log('UI system initialized');
    }

    /**
     * イベントハンドラーの設定
     */
    _setupEventHandlers() {
        // アプリケーションレベルのイベントハンドリング
        this.eventBus.on('state:changed', (data) => {
            this.log('State changed', data);
        });

        this.eventBus.on('error', (error) => {
            this.showNotification(`エラーが発生しました: ${error.message}`, 'error');
        });

        this.log('Event handlers setup complete');
    }

    /**
     * アプリケーション状態の復元
     */
    async _restoreApplicationState() {
        if (this.options.persistState) {
            const savedState = this.stateManager.getState('app');
            if (savedState) {
                this.applicationState = { ...this.applicationState, ...savedState };
                this.log('Application state restored');
            }
        }
    }

    /**
     * アプリケーション状態の保存
     */
    async _saveApplicationState() {
        if (this.options.persistState) {
            this.stateManager.setState('app', this.applicationState);
            this.stateManager.save();
            this.log('Application state saved');
        }
    }

    /**
     * UIのクリーンアップ
     */
    _cleanupUI() {
        this.activeModals.clear();
        this.applicationState.ui.modalStack = [];
        this.applicationState.ui.notifications = [];
        this.log('UI cleaned up');
    }

    /**
     * UI状態とAlpine.jsの同期
     */
    _syncUIState() {
        if (this.stateManager) {
            this.stateManager.setState('app.ui', this.applicationState.ui);
        }
    }

    /**
     * 通知の削除
     */
    _removeNotification(id) {
        const index = this.applicationState.ui.notifications.findIndex(n => n.id === id);
        if (index !== -1) {
            this.applicationState.ui.notifications.splice(index, 1);
            this.eventBus.emit('notification:hide', { id });
            this._syncUIState();
        }
    }

    /**
     * デフォルトペルソナデータ
     */
    _getDefaultPersonaData() {
        return {
            version: "2025.3",
            personal_info: {
                name: "",
                age: null,
                gender: "",
                occupation: ""
            },
            background: "",
            current_emotion_state: {},
            emotion_system: { model: "Ekman", emotions: {} },
            personality: { model: "Big Five", traits: {} },
            memory_system: { memories: [] },
            association_system: { associations: [] },
            cognitive_system: { model: "WAIS-IV", abilities: {} }
        };
    }

    /**
     * ログ出力
     */
    log(message, data = null) {
        if (data !== null) {
            console.debug(`AppController: ${message}`, data);
        } else {
            console.debug(`AppController: ${message}`);
        }
    }
}

// ES6モジュールとしてエクスポート
export { AppController };