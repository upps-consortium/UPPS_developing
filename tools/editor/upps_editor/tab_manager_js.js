// js/ui/tab_manager.js
// タブ管理専用システム

/**
 * タブ管理クラス
 */
class TabManager {
    constructor() {
        this.currentTab = 'basic';
        this.tabHistory = ['basic'];
        this.tabStates = new Map();
        this.loadingStates = new Map();
        this.initialized = false;
    }
    
    /**
     * タブマネージャを初期化
     */
    initialize() {
        if (this.initialized) return;
        
        // タブ状態の初期化
        this.initializeTabStates();
        
        // イベントリスナーの設定
        this.setupEventListeners();
        
        this.initialized = true;
        window.UPPS_LOG.info('Tab manager initialized');
    }
    
    /**
     * タブ状態を初期化
     */
    initializeTabStates() {
        const tabs = window.UPPS_TABS || [];
        
        tabs.forEach(tab => {
            this.tabStates.set(tab.id, {
                loaded: false,
                initialized: false,
                lastAccessed: null,
                scrollPosition: 0,
                formData: {},
                errors: {}
            });
            
            this.loadingStates.set(tab.id, false);
        });
        
        // 基本情報タブは初期状態で読み込み済みとする
        const basicState = this.tabStates.get('basic');
        if (basicState) {
            basicState.loaded = true;
            basicState.initialized = true;
            basicState.lastAccessed = Date.now();
        }
    }
    
    /**
     * タブコンテンツを読み込み
     * @param {string} tabId タブID
     * @returns {Promise<boolean>} 読み込み成功の可否
     */
    async loadTabContent(tabId) {
        if (!tabId || this.loadingStates.get(tabId)) {
            return false;
        }
        
        // 読み込み状態を設定
        this.loadingStates.set(tabId, true);
        
        try {
            window.UPPS_LOG.debug('Loading tab content', { tabId });
            
            // タブファイルを読み込み
            const response = await fetch(`js/tabs/${tabId}.html`);
            if (!response.ok) {
                throw new Error(`Failed to load tab content: ${response.status} ${response.statusText}`);
            }
            
            const content = await response.text();
            
            // コンテンツを挿入
            const container = document.getElementById('tab-content');
            if (!container) {
                throw new Error('Tab content container not found');
            }
            
            container.innerHTML = content;
            
            // Lucideアイコンの初期化
            if (window.lucide) {
                window.lucide.createIcons();
            }
            
            // タブ状態を更新
            const tabState = this.tabStates.get(tabId);
            if (tabState) {
                tabState.loaded = true;
                tabState.lastAccessed = Date.now();
            }
            
            // タブ読み込み完了イベントを発火
            document.dispatchEvent(new CustomEvent('tabLoaded', { 
                detail: { tabId, success: true } 
            }));
            
            // タブ固有の初期化
            await this.initializeTabSpecific(tabId);
            
            // フォームハンドラーを初期化
            if (window.FormHandlers) {
                window.FormHandlers.initialize();
            }
            
            window.UPPS_LOG.info('Tab content loaded successfully', { tabId });
            return true;
            
        } catch (error) {
            window.UPPS_LOG.error('Error loading tab content', { tabId, error: error.message });
            
            // エラーメッセージを表示
            this.displayTabLoadError(tabId, error);
            
            // タブ読み込みエラーイベントを発火
            document.dispatchEvent(new CustomEvent('tabLoaded', { 
                detail: { tabId, success: false, error: error.message } 
            }));
            
            return false;
        } finally {
            this.loadingStates.set(tabId, false);
        }
    }
    
    /**
     * タブ固有の初期化処理
     * @param {string} tabId タブID
     */
    async initializeTabSpecific(tabId) {
        try {
            // 少し待ってからDOMが安定してから初期化
            await new Promise(resolve => setTimeout(resolve, 100));
            
            switch (tabId) {
                case 'cognitive':
                    await this.initializeCognitiveTab();
                    break;
                case 'association':
                    await this.initializeAssociationTab();
                    break;
                case 'emotion':
                    await this.initializeEmotionTab();
                    break;
                case 'memory':
                    await this.initializeMemoryTab();
                    break;
                case 'personality':
                    await this.initializePersonalityTab();
                    break;
                case 'basic':
                    await this.initializeBasicTab();
                    break;
            }
            
            // タブ状態を更新
            const tabState = this.tabStates.get(tabId);
            if (tabState) {
                tabState.initialized = true;
            }
            
            window.UPPS_LOG.debug('Tab specific initialization completed', { tabId });
            
        } catch (error) {
            window.UPPS_LOG.error('Error in tab specific initialization', { tabId, error: error.message });
        }
    }
    
    /**
     * 認知能力タブの初期化
     */
    async initializeCognitiveTab() {
        const editor = window.uppsEditor;
        if (!editor) return;
        
        // レーダーチャートの初期化
        if (typeof editor.initializeCognitiveRadarChart === 'function') {
            try {
                editor.initializeCognitiveRadarChart();
            } catch (error) {
                window.UPPS_LOG.warn('Failed to initialize cognitive radar chart', error);
            }
        }
    }
    
    /**
     * 関連性タブの初期化
     */
    async initializeAssociationTab() {
        const editor = window.uppsEditor;
        if (!editor) return;
        
        // ビジュアライザが開いている場合は更新
        if (editor.visualEditorOpen && typeof editor.refreshVisualizer === 'function') {
            try {
                editor.refreshVisualizer();
            } catch (error) {
                window.UPPS_LOG.warn('Failed to refresh visualizer', error);
            }
        }
    }
    
    /**
     * 感情システムタブの初期化
     */
    async initializeEmotionTab() {
        // スライダーの初期値設定
        this.updateSliderDisplays();
    }
    
    /**
     * 記憶システムタブの初期化
     */
    async initializeMemoryTab() {
        // 記憶カードのスタイルを適用
        this.applyMemoryCardStyles();
    }
    
    /**
     * 性格特性タブの初期化
     */
    async initializePersonalityTab() {
        // スライダーの初期値設定
        this.updateSliderDisplays();
    }
    
    /**
     * 基本情報タブの初期化
     */
    async initializeBasicTab() {
        // 特別な初期化は不要
    }
    
    /**
     * スライダー表示を更新
     */
    updateSliderDisplays() {
        const sliders = document.querySelectorAll('input[type="range"]');
        sliders.forEach(slider => {
            const value = parseFloat(slider.value);
            const max = parseFloat(slider.max) || 1;
            
            // CSS変数を更新
            if (max === 1) {
                slider.style.setProperty('--value', value * 100);
            } else {
                slider.style.setProperty('--value', value);
            }
        });
    }
    
    /**
     * 記憶カードスタイルを適用
     */
    applyMemoryCardStyles() {
        const memoryCards = document.querySelectorAll('.memory-card, .bento-card');
        memoryCards.forEach(card => {
            if (!card.classList.contains('memory-styled')) {
                card.classList.add('memory-styled');
            }
        });
    }
    
    /**
     * タブ切り替え
     * @param {string} newTabId 新しいタブID
     * @param {Object} options オプション
     * @returns {Promise<boolean>} 切り替え成功の可否
     */
    async switchTab(newTabId, options = {}) {
        const { 
            saveCurrentState = true, 
            skipAnimation = false,
            force = false 
        } = options;
        
        // 現在のタブと同じ場合はスキップ
        if (this.currentTab === newTabId && !force) {
            return true;
        }
        
        window.UPPS_LOG.debug('Switching tab', { 
            from: this.currentTab, 
            to: newTabId 
        });
        
        // 現在のタブ状態を保存
        if (saveCurrentState) {
            this.saveCurrentTabState();
        }
        
        try {
            // 新しいタブのコンテンツを読み込み
            const success = await this.loadTabContent(newTabId);
            
            if (success) {
                // タブ履歴を更新
                this.updateTabHistory(newTabId);
                
                // 現在のタブを更新
                const previousTab = this.currentTab;
                this.currentTab = newTabId;
                
                // タブ切り替えイベントを発火
                document.dispatchEvent(new CustomEvent('tabSwitched', {
                    detail: { 
                        previousTab, 
                        currentTab: newTabId,
                        success: true
                    }
                }));
                
                // 新しいタブの状態を復元
                this.restoreTabState(newTabId);
                
                window.UPPS_LOG.info('Tab switched successfully', { 
                    from: previousTab, 
                    to: newTabId 
                });
                
                return true;
            } else {
                throw new Error('Failed to load tab content');
            }
            
        } catch (error) {
            window.UPPS_LOG.error('Error switching tab', { 
                from: this.currentTab, 
                to: newTabId, 
                error: error.message 
            });
            
            // エラー通知
            if (window.NotificationManager) {
                window.NotificationManager.error(`タブの切り替えに失敗しました: ${error.message}`);
            }
            
            return false;
        }
    }
    
    /**
     * 現在のタブ状態を保存
     */
    saveCurrentTabState() {
        const tabState = this.tabStates.get(this.currentTab);
        if (!tabState) return;
        
        // スクロール位置を保存
        const container = document.getElementById('tab-content');
        if (container) {
            tabState.scrollPosition = container.scrollTop;
        }
        
        // フォームデータを保存
        const formElements = document.querySelectorAll('input, textarea, select');
        formElements.forEach(element => {
            if (element.name || element.id) {
                const key = element.name || element.id;
                if (element.type === 'checkbox' || element.type === 'radio') {
                    tabState.formData[key] = element.checked;
                } else {
                    tabState.formData[key] = element.value;
                }
            }
        });
        
        window.UPPS_LOG.debug('Tab state saved', { 
            tabId: this.currentTab, 
            scrollPosition: tabState.scrollPosition,
            formDataKeys: Object.keys(tabState.formData).length
        });
    }
    
    /**
     * タブ状態を復元
     * @param {string} tabId タブID
     */
    restoreTabState(tabId) {
        const tabState = this.tabStates.get(tabId);
        if (!tabState) return;
        
        // スクロール位置を復元
        setTimeout(() => {
            const container = document.getElementById('tab-content');
            if (container && tabState.scrollPosition > 0) {
                container.scrollTop = tabState.scrollPosition;
            }
        }, 100);
        
        // フォームデータを復元（必要に応じて）
        // 注意: Alpine.jsが管理するデータとの競合を避けるため、慎重に実装
        
        window.UPPS_LOG.debug('Tab state restored', { 
            tabId, 
            scrollPosition: tabState.scrollPosition 
        });
    }
    
    /**
     * タブ履歴を更新
     * @param {string} tabId タブID
     */
    updateTabHistory(tabId) {
        // 重複を削除
        this.tabHistory = this.tabHistory.filter(id => id !== tabId);
        
        // 新しいタブを先頭に追加
        this.tabHistory.unshift(tabId);
        
        // 履歴を最大10件に制限
        if (this.tabHistory.length > 10) {
            this.tabHistory = this.tabHistory.slice(0, 10);
        }
    }
    
    /**
     * 前のタブに戻る
     * @returns {Promise<boolean>} 成功の可否
     */
    async goToPreviousTab() {
        if (this.tabHistory.length < 2) {
            return false;
        }
        
        const previousTab = this.tabHistory[1];
        return await this.switchTab(previousTab);
    }
    
    /**
     * タブ読み込みエラーを表示
     * @param {string} tabId タブID
     * @param {Error} error エラー
     */
    displayTabLoadError(tabId, error) {
        const container = document.getElementById('tab-content');
        if (!container) return;
        
        const tabName = this.getTabDisplayName(tabId);
        
        container.innerHTML = `
            <div class="flex flex-col items-center justify-center h-64 text-center">
                <div class="mb-4">
                    <i data-lucide="alert-triangle" class="w-12 h-12 text-red-400"></i>
                </div>
                <h3 class="text-lg font-semibold text-white mb-2">タブの読み込みに失敗しました</h3>
                <p class="text-white/70 mb-4">${tabName}のコンテンツを読み込めませんでした。</p>
                <p class="text-red-400 text-sm mb-4">${error.message}</p>
                <div class="space-x-2">
                    <button onclick="window.TabManager.retryLoadTab('${tabId}')" 
                            class="glass px-4 py-2 rounded text-white hover:bg-white/10">
                        再試行
                    </button>
                    <button onclick="window.TabManager.switchTab('basic')" 
                            class="bg-indigo-500 hover:bg-indigo-600 px-4 py-2 rounded text-white">
                        基本情報に戻る
                    </button>
                </div>
            </div>
        `;
        
        // Lucideアイコンを初期化
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }
    
    /**
     * タブの再読み込みを試行
     * @param {string} tabId タブID
     * @returns {Promise<boolean>} 成功の可否
     */
    async retryLoadTab(tabId) {
        // タブ状態をリセット
        const tabState = this.tabStates.get(tabId);
        if (tabState) {
            tabState.loaded = false;
            tabState.initialized = false;
        }
        
        this.loadingStates.set(tabId, false);
        
        // 再読み込み
        return await this.loadTabContent(tabId);
    }
    
    /**
     * タブ表示名を取得
     * @param {string} tabId タブID
     * @returns {string} 表示名
     */
    getTabDisplayName(tabId) {
        const tab = window.UPPS_TABS?.find(t => t.id === tabId);
        return tab ? tab.label : tabId;
    }
    
    /**
     * イベントリスナーを設定
     */
    setupEventListeners() {
        // ウィンドウのbeforeunloadイベント
        window.addEventListener('beforeunload', () => {
            this.saveCurrentTabState();
        });
        
        // キーボードショートカット
        document.addEventListener('keydown', (event) => {
            this.handleKeyboardShortcuts(event);
        });
        
        // タブエラーのリカバリ
        document.addEventListener('tabLoaded', (event) => {
            const { tabId, success } = event.detail;
            
            if (!success) {
                // エラー処理
                window.UPPS_LOG.warn('Tab load failed, attempting recovery', { tabId });
            }
        });
    }
    
    /**
     * キーボードショートカットを処理
     * @param {KeyboardEvent} event キーボードイベント
     */
    handleKeyboardShortcuts(event) {
        // Ctrl+数字でタブ切り替え
        if (event.ctrlKey && event.key >= '1' && event.key <= '6') {
            event.preventDefault();
            
            const tabIndex = parseInt(event.key) - 1;
            const tabs = window.UPPS_TABS || [];
            
            if (tabIndex < tabs.length) {
                this.switchTab(tabs[tabIndex].id);
            }
        }
        
        // Ctrl+Tab で次のタブ
        if (event.ctrlKey && event.key === 'Tab' && !event.shiftKey) {
            event.preventDefault();
            this.switchToNextTab();
        }
        
        // Ctrl+Shift+Tab で前のタブ
        if (event.ctrlKey && event.shiftKey && event.key === 'Tab') {
            event.preventDefault();
            this.switchToPreviousTab();
        }
        
        // Alt+Left で前のタブに戻る
        if (event.altKey && event.key === 'ArrowLeft') {
            event.preventDefault();
            this.goToPreviousTab();
        }
    }
    
    /**
     * 次のタブに切り替え
     */
    async switchToNextTab() {
        const tabs = window.UPPS_TABS || [];
        const currentIndex = tabs.findIndex(tab => tab.id === this.currentTab);
        const nextIndex = (currentIndex + 1) % tabs.length;
        
        await this.switchTab(tabs[nextIndex].id);
    }
    
    /**
     * 前のタブに切り替え
     */
    async switchToPreviousTab() {
        const tabs = window.UPPS_TABS || [];
        const currentIndex = tabs.findIndex(tab => tab.id === this.currentTab);
        const prevIndex = (currentIndex - 1 + tabs.length) % tabs.length;
        
        await this.switchTab(tabs[prevIndex].id);
    }
    
    /**
     * 全てのタブをプリロード
     * @returns {Promise<void>}
     */
    async preloadAllTabs() {
        const tabs = window.UPPS_TABS || [];
        const loadPromises = tabs.map(tab => {
            if (!this.tabStates.get(tab.id)?.loaded) {
                return this.loadTabContent(tab.id);
            }
            return Promise.resolve(true);
        });
        
        try {
            await Promise.all(loadPromises);
            window.UPPS_LOG.info('All tabs preloaded successfully');
        } catch (error) {
            window.UPPS_LOG.warn('Some tabs failed to preload', error);
        }
    }
    
    /**
     * タブ統計を取得
     * @returns {Object} 統計情報
     */
    getTabStatistics() {
        const stats = {
            totalTabs: window.UPPS_TABS?.length || 0,
            loadedTabs: 0,
            initializedTabs: 0,
            currentTab: this.currentTab,
            tabHistory: [...this.tabHistory]
        };
        
        this.tabStates.forEach((state, tabId) => {
            if (state.loaded) stats.loadedTabs++;
            if (state.initialized) stats.initializedTabs++;
        });
        
        return stats;
    }
    
    /**
     * タブマネージャをクリーンアップ
     */
    cleanup() {
        // 現在のタブ状態を保存
        this.saveCurrentTabState();
        
        // 状態をクリア
        this.tabStates.clear();
        this.loadingStates.clear();
        this.tabHistory = [];
        
        this.initialized = false;
        
        window.UPPS_LOG.info('Tab manager cleaned up');
    }
}

// グローバルインスタンスを作成
window.TabManager = new TabManager();

// UPPSEditorプロトタイプに関数を追加
if (typeof UPPSEditor !== 'undefined') {
    UPPSEditor.prototype.loadTabContent = function(tabId) {
        return window.TabManager.loadTabContent(tabId);
    };
    
    UPPSEditor.prototype.initializeTabSpecific = function(tabId) {
        return window.TabManager.initializeTabSpecific(tabId);
    };
    
    UPPSEditor.prototype.switchTab = function(tabId, options = {}) {
        return window.TabManager.switchTab(tabId, options);
    };
    
    UPPSEditor.prototype.goToPreviousTab = function() {
        return window.TabManager.goToPreviousTab();
    };
}

// DOMContentLoadedでの初期化
document.addEventListener('DOMContentLoaded', () => {
    window.TabManager.initialize();
});

// ページアンロード時のクリーンアップ
window.addEventListener('beforeunload', () => {
    window.TabManager.cleanup();
});

window.UPPS_LOG.info('Tab manager module initialized');