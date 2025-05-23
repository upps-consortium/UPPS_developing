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
        tabs: window.UPPS_TABS,
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
            window.UPPS_LOG.info('Initializing UPPS Persona Editor');
            
            // エラー状態をクリア
            this.errors = {};
            
            // ストレージが利用可能かチェック
            if (!window.storageManager.isStorageAvailable()) {
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
            
            window.UPPS_LOG.info('UPPS Persona Editor initialized successfully');
        },
        
        /**
         * デフォルトデータで初期化
         */
        initializeWithDefaults() {
            this.persona = window.PersonaData.getDefaultPersona();
            
            // 感情システムの初期化
            this.handleEmotionModelChange();
            
            // 認知システムの初期化  
            this.handleCognitiveModelChange();
            
            // 感情状態をベースラインから初期化
            this.syncEmotionState();
            
            window.UPPS_LOG.info('Persona initialized with default values');
        },
        
        /**
         * ローカルストレージからペルソナを読み込み
         * @returns {boolean} 読み込み成功の可否
         */
        loadPersonaFromStorage() {
            const loadedPersona = window.storageManager.loadPersona();
            
            if (loadedPersona) {
                // データの整合性チェック
                if (window.PersonaData.validatePersonaStructure(loadedPersona)) {
                    this.persona = loadedPersona;
                    return true;
                } else {
                    window.UPPS_LOG.warn('Invalid persona structure, using defaults');
                    this.showNotification('保存されたデータに問題があります。デフォルト設定を使用します。', 'warning');
                }
            }
            
            return false;
        },
        
        /**
         * 自動保存を開始
         */
        startAutoSave() {
            window.storageManager.startAutoSave(() => {
                if (this.persona) {
                    window.storageManager.savePersona(this.persona);
                }
            });
        },
        
        /**
         * タブコンテンツの読み込み
         * @param {string} tabId タブID
         */
        async loadTabContent(tabId) {
            try {
                const response = await fetch(`js/tabs/${tabId}.html`);
                if (!response.ok) {
                    throw new Error(`Failed to load tab content: ${response.status}`);
                }
                
                const content = await response.text();
                document.getElementById('tab-content').innerHTML = content;
                
                // Lucideアイコンの初期化
                if (window.lucide) {
                    lucide.createIcons();
                }
                
                // タブ読み込み完了イベントの発火
                document.dispatchEvent(new CustomEvent('tabLoaded', { detail: { tabId } }));
                
                // 特定のタブの追加初期化
                this.initializeTabSpecific(tabId);
                
            } catch (error) {
                window.UPPS_LOG.error('Error loading tab content', error);
                document.getElementById('tab-content').innerHTML = `
                    <div class="p-4 text-red-500">
                        <p>タブコンテンツの読み込みに失敗しました。</p>
                        <p>${error.message}</p>
                    </div>
                `;
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
         * テーマの切り替え
         */
        toggleTheme() {
            this.darkMode = !this.darkMode;
            // テーマ適用の実装は省略
            window.UPPS_LOG.info('Theme toggled', { darkMode: this.darkMode });
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
                const data = await window.PersonaImporter.importFromFile();
                
                // データの処理とマージ
                this.persona = window.storageManager.processImportedData(data);
                
                // 通知
                this.showNotification('ファイルを読み込みました', 'success');
                
                // タブコンテンツを再読み込み
                this.loadTabContent(this.activeTab);
                
            } catch (error) {
                window.UPPS_LOG.error('Error loading file', error);
                this.showNotification('ファイルの読み込みに失敗しました: ' + error.message, 'error');
            }
        },
        
        /**
         * ラベル取得のヘルパーメソッド
         */
        getEmotionLabel: (emotionId) => window.UPPS_HELPERS.getEmotionLabel(emotionId),
        getEmotionIcon: (emotionId) => window.UPPS_HELPERS.getEmotionIcon(emotionId),
        getTraitLabel: (traitId) => window.UPPS_HELPERS.getTraitLabel(traitId),
        getTraitDescription: (traitId) => window.UPPS_HELPERS.getTraitDescription(traitId),
        getAbilityLabel: (abilityId) => window.UPPS_HELPERS.getAbilityLabel(abilityId),
        getAbilityDescription: (abilityId) => window.UPPS_HELPERS.getAbilityDescription(abilityId),
        
        /**
         * YAMLプレビューの生成
         * @returns {string} YAML文字列
         */
        generateYAML() {
            if (!this.persona) return '';
            
            try {
                return jsyaml.dump(this.persona, {
                    indent: 2,
                    lineWidth: -1,
                    noRefs: true,
                    sortKeys: true
                });
            } catch (error) {
                window.UPPS_LOG.error('Error generating YAML', error);
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
            
            const success = window.storageManager.savePersona(this.persona);
            
            if (success) {
                this.showNotification('ペルソナを保存しました', 'success');
            } else {
                this.showNotification('保存に失敗しました', 'error');
            }
            
            return success;
        },
        
        /**
         * バリデーションと保存
         */
        validateAndSavePersona() {
            if (!window.PersonaValidator) {
                window.UPPS_LOG.warn('Validator not loaded, saving without validation');
                return this.savePersona();
            }
            
            // バリデーションを実行
            const errors = window.PersonaValidator.validatePersona(this.persona);
            
            // エラーがあれば表示して保存しない
            if (Object.keys(errors).length > 0) {
                window.PersonaValidator.displayValidationErrors(errors);
                this.showNotification('入力内容に問題があります', 'error');
                return false;
            }
            
            // エラーがなければ保存
            return this.savePersona();
        },
        
        /**
         * ローカルストレージのクリア
         */
        clearLocalStorage() {
            if (confirm('保存したデータをすべて削除しますか？この操作は元に戻せません。')) {
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
            }
        },
        
        /**
         * 通知の表示
         * @param {string} message メッセージ
         * @param {string} type 通知タイプ ('success', 'error', 'warning', 'info')
         */
        showNotification(message, type = 'info') {
            // 通知システムがロードされていればそれを使用
            if (window.NotificationManager) {
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
        },
        
        /**
         * テンプレートとのマージ
         * @param {Object} data マージするデータ
         * @returns {Object} マージ結果
         */
        mergeWithTemplate(data) {
            return window.PersonaData.mergeWithTemplate(data);
        },
        
        /**
         * アプリケーションの終了処理
         */
        destroy() {
            // 自動保存を停止
            window.storageManager.stopAutoSave();
            
            // イベントリスナーのクリーンアップ等
            window.UPPS_LOG.info('UPPS Editor destroyed');
        }
    };
}

// グローバルに公開
window.UPPSEditor = UPPSEditor;

window.UPPS_LOG.info('App core initialized');
