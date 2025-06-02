/**
 * TabController.js - UPPS新アーキテクチャ タブ管理システム
 * 
 * タブのライフサイクル管理、状態保存・復元、Alpine.js統合を提供
 * インターフェース定義書準拠実装
 */

class TabController {
    constructor() {
        this.name = 'TabController';
        
        // サポートされているタブ
        this.supportedTabs = ['basic', 'emotion', 'personality', 'memory', 'association', 'cognitive'];
        
        // タブ設定
        this.tabConfig = {
            basic: {
                id: 'basic',
                name: '基本情報',
                icon: 'user',
                template: '/tabs/basic.html',
                dependencies: [],
                lazy: false
            },
            emotion: {
                id: 'emotion',
                name: '感情',
                icon: 'heart',
                template: '/tabs/emotion.html',
                dependencies: ['EmotionModule'],
                lazy: true
            },
            personality: {
                id: 'personality',
                name: '性格',
                icon: 'brain',
                template: '/tabs/personality.html',
                dependencies: [],
                lazy: true
            },
            memory: {
                id: 'memory',
                name: '記憶',
                icon: 'book-open',
                template: '/tabs/memory.html',
                dependencies: ['MemoryModule'],
                lazy: true
            },
            association: {
                id: 'association',
                name: '関連性',
                icon: 'share-2',
                template: '/tabs/association.html',
                dependencies: ['MemoryModule', 'AssociationModule'],
                lazy: true
            },
            cognitive: {
                id: 'cognitive',
                name: '認知能力',
                icon: 'zap',
                template: '/tabs/cognitive.html',
                dependencies: ['CognitiveModule'],
                lazy: true
            }
        };
        
        // タブ状態管理
        this.tabStates = new Map(); // tabId -> state
        this.tabHistory = [];
        this.loadedTabs = new Set();
        this.activeTab = null;
        
        // ライフサイクルコールバック
        this.enterCallbacks = new Map(); // tabId -> Set<callback>
        this.leaveCallbacks = new Map(); // tabId -> Set<callback>
        
        // コアシステム
        this.eventBus = null;
        this.stateManager = null;
        this.moduleRegistry = null;
        this.isInitialized = false;
        
        this.log('TabController created');
    }

    /**
     * TabControllerの初期化
     * @param {EventBus} eventBus - イベントバス
     * @param {StateManager} stateManager - 状態管理
     * @param {ModuleRegistry} moduleRegistry - モジュールレジストリ
     */
    async initialize(eventBus, stateManager, moduleRegistry) {
        if (this.isInitialized) {
            this.log('TabController already initialized');
            return;
        }

        this.eventBus = eventBus;
        this.stateManager = stateManager;
        this.moduleRegistry = moduleRegistry;

        // イベントハンドラーの設定
        this._setupEventHandlers();

        // Alpine.js統合
        this._setupAlpineIntegration();

        // 初期状態の復元
        this._restoreState();

        this.isInitialized = true;
        this.log('TabController initialized successfully');
        
        this.eventBus.emit('tab:controller:initialized');
    }

    /**
     * タブを読み込み
     * @param {string} tabId - タブID
     * @returns {Promise<void>}
     */
    async loadTab(tabId) {
        if (!this.supportedTabs.includes(tabId)) {
            throw new Error(`Unsupported tab: ${tabId}`);
        }

        if (this.loadedTabs.has(tabId)) {
            this.log(`Tab '${tabId}' already loaded`);
            return;
        }

        const config = this.tabConfig[tabId];
        
        try {
            this.log(`Loading tab: ${tabId}`);
            
            // 依存モジュールの確認
            await this._ensureDependencies(config.dependencies);
            
            // テンプレートの読み込み（lazy loadingの場合）
            if (config.lazy) {
                await this._loadTabTemplate(tabId);
            }
            
            // タブ状態の初期化
            this._initializeTabState(tabId);
            
            // Alpine.jsデータの初期化
            this._initializeAlpineData(tabId);
            
            this.loadedTabs.add(tabId);
            
            this.log(`Tab '${tabId}' loaded successfully`);
            this.eventBus.emit('tab:loaded', { tabId });
            
        } catch (error) {
            this.log(`Failed to load tab '${tabId}': ${error.message}`);
            this.eventBus.emit('tab:load:failed', { tabId, error: error.message });
            throw error;
        }
    }

    /**
     * タブをアンロード
     * @param {string} tabId - タブID
     */
    unloadTab(tabId) {
        if (!this.loadedTabs.has(tabId)) {
            this.log(`Tab '${tabId}' not loaded`);
            return;
        }

        // アクティブタブの場合は切り替え
        if (this.activeTab === tabId) {
            const fallbackTab = this.tabHistory[this.tabHistory.length - 2] || 'basic';
            this.switchTab(fallbackTab);
        }

        // 状態の保存
        this.saveTabState(tabId);

        // タブのクリーンアップ
        this._cleanupTab(tabId);

        this.loadedTabs.delete(tabId);
        
        this.log(`Tab '${tabId}' unloaded`);
        this.eventBus.emit('tab:unloaded', { tabId });
    }

    /**
     * タブを切り替え
     * @param {string} tabId - 切り替え先のタブID
     * @returns {Promise<void>}
     */
    async switchTab(tabId) {
        if (!this.supportedTabs.includes(tabId)) {
            throw new Error(`Unsupported tab: ${tabId}`);
        }

        if (this.activeTab === tabId) {
            this.log(`Tab '${tabId}' already active`);
            return;
        }

        const previousTab = this.activeTab;
        
        try {
            this.log(`Switching tab from '${previousTab}' to '${tabId}'`);
            
            // 切り替え前のイベント
            this.eventBus.emit('tab:before:change', { 
                from: previousTab, 
                to: tabId 
            });

            // 前のタブの終了処理
            if (previousTab) {
                await this._executeTabLeave(previousTab);
            }

            // タブが読み込まれていない場合は読み込み
            if (!this.loadedTabs.has(tabId)) {
                await this.loadTab(tabId);
            }

            // タブの表示切り替え
            this._updateTabVisibility(previousTab, tabId);

            // 新しいタブの開始処理
            await this._executeTabEnter(tabId);

            // 状態の更新
            this.activeTab = tabId;
            this._updateTabHistory(tabId);
            
            // StateManagerとの同期
            this.stateManager.setState('app.activeTab', tabId);

            // Alpine.jsストアとの同期
            if (window.Alpine && Alpine.store('app')) {
                Alpine.store('app').activeTab = tabId;
            }

            this.log(`Tab switched to '${tabId}'`);
            this.eventBus.emit('tab:changed', { 
                from: previousTab, 
                to: tabId 
            });

        } catch (error) {
            this.log(`Tab switch failed: ${error.message}`);
            this.eventBus.emit('tab:change:failed', { 
                from: previousTab, 
                to: tabId, 
                error: error.message 
            });
            throw error;
        }
    }

    /**
     * タブ状態を保存
     * @param {string} tabId - タブID
     */
    saveTabState(tabId) {
        if (!this.loadedTabs.has(tabId)) {
            return;
        }

        try {
            const tabElement = document.getElementById(`${tabId}-tab`);
            if (!tabElement) {
                return;
            }

            // フォームデータの収集
            const formData = this._collectFormData(tabElement);
            
            // スクロール位置の保存
            const scrollTop = tabElement.scrollTop || 0;
            
            // タブ固有状態の保存
            const tabState = {
                formData,
                scrollTop,
                lastModified: Date.now(),
                version: '1.0'
            };

            this.tabStates.set(tabId, tabState);
            
            // StateManagerへの永続化
            this.stateManager.setState(`tabs.${tabId}`, tabState);

            this.log(`Tab state saved: ${tabId}`);
            this.eventBus.emit('tab:state:saved', { tabId, state: tabState });

        } catch (error) {
            this.log(`Failed to save tab state for '${tabId}': ${error.message}`);
        }
    }

    /**
     * タブ状態を復元
     * @param {string} tabId - タブID
     */
    restoreTabState(tabId) {
        const savedState = this.tabStates.get(tabId) || 
                          this.stateManager.getState(`tabs.${tabId}`);
        
        if (!savedState) {
            this.log(`No saved state for tab: ${tabId}`);
            return;
        }

        try {
            const tabElement = document.getElementById(`${tabId}-tab`);
            if (!tabElement) {
                return;
            }

            // フォームデータの復元
            this._restoreFormData(tabElement, savedState.formData);

            // スクロール位置の復元
            if (savedState.scrollTop) {
                tabElement.scrollTop = savedState.scrollTop;
            }

            this.log(`Tab state restored: ${tabId}`);
            this.eventBus.emit('tab:state:restored', { tabId, state: savedState });

        } catch (error) {
            this.log(`Failed to restore tab state for '${tabId}': ${error.message}`);
        }
    }

    /**
     * タブ履歴を取得
     * @returns {Array} タブ履歴
     */
    getTabHistory() {
        return [...this.tabHistory];
    }

    /**
     * タブ入場時のコールバックを登録
     * @param {string} tabId - タブID
     * @param {Function} callback - コールバック関数
     */
    onTabEnter(tabId, callback) {
        if (!this.enterCallbacks.has(tabId)) {
            this.enterCallbacks.set(tabId, new Set());
        }
        
        this.enterCallbacks.get(tabId).add(callback);
        
        this.log(`Tab enter callback registered: ${tabId}`);
    }

    /**
     * タブ退場時のコールバックを登録
     * @param {string} tabId - タブID
     * @param {Function} callback - コールバック関数
     */
    onTabLeave(tabId, callback) {
        if (!this.leaveCallbacks.has(tabId)) {
            this.leaveCallbacks.set(tabId, new Set());
        }
        
        this.leaveCallbacks.get(tabId).add(callback);
        
        this.log(`Tab leave callback registered: ${tabId}`);
    }

    /**
     * 現在のアクティブタブを取得
     * @returns {string|null} アクティブタブID
     */
    getActiveTab() {
        return this.activeTab;
    }

    /**
     * タブが読み込まれているかチェック
     * @param {string} tabId - タブID
     * @returns {boolean} 読み込み状況
     */
    isTabLoaded(tabId) {
        return this.loadedTabs.has(tabId);
    }

    /**
     * タブ設定を取得
     * @param {string} tabId - タブID
     * @returns {Object|null} タブ設定
     */
    getTabConfig(tabId) {
        return this.tabConfig[tabId] || null;
    }

    // ==================== 内部メソッド ====================

    /**
     * イベントハンドラーの設定
     */
    _setupEventHandlers() {
        // アプリケーション初期化時のデフォルトタブ読み込み
        this.eventBus.on('app:started', async () => {
            const defaultTab = this.stateManager.getState('app.activeTab') || 'basic';
            await this.switchTab(defaultTab);
        });

        // Alpine.jsからのタブ切り替え要求
        this.eventBus.on('alpine:tab:switch', async (data) => {
            await this.switchTab(data.tabId);
        });

        // データ変更時の自動保存
        this.eventBus.on('data:changed', () => {
            if (this.activeTab) {
                this.saveTabState(this.activeTab);
            }
        });

        // ウィンドウ終了時の状態保存
        if (typeof window !== 'undefined') {
            window.addEventListener('beforeunload', () => {
                this.loadedTabs.forEach(tabId => {
                    this.saveTabState(tabId);
                });
            });
        }

        this.log('Event handlers setup complete');
    }

    /**
     * Alpine.js統合の設定
     */
    _setupAlpineIntegration() {
        if (typeof window === 'undefined' || !window.Alpine) {
            this.log('Alpine.js not available, skipping integration');
            return;
        }

        // Alpine.jsデータにタブコントローラーを追加
        Alpine.data('tabController', () => ({
            activeTab: this.activeTab,
            loadedTabs: Array.from(this.loadedTabs),
            
            switchTab: async (tabId) => {
                await this.switchTab(tabId);
                this.activeTab = tabId;
            },
            
            isActiveTab: (tabId) => {
                return this.activeTab === tabId;
            },
            
            isTabLoaded: (tabId) => {
                return this.loadedTabs.has(tabId);
            },
            
            getTabConfig: (tabId) => {
                return this.getTabConfig(tabId);
            }
        }));

        this.log('Alpine.js integration setup complete');
    }

    /**
     * 状態の復元
     */
    _restoreState() {
        // タブ履歴の復元
        const savedHistory = this.stateManager.getState('tabs.history');
        if (savedHistory && Array.isArray(savedHistory)) {
            this.tabHistory = savedHistory;
        }

        // アクティブタブの復元
        const savedActiveTab = this.stateManager.getState('app.activeTab');
        if (savedActiveTab && this.supportedTabs.includes(savedActiveTab)) {
            this.activeTab = savedActiveTab;
        }

        this.log('State restored');
    }

    /**
     * 依存関係の確認
     * @param {Array} dependencies - 依存モジュール一覧
     */
    async _ensureDependencies(dependencies) {
        for (const moduleName of dependencies) {
            if (!this.moduleRegistry.has(moduleName)) {
                throw new Error(`Required module not found: ${moduleName}`);
            }

            // モジュールが開始されていない場合は開始
            const moduleState = this.moduleRegistry.moduleStates.get(moduleName);
            if (moduleState !== 'started') {
                await this.moduleRegistry.loadModule(moduleName);
            }
        }
    }

    /**
     * タブテンプレートの読み込み
     * @param {string} tabId - タブID
     */
    async _loadTabTemplate(tabId) {
        const config = this.tabConfig[tabId];
        const tabContainer = document.getElementById(`${tabId}-tab`);
        
        if (!tabContainer) {
            throw new Error(`Tab container not found: ${tabId}-tab`);
        }

        // テンプレートが既に読み込まれている場合はスキップ
        if (tabContainer.hasAttribute('data-template-loaded')) {
            return;
        }

        try {
            // 実際の実装では、HTMLテンプレートの動的読み込みを行う
            // ここでは簡略化してマーカーのみ設定
            tabContainer.setAttribute('data-template-loaded', 'true');
            
            this.log(`Template loaded for tab: ${tabId}`);
            
        } catch (error) {
            throw new Error(`Failed to load template for tab '${tabId}': ${error.message}`);
        }
    }

    /**
     * タブ状態の初期化
     * @param {string} tabId - タブID
     */
    _initializeTabState(tabId) {
        if (!this.tabStates.has(tabId)) {
            this.tabStates.set(tabId, {
                formData: {},
                scrollTop: 0,
                lastModified: Date.now(),
                version: '1.0'
            });
        }
    }

    /**
     * Alpine.jsデータの初期化
     * @param {string} tabId - タブID
     */
    _initializeAlpineData(tabId) {
        if (typeof window === 'undefined' || !window.Alpine) {
            return;
        }

        // タブ固有のAlpine.jsデータを初期化
        const tabElement = document.getElementById(`${tabId}-tab`);
        if (tabElement && !tabElement._x_dataStack) {
            Alpine.initTree(tabElement);
        }
    }

    /**
     * タブの表示切り替え
     * @param {string} previousTab - 前のタブID
     * @param {string} newTab - 新しいタブID
     */
    _updateTabVisibility(previousTab, newTab) {
        // 前のタブを非表示
        if (previousTab) {
            const prevElement = document.getElementById(`${previousTab}-tab`);
            if (prevElement) {
                prevElement.style.display = 'none';
                prevElement.classList.remove('active');
            }

            const prevButton = document.querySelector(`[data-tab="${previousTab}"]`);
            if (prevButton) {
                prevButton.classList.remove('active');
            }
        }

        // 新しいタブを表示
        const newElement = document.getElementById(`${newTab}-tab`);
        if (newElement) {
            newElement.style.display = 'block';
            newElement.classList.add('active');
        }

        const newButton = document.querySelector(`[data-tab="${newTab}"]`);
        if (newButton) {
            newButton.classList.add('active');
        }
    }

    /**
     * タブ入場処理の実行
     * @param {string} tabId - タブID
     */
    async _executeTabEnter(tabId) {
        // 状態の復元
        this.restoreTabState(tabId);

        // コールバックの実行
        const callbacks = this.enterCallbacks.get(tabId);
        if (callbacks) {
            for (const callback of callbacks) {
                try {
                    await callback();
                } catch (error) {
                    this.log(`Tab enter callback error for '${tabId}': ${error.message}`);
                }
            }
        }

        this.eventBus.emit('tab:entered', { tabId });
    }

    /**
     * タブ退場処理の実行
     * @param {string} tabId - タブID
     */
    async _executeTabLeave(tabId) {
        // 状態の保存
        this.saveTabState(tabId);

        // コールバックの実行
        const callbacks = this.leaveCallbacks.get(tabId);
        if (callbacks) {
            for (const callback of callbacks) {
                try {
                    await callback();
                } catch (error) {
                    this.log(`Tab leave callback error for '${tabId}': ${error.message}`);
                }
            }
        }

        this.eventBus.emit('tab:left', { tabId });
    }

    /**
     * タブ履歴の更新
     * @param {string} tabId - タブID
     */
    _updateTabHistory(tabId) {
        // 履歴から既存のエントリを削除
        const existingIndex = this.tabHistory.indexOf(tabId);
        if (existingIndex !== -1) {
            this.tabHistory.splice(existingIndex, 1);
        }

        // 先頭に追加
        this.tabHistory.unshift(tabId);

        // 履歴サイズを制限（最大10件）
        if (this.tabHistory.length > 10) {
            this.tabHistory = this.tabHistory.slice(0, 10);
        }

        // StateManagerに保存
        this.stateManager.setState('tabs.history', this.tabHistory);
    }

    /**
     * フォームデータの収集
     * @param {Element} container - コンテナ要素
     * @returns {Object} フォームデータ
     */
    _collectFormData(container) {
        const formData = {};
        
        const inputs = container.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            const name = input.name || input.id;
            if (name) {
                if (input.type === 'checkbox' || input.type === 'radio') {
                    formData[name] = input.checked;
                } else {
                    formData[name] = input.value;
                }
            }
        });

        return formData;
    }

    /**
     * フォームデータの復元
     * @param {Element} container - コンテナ要素
     * @param {Object} formData - フォームデータ
     */
    _restoreFormData(container, formData) {
        if (!formData) return;

        Object.entries(formData).forEach(([name, value]) => {
            const input = container.querySelector(`[name="${name}"], #${name}`);
            if (input) {
                if (input.type === 'checkbox' || input.type === 'radio') {
                    input.checked = value;
                } else {
                    input.value = value;
                }

                // Alpine.jsのリアクティブ更新をトリガー
                input.dispatchEvent(new Event('input', { bubbles: true }));
            }
        });
    }

    /**
     * タブのクリーンアップ
     * @param {string} tabId - タブID
     */
    _cleanupTab(tabId) {
        // イベントリスナーのクリーンアップ
        this.enterCallbacks.delete(tabId);
        this.leaveCallbacks.delete(tabId);

        // DOM要素のクリーンアップ
        const tabElement = document.getElementById(`${tabId}-tab`);
        if (tabElement) {
            // Alpine.jsデータのクリーンアップ
            if (typeof window !== 'undefined' && window.Alpine) {
                Alpine.destroyTree(tabElement);
            }
        }

        this.log(`Tab cleaned up: ${tabId}`);
    }

    /**
     * ログ出力
     */
    log(message, data = null) {
        if (data !== null) {
            console.debug(`TabController: ${message}`, data);
        } else {
            console.debug(`TabController: ${message}`);
        }
    }
}

// ES6モジュールとしてエクスポート
export { TabController };