// js/core/app.js
// メインのUPPSEditorアプリケーションクラス

/**
 * UPPSペルソナエディターのメインクラス
 */
function UPPSEditor() {
    return {
        // 基本状態
        persona: null,
        activeTab: 'basic',
        tabs: window.UPPS_TABS || [
            { id: 'basic', icon: 'user', label: '基本情報' },
            { id: 'emotion', icon: 'heart', label: '感情システム' },
            { id: 'personality', icon: 'brain', label: '性格特性' },
            { id: 'memory', icon: 'database', label: '記憶システム' },
            { id: 'association', icon: 'network', label: '関連性' },
            { id: 'cognitive', icon: 'activity', label: '認知能力' }
        ],
        darkMode: true,
        errors: {},
        showHelp: false,
        
        // ビジュアルエディタ関連
        visualEditorOpen: false,
        networkVisualization: null,
        selectedNode: null,
        selectedNodeType: null,
        selectedNodeData: null,
        
        // 外部トリガー用データ
        externalItems: {},
        
        /**
         * アプリケーションの初期化
         */
        init() {
            console.log('Initializing UPPS Persona Editor...');
            window.UPPS_LOG?.info('Initializing UPPS Persona Editor');
            
            // エラー状態をクリア
            this.errors = {};
            
            // ストレージが利用可能かチェック
            if (!this.isStorageAvailable()) {
                this.showNotification('ローカルストレージが利用できません。データの保存ができない可能性があります。', 'warning');
            }
            
            // ペルソナデータの読み込み
            const loaded = this.loadPersonaFromStorage();
            if (!loaded) {
                // データがなければデフォルトで初期化
                this.initializeWithDefaults();
            }
            
            // タブコンテンツの読み込み
            this.loadTabContent(this.activeTab);
            
            // 自動保存の開始
            this.startAutoSave();
            
            // グローバル変数として設定（重要：統一された名前）
            window.uppsEditor = this;
            
            console.log('UPPS Persona Editor initialized successfully');
            window.UPPS_LOG?.info('UPPS Persona Editor initialized successfully');
        },

        /**
         * ストレージが利用可能かチェック
         */
        isStorageAvailable() {
            try {
                const test = '__storage_test__';
                localStorage.setItem(test, test);
                localStorage.removeItem(test);
                return true;
            } catch (error) {
                console.error('Local storage not available:', error);
                return false;
            }
        },
        
        /**
         * デフォルトデータで初期化
         */
        initializeWithDefaults() {
            this.persona = this.getDefaultPersona();
            
            // 感情システムの初期化
            this.handleEmotionModelChange();
            
            // 認知システムの初期化  
            this.handleCognitiveModelChange();
            
            // 感情状態をベースラインから初期化
            this.syncEmotionState();
            
            console.log('Persona initialized with default values');
            window.UPPS_LOG?.info('Persona initialized with default values');
        },

        /**
         * デフォルトペルソナデータを取得
         */
        getDefaultPersona() {
            if (window.PersonaData && typeof window.PersonaData.getDefaultPersona === 'function') {
                return window.PersonaData.getDefaultPersona();
            }
            
            // フォールバック用のデフォルトデータ
            return {
                version: '2025.2',
                personal_info: {
                    name: '',
                    age: null,
                    gender: '',
                    occupation: ''
                },
                background: '',
                current_emotion_state: {},
                emotion_system: {
                    model: 'Ekman',
                    emotions: {
                        joy: { baseline: 60, description: '喜び、幸福感、達成感を表します。' },
                        sadness: { baseline: 30, description: '悲しみ、喪失感、失望を表します。' },
                        anger: { baseline: 25, description: '怒り、不満、憤りを表します。' },
                        fear: { baseline: 40, description: '恐怖、不安、心配を表します。' },
                        disgust: { baseline: 20, description: '嫌悪、拒否反応を表します。' },
                        surprise: { baseline: 50, description: '驚き、予期しない反応を表します。' }
                    }
                },
                personality: {
                    model: 'Big Five',
                    traits: {
                        openness: 0.7,
                        conscientiousness: 0.6,
                        extraversion: 0.4,
                        agreeableness: 0.65,
                        neuroticism: 0.35
                    }
                },
                memory_system: {
                    memories: []
                },
                association_system: {
                    associations: []
                },
                cognitive_system: {
                    model: 'WAIS-IV',
                    abilities: {
                        verbal_comprehension: { level: 75, description: '言語理解、語彙力、知識の蓄積を表します。' },
                        perceptual_reasoning: { level: 70, description: '視覚的・空間的な情報処理、パターン認識を表します。' },
                        working_memory: { level: 65, description: '情報の一時的保持と操作、注意集中力を表します。' },
                        processing_speed: { level: 80, description: '情報処理の速度、効率を表します。' }
                    }
                }
            };
        },
        
        /**
         * ローカルストレージからペルソナを読み込み
         * @returns {boolean} 読み込み成功の可否
         */
        loadPersonaFromStorage() {
            if (window.storageManager && typeof window.storageManager.loadPersona === 'function') {
                const loadedPersona = window.storageManager.loadPersona();
                if (loadedPersona) {
                    this.persona = loadedPersona;
                    return true;
                }
            }
            return false;
        },
        
        /**
         * 自動保存を開始
         */
        startAutoSave() {
            if (window.storageManager && typeof window.storageManager.startAutoSave === 'function') {
                window.storageManager.startAutoSave(() => {
                    if (this.persona) {
                        window.storageManager.savePersona(this.persona);
                    }
                });
            }
        },
        
        /**
         * タブコンテンツの読み込み
         * @param {string} tabId タブID
         */
        async loadTabContent(tabId) {
            try {
                console.log('Loading tab content:', tabId);
                
                const response = await fetch(`js/tabs/${tabId}.html`);
                if (!response.ok) {
                    throw new Error(`Failed to load tab content: ${response.status}`);
                }
                
                const content = await response.text();
                const container = document.getElementById('tab-content');
                if (container) {
                    container.innerHTML = content;
                    
                    // Lucideアイコンの初期化
                    if (window.lucide) {
                        lucide.createIcons();
                    }
                    
                    // タブ読み込み完了イベントの発火
                    document.dispatchEvent(new CustomEvent('tabLoaded', { detail: { tabId } }));
                    
                    // 特定のタブの追加初期化
                    this.initializeTabSpecific(tabId);
                    
                    console.log('Tab content loaded successfully:', tabId);
                }
                
            } catch (error) {
                console.error('Error loading tab content:', error);
                const container = document.getElementById('tab-content');
                if (container) {
                    container.innerHTML = `
                        <div class="p-4 text-red-500">
                            <p>タブコンテンツの読み込みに失敗しました。</p>
                            <p>${error.message}</p>
                        </div>
                    `;
                }
            }
        },
        
        /**
         * タブ固有の初期化処理
         * @param {string} tabId タブID
         */
        initializeTabSpecific(tabId) {
            setTimeout(() => {
                switch (tabId) {
                    case 'cognitive':
                        if (typeof this.initializeCognitiveRadarChart === 'function') {
                            this.initializeCognitiveRadarChart();
                        }
                        break;
                    case 'association':
                        if (this.visualEditorOpen && typeof this.refreshVisualizer === 'function') {
                            this.refreshVisualizer();
                        }
                        break;
                }
            }, 100);
        },

        /**
         * 感情モデル変更処理
         */
        handleEmotionModelChange() {
            if (window.EmotionSystem && typeof window.EmotionSystem.initializeEmotionModel === 'function') {
                window.EmotionSystem.initializeEmotionModel(this.persona);
            } else {
                console.log('EmotionSystem not available, using default initialization');
            }
        },

        /**
         * 認知モデル変更処理
         */
        handleCognitiveModelChange() {
            if (window.CognitiveSystem && typeof window.CognitiveSystem.initializeCognitiveSystem === 'function') {
                window.CognitiveSystem.initializeCognitiveSystem(this.persona);
            } else {
                console.log('CognitiveSystem not available, using default initialization');
            }
        },

        /**
         * 感情状態をベースラインから同期
         */
        syncEmotionState() {
            if (window.EmotionSystem && typeof window.EmotionSystem.syncEmotionState === 'function') {
                window.EmotionSystem.syncEmotionState(this.persona);
            } else {
                console.log('EmotionSystem not available for syncing emotion state');
            }
        },
        
        /**
         * テーマの切り替え
         */
        toggleTheme() {
            this.darkMode = !this.darkMode;
            console.log('Theme toggled:', { darkMode: this.darkMode });
            window.UPPS_LOG?.info('Theme toggled', { darkMode: this.darkMode });
        },
        
        /**
         * ヘルプモーダルの表示
         */
        showHelpModal() {
            this.showHelp = true;
        },
        
        /**
         * ヘルプモーダルを閉じる
         */
        closeHelpModal() {
            this.showHelp = false;
        },
        
        /**
         * ファイルインポート
         */
        async loadFile() {
            try {
                if (window.PersonaImporter && typeof window.PersonaImporter.importFromFile === 'function') {
                    const data = await window.PersonaImporter.importFromFile();
                    
                    // データの処理とマージ
                    this.persona = this.processImportedData(data);
                    
                    // 通知
                    this.showNotification('ファイルを読み込みました', 'success');
                    
                    // タブコンテンツを再読み込み
                    this.loadTabContent(this.activeTab);
                } else {
                    throw new Error('PersonaImporter not available');
                }
                
            } catch (error) {
                console.error('Error loading file:', error);
                this.showNotification('ファイルの読み込みに失敗しました: ' + error.message, 'error');
            }
        },

        /**
         * インポートデータを処理
         */
        processImportedData(data) {
            if (window.storageManager && typeof window.storageManager.processImportedData === 'function') {
                return window.storageManager.processImportedData(data);
            }
            return data;
        },
        
        /**
         * ラベル取得のヘルパーメソッド
         */
        getEmotionLabel: (emotionId) => window.UPPS_HELPERS?.getEmotionLabel?.(emotionId) || emotionId,
        getEmotionIcon: (emotionId) => window.UPPS_HELPERS?.getEmotionIcon?.(emotionId) || 'circle',
        getTraitLabel: (traitId) => window.UPPS_HELPERS?.getTraitLabel?.(traitId) || traitId,
        getTraitDescription: (traitId) => window.UPPS_HELPERS?.getTraitDescription?.(traitId) || '',
        getAbilityLabel: (abilityId) => window.UPPS_HELPERS?.getAbilityLabel?.(abilityId) || abilityId,
        getAbilityDescription: (abilityId) => window.UPPS_HELPERS?.getAbilityDescription?.(abilityId) || '',
        
        /**
         * YAMLプレビューの生成
         * @returns {string} YAML文字列
         */
        generateYAML() {
            if (!this.persona) return '';
            
            try {
                if (typeof jsyaml !== 'undefined') {
                    return jsyaml.dump(this.persona, {
                        indent: 2,
                        lineWidth: -1,
                        noRefs: true,
                        sortKeys: true
                    });
                } else {
                    return JSON.stringify(this.persona, null, 2);
                }
            } catch (error) {
                console.error('Error generating YAML:', error);
                return 'エラー: YAML生成に失敗しました';
            }
        },
        
        /**
         * ペルソナの保存
         */
        savePersona() {
            if (!this.persona) {
                this.showNotification('保存するデータがありません', 'warning');
                return false;
            }
            
            if (window.storageManager && typeof window.storageManager.savePersona === 'function') {
                const success = window.storageManager.savePersona(this.persona);
                
                if (success) {
                    this.showNotification('ペルソナを保存しました', 'success');
                } else {
                    this.showNotification('保存に失敗しました', 'error');
                }
                
                return success;
            } else {
                this.showNotification('ストレージシステムが利用できません', 'error');
                return false;
            }
        },
        
        /**
         * バリデーションと保存
         */
        validateAndSavePersona() {
            if (window.PersonaValidator && typeof window.PersonaValidator.validatePersona === 'function') {
                // バリデーションを実行
                const errors = window.PersonaValidator.validatePersona(this.persona);
                
                // エラーがあれば表示して保存しない
                if (Object.keys(errors).length > 0) {
                    if (typeof window.PersonaValidator.displayValidationErrors === 'function') {
                        window.PersonaValidator.displayValidationErrors(errors);
                    }
                    this.showNotification('入力内容に問題があります', 'error');
                    return false;
                }
            }
            
            // エラーがなければ保存
            return this.savePersona();
        },
        
        /**
         * ローカルストレージのクリア
         */
        clearLocalStorage() {
            if (confirm('保存したデータをすべて削除しますか？この操作は元に戻せません。')) {
                if (window.storageManager && typeof window.storageManager.clearStorage === 'function') {
                    const success = window.storageManager.clearStorage();
                    
                    if (success) {
                        // ペルソナを初期化
                        this.initializeWithDefaults();
                        
                        // タブコンテンツを再読み込み
                        this.loadTabContent(this.activeTab);
                        
                        this.showNotification('ローカルストレージをクリアしました', 'info');
                    } else {
                        this.showNotification('クリアに失敗しました', 'error');
                    }
                } else {
                    this.showNotification('ストレージシステムが利用できません', 'error');
                }
            }
        },
        
        /**
         * 通知の表示
         * @param {string} message メッセージ
         * @param {string} type 通知タイプ ('success', 'error', 'warning', 'info')
         */
        showNotification(message, type = 'info') {
            // 通知システムがロードされていればそれを使用
            if (window.NotificationManager && typeof window.NotificationManager.show === 'function') {
                window.NotificationManager.show(message, type);
                return;
            }
            
            // フォールバック実装
            console.log(`[${type.toUpperCase()}] ${message}`);
            
            // 簡易的な通知表示
            const notification = document.createElement('div');
            notification.className = `notification notification-${type} fixed top-4 right-4 px-4 py-2 rounded-lg text-white z-50`;
            notification.style.backgroundColor = {
                'success': '#10B981',
                'error': '#EF4444', 
                'warning': '#F59E0B',
                'info': '#3B82F6'
            }[type] || '#3B82F6';
            
            notification.textContent = message;
            document.body.appendChild(notification);
            
            // 4秒後に削除
            setTimeout(() => {
                notification.remove();
            }, 4000);
        }
    };
}

// グローバルに公開
window.UPPSEditor = UPPSEditor;

console.log('App core initialized');
window.UPPS_LOG?.info('App core initialized');


// =============================================================================
// クイック修正スクリプト - app.jsの末尾に追加
// Alpine.jsエラーとタブ読み込みエラーを修正
// =============================================================================

/**
 * Alpine.js関数バインディング - グローバル関数として公開
 */
(function() {
    'use strict';
    
    // Alpine.js向けグローバル関数の定義
    const bindGlobalFunctions = () => {
        const editor = window.uppsEditor;
        if (!editor) {
            console.log('[Quick Fix] Editor not ready, retrying...');
            setTimeout(bindGlobalFunctions, 100);
            return;
        }

        // Memory System Functions
        window.addMemory = () => editor.addMemory?.() || console.warn('addMemory not available');
        window.removeMemory = (index) => editor.removeMemory?.(index) || console.warn('removeMemory not available');

        // Association System Functions  
        window.addAssociation = () => editor.addAssociation?.() || console.warn('addAssociation not available');
        window.removeAssociation = (index) => editor.removeAssociation?.(index) || console.warn('removeAssociation not available');
        window.updateAssociationOptions = (index) => editor.updateAssociationOptions?.(index) || console.warn('updateAssociationOptions not available');
        window.addComplexCondition = (index) => editor.addComplexCondition?.(index) || console.warn('addComplexCondition not available');
        window.removeComplexCondition = (assocIndex, condIndex) => editor.removeComplexCondition?.(assocIndex, condIndex) || console.warn('removeComplexCondition not available');
        window.updateComplexConditionType = (assocIndex, condIndex) => editor.updateComplexConditionType?.(assocIndex, condIndex) || console.warn('updateComplexConditionType not available');
        window.updateExternalItems = (index) => editor.updateExternalItems?.(index) || console.warn('updateExternalItems not available');
        window.getExternalConditionItems = (assocIndex, condIndex) => editor.getExternalConditionItems?.(assocIndex, condIndex) || '';
        window.updateExternalConditionItems = (assocIndex, condIndex, itemsText) => editor.updateExternalConditionItems?.(assocIndex, condIndex, itemsText) || console.warn('updateExternalConditionItems not available');

        // Node Editor Functions
        window.getSelectedNodeTitle = () => editor.getSelectedNodeTitle?.() || '';
        window.closeNodeEditor = () => editor.closeNodeEditor?.() || console.warn('closeNodeEditor not available');
        window.updateEmotionBaseline = () => editor.updateEmotionBaseline?.() || console.warn('updateEmotionBaseline not available');
        window.updateLinkStrength = () => editor.updateLinkStrength?.() || console.warn('updateLinkStrength not available');
        window.updateMemoryId = (oldId, newId) => editor.updateMemoryId?.(oldId, newId) || console.warn('updateMemoryId not available');
        window.getMemoryById = (memoryId) => editor.getMemoryById?.(memoryId) || null;

        // Visualizer Functions
        window.toggleVisualEditor = () => editor.toggleVisualEditor?.() || console.warn('toggleVisualEditor not available');
        window.zoomIn = () => editor.zoomIn?.() || console.warn('zoomIn not available');
        window.zoomOut = () => editor.zoomOut?.() || console.warn('zoomOut not available');
        window.resetZoom = () => editor.resetZoom?.() || console.warn('resetZoom not available');

        // System Functions
        window.syncEmotionState = () => editor.syncEmotionState?.() || console.warn('syncEmotionState not available');
        window.handleEmotionModelChange = () => editor.handleEmotionModelChange?.() || console.warn('handleEmotionModelChange not available');
        window.handleCognitiveModelChange = () => editor.handleCognitiveModelChange?.() || console.warn('handleCognitiveModelChange not available');

        console.log('[Quick Fix] Global functions bound successfully');
    };

    // DOM読み込み完了後に関数をバインド
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bindGlobalFunctions);
    } else {
        bindGlobalFunctions();
    }
})();

/**
 * 改良されたタブ読み込み関数
 */
window.improvedLoadTabContent = async function(tabId) {
    if (!tabId) return false;

    try {
        console.log(`[Quick Fix] Loading tab: ${tabId}`);
        
        const response = await fetch(`js/tabs/${tabId}.html`, {
            cache: 'no-cache'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const content = await response.text();
        const container = document.getElementById('tab-content');
        
        if (!container) {
            throw new Error('Tab content container not found');
        }
        
        container.innerHTML = content;
        
        // Lucideアイコン初期化
        if (window.lucide) {
            window.lucide.createIcons();
        }
        
        // タブ固有の初期化を少し遅延させる
        setTimeout(() => {
            const editor = window.uppsEditor;
            if (editor) {
                switch (tabId) {
                    case 'cognitive':
                        if (typeof editor.initializeCognitiveRadarChart === 'function') {
                            try {
                                editor.initializeCognitiveRadarChart();
                            } catch (e) {
                                console.warn('[Quick Fix] Cognitive chart init failed:', e);
                            }
                        }
                        break;
                    case 'association':
                        if (editor.visualEditorOpen && typeof editor.refreshVisualizer === 'function') {
                            try {
                                editor.refreshVisualizer();
                            } catch (e) {
                                console.warn('[Quick Fix] Visualizer refresh failed:', e);
                            }
                        }
                        break;
                }
            }
        }, 100);
        
        console.log(`[Quick Fix] Tab loaded successfully: ${tabId}`);
        return true;
        
    } catch (error) {
        console.error(`[Quick Fix] Tab loading failed for ${tabId}:`, error);
        
        // エラー表示
        const container = document.getElementById('tab-content');
        if (container) {
            container.innerHTML = `
                <div class="flex flex-col items-center justify-center h-64 text-center p-8">
                    <div class="mb-4 text-red-400">
                        <svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/>
                        </svg>
                    </div>
                    <h3 class="text-lg font-semibold text-white mb-2">タブの読み込みに失敗しました</h3>
                    <p class="text-white/70 mb-4">${error.message}</p>
                    <button onclick="window.uppsEditor.activeTab='basic'; window.improvedLoadTabContent('basic')" 
                            class="bg-indigo-500 hover:bg-indigo-600 px-4 py-2 rounded text-white">
                        基本情報に戻る
                    </button>
                </div>
            `;
        }
        
        return false;
    }
};

/**
 * UPPSEditorのloadTabContent関数をオーバーライド
 */
if (typeof UPPSEditor !== 'undefined') {
    const originalPrototype = UPPSEditor.prototype.loadTabContent;
    UPPSEditor.prototype.loadTabContent = function(tabId) {
        return window.improvedLoadTabContent(tabId);
    };
    console.log('[Quick Fix] loadTabContent function overridden');
}

/**
 * 追加のヘルパー関数
 */

// 安全な関数実行
window.safeExecute = function(functionName, ...args) {
    try {
        const func = window[functionName];
        if (typeof func === 'function') {
            return func.apply(this, args);
        } else {
            console.warn(`[Quick Fix] Function ${functionName} not available`);
            return null;
        }
    } catch (error) {
        console.error(`[Quick Fix] Error executing ${functionName}:`, error);
        return null;
    }
};

// showTabHelp関数の定義（未定義エラー対応）
if (typeof window.showTabHelp === 'undefined') {
    window.showTabHelp = function(tabId) {
        if (window.ModalManager && typeof window.ModalManager.showTabHelp === 'function') {
            return window.ModalManager.showTabHelp(tabId);
        } else {
            console.log(`[Quick Fix] ヘルプ: ${tabId}タブのヘルプ機能は準備中です`);
        }
    };
}

/**
 * Alpine.js互換性の向上
 */
document.addEventListener('alpine:init', () => {
    if (window.Alpine) {
        // Alpine.jsグローバルストアを設定
        window.Alpine.store('upps', {
            editor: null,
            init() {
                this.editor = window.uppsEditor;
            },
            // 便利メソッド
            addMemory: () => window.addMemory?.(),
            addAssociation: () => window.addAssociation?.(),
            getSelectedNodeTitle: () => window.getSelectedNodeTitle?.() || ''
        });
        
        console.log('[Quick Fix] Alpine.js store configured');
    }
});

/**
 * 初期化完了の確認
 */
document.addEventListener('DOMContentLoaded', () => {
    // UPPSEditorが初期化されるまで待つ
    const checkInitialization = () => {
        if (window.uppsEditor) {
            console.log('[Quick Fix] ✅ UPPSEditor initialization confirmed');
            
            // loadTabContent関数をオーバーライド
            window.uppsEditor.loadTabContent = window.improvedLoadTabContent;
            
            // カスタムイベントを発火
            document.dispatchEvent(new CustomEvent('uppsEditorReady'));
            
        } else {
            setTimeout(checkInitialization, 100);
        }
    };
    
    checkInitialization();
});

console.log('[Quick Fix] ✅ Error fixes applied successfully');

// =============================================================================
// クイック修正スクリプト終了
// =============================================================================



