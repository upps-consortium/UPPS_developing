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