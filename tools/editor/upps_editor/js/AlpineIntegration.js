/**
 * alpine-integration.js - UPPS新アーキテクチャ Alpine.js統合スクリプト
 * 
 * StateManagerとAlpine.jsの完全統合を提供
 * リアクティブなデータバインディングと状態同期を実現
 */

class AlpineIntegration {
    constructor() {
        this.stateManager = null;
        this.eventBus = null;
        this.isInitialized = false;
        
        // Alpine.jsストア設定
        this.storeConfig = {
            // アプリケーション状態
            app: {
                activeTab: 'basic',
                loading: false,
                initialized: false,
                ui: {
                    modalStack: [],
                    notifications: [],
                    theme: 'light'
                }
            },
            
            // ペルソナデータ
            persona: {
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
            },
            
            // UI状態
            ui: {
                modals: {},
                forms: {},
                validation: {},
                externalItems: {} // 関連性システム用
            }
        };
        
        this.log('AlpineIntegration created');
    }

    /**
     * Alpine.js統合の初期化
     * @param {StateManager} stateManager - 状態管理インスタンス
     * @param {EventBus} eventBus - イベントバスインスタンス
     */
    async initialize(stateManager, eventBus) {
        if (this.isInitialized) {
            this.log('AlpineIntegration already initialized');
            return;
        }

        if (typeof window === 'undefined' || !window.Alpine) {
            throw new Error('Alpine.js not found. Please include Alpine.js before this script.');
        }

        this.stateManager = stateManager;
        this.eventBus = eventBus;

        // Alpine.jsの初期化前に実行
        document.addEventListener('alpine:init', () => {
            this._setupAlpineStores();
            this._setupAlpineData();
            this._setupAlpineDirectives();
        });

        // Alpine.jsの初期化後に実行
        document.addEventListener('alpine:initialized', () => {
            this._setupStateSync();
            this._setupEventHandlers();
            this._initializeReactivity();
        });

        this.isInitialized = true;
        this.log('AlpineIntegration initialized successfully');
    }

    /**
     * Alpine.jsストアを設定
     */
    _setupAlpineStores() {
        // アプリケーションストア
        Alpine.store('app', {
            ...this.storeConfig.app,
            
            // タブ切り替え
            switchTab(tabId) {
                this.activeTab = tabId;
                this.eventBus?.emit('tab:changed', { tabId });
            },
            
            // ローディング状態
            setLoading(loading) {
                this.loading = loading;
            },
            
            // モーダル管理
            showModal(modalId, data = null) {
                if (!this.ui.modalStack.includes(modalId)) {
                    this.ui.modalStack.push(modalId);
                }
                this.eventBus?.emit('modal:show', { modalId, data });
            },
            
            hideModal(modalId) {
                const index = this.ui.modalStack.indexOf(modalId);
                if (index > -1) {
                    this.ui.modalStack.splice(index, 1);
                }
                this.eventBus?.emit('modal:hide', { modalId });
            },
            
            // 通知管理
            showNotification(message, type = 'info', duration = 5000) {
                const notification = {
                    id: `notification_${Date.now()}`,
                    message,
                    type,
                    timestamp: Date.now()
                };
                
                this.ui.notifications.push(notification);
                
                if (duration > 0) {
                    setTimeout(() => {
                        this.hideNotification(notification.id);
                    }, duration);
                }
                
                return notification.id;
            },
            
            hideNotification(id) {
                const index = this.ui.notifications.findIndex(n => n.id === id);
                if (index > -1) {
                    this.ui.notifications.splice(index, 1);
                }
            }
        });

        // ペルソナストア
        Alpine.store('persona', {
            ...this.storeConfig.persona,
            
            // 基本情報更新
            updatePersonalInfo(field, value) {
                this.personal_info[field] = value;
                this.eventBus?.emit('persona:personal_info:changed', { field, value });
            },
            
            // 背景更新
            updateBackground(background) {
                this.background = background;
                this.eventBus?.emit('persona:background:changed', { background });
            },
            
            // 感情状態更新
            updateEmotionState(emotionId, value) {
                this.current_emotion_state[emotionId] = value;
                this.eventBus?.emit('persona:emotion_state:changed', { emotionId, value });
            },
            
            // 記憶追加
            addMemory(memory) {
                this.memory_system.memories.push(memory);
                this.eventBus?.emit('persona:memory:added', { memory });
            },
            
            // 記憶削除
            removeMemory(index) {
                if (index >= 0 && index < this.memory_system.memories.length) {
                    const memory = this.memory_system.memories[index];
                    this.memory_system.memories.splice(index, 1);
                    this.eventBus?.emit('persona:memory:removed', { memory, index });
                }
            },
            
            // 関連性追加
            addAssociation(association) {
                this.association_system.associations.push(association);
                this.eventBus?.emit('persona:association:added', { association });
            },
            
            // 関連性削除
            removeAssociation(index) {
                if (index >= 0 && index < this.association_system.associations.length) {
                    const association = this.association_system.associations[index];
                    this.association_system.associations.splice(index, 1);
                    this.eventBus?.emit('persona:association:removed', { association, index });
                }
            }
        });

        // UIストア
        Alpine.store('ui', {
            ...this.storeConfig.ui,
            
            // フォーム状態管理
            setFormData(formId, data) {
                if (!this.forms[formId]) {
                    this.forms[formId] = {};
                }
                Object.assign(this.forms[formId], data);
            },
            
            getFormData(formId) {
                return this.forms[formId] || {};
            },
            
            // バリデーション状態
            setValidation(field, isValid, message = '') {
                if (!this.validation[field]) {
                    this.validation[field] = {};
                }
                this.validation[field] = { isValid, message };
            },
            
            getValidation(field) {
                return this.validation[field] || { isValid: true, message: '' };
            },
            
            // 外部アイテム管理（関連性システム用）
            setExternalItems(index, items) {
                this.externalItems[index] = items;
            },
            
            getExternalItems(index) {
                return this.externalItems[index] || '';
            }
        });

        this.log('Alpine.js stores configured');
    }

    /**
     * Alpine.jsデータの設定
     */
    _setupAlpineData() {
        // グローバルデータの設定
        Alpine.data('uppsApp', () => ({
            // 初期化フラグ
            init() {
                this.$store.app.initialized = true;
                this.eventBus?.emit('alpine:app:initialized');
            },
            
            // タブ関連
            isActiveTab(tabId) {
                return this.$store.app.activeTab === tabId;
            },
            
            switchTab(tabId) {
                this.$store.app.switchTab(tabId);
            },
            
            // フォーム送信
            handleFormSubmit(formId) {
                const formData = this.$store.ui.getFormData(formId);
                this.eventBus?.emit('form:submit', { formId, data: formData });
            },
            
            // 入力変更ハンドラー
            handleInputChange(field, value) {
                this.eventBus?.emit('input:changed', { field, value });
            }
        }));

        // タブ固有のデータ
        Alpine.data('basicTab', () => ({
            // 基本情報フォーム
            personalInfo: {},
            background: '',
            
            init() {
                this.syncFromStore();
            },
            
            syncFromStore() {
                this.personalInfo = { ...this.$store.persona.personal_info };
                this.background = this.$store.persona.background;
            },
            
            updatePersonalInfo(field, value) {
                this.personalInfo[field] = value;
                this.$store.persona.updatePersonalInfo(field, value);
            },
            
            updateBackground() {
                this.$store.persona.updateBackground(this.background);
            }
        }));

        Alpine.data('emotionTab', () => ({
            // 感情システム
            emotions: {},
            currentState: {},
            
            init() {
                this.syncFromStore();
            },
            
            syncFromStore() {
                this.emotions = { ...this.$store.persona.emotion_system.emotions };
                this.currentState = { ...this.$store.persona.current_emotion_state };
            },
            
            updateEmotionBaseline(emotionId, value) {
                if (this.emotions[emotionId]) {
                    this.emotions[emotionId].baseline = value;
                    this.eventBus?.emit('emotion:baseline:changed', { emotionId, value });
                }
            },
            
            updateEmotionState(emotionId, value) {
                this.currentState[emotionId] = value;
                this.$store.persona.updateEmotionState(emotionId, value);
            },
            
            syncStateFromBaseline() {
                Object.keys(this.emotions).forEach(emotionId => {
                    const baseline = this.emotions[emotionId]?.baseline || 50;
                    this.updateEmotionState(emotionId, baseline);
                });
            }
        }));

        Alpine.data('memoryTab', () => ({
            // 記憶システム
            memories: [],
            
            init() {
                this.syncFromStore();
            },
            
            syncFromStore() {
                this.memories = [...this.$store.persona.memory_system.memories];
            },
            
            addMemory() {
                const memory = {
                    id: `memory_${Date.now()}`,
                    type: 'episodic',
                    content: '',
                    period: '',
                    emotional_valence: 0.5
                };
                
                this.memories.push(memory);
                this.$store.persona.addMemory(memory);
            },
            
            removeMemory(index) {
                if (confirm('この記憶を削除しますか？関連する関連性も削除されます。')) {
                    this.memories.splice(index, 1);
                    this.$store.persona.removeMemory(index);
                }
            },
            
            updateMemory(index, field, value) {
                if (this.memories[index]) {
                    this.memories[index][field] = value;
                    this.eventBus?.emit('memory:updated', { index, field, value });
                }
            }
        }));

        Alpine.data('associationTab', () => ({
            // 関連性システム
            associations: [],
            externalItems: {},
            
            init() {
                this.syncFromStore();
            },
            
            syncFromStore() {
                this.associations = [...this.$store.persona.association_system.associations];
                this.externalItems = { ...this.$store.ui.externalItems };
            },
            
            addAssociation() {
                const association = {
                    id: `assoc_${Date.now()}`,
                    trigger: { type: 'memory', id: '' },
                    response: { type: 'emotion', id: '', association_strength: 50 }
                };
                
                this.associations.push(association);
                this.$store.persona.addAssociation(association);
            },
            
            removeAssociation(index) {
                if (confirm('この関連性を削除しますか？')) {
                    this.associations.splice(index, 1);
                    this.$store.persona.removeAssociation(index);
                }
            },
            
            updateExternalItems(index, items) {
                this.externalItems[index] = items;
                this.$store.ui.setExternalItems(index, items);
                this.eventBus?.emit('association:external:updated', { index, items });
            }
        }));

        this.log('Alpine.js data configured');
    }

    /**
     * カスタムディレクティブの設定
     */
    _setupAlpineDirectives() {
        // バリデーション用ディレクティブ
        Alpine.directive('validate', (el, { expression }, { evaluate }) => {
            const validationRules = evaluate(expression);
            
            el.addEventListener('input', () => {
                const value = el.value;
                const isValid = this._validateField(value, validationRules);
                const message = isValid ? '' : 'Validation failed';
                
                const field = el.getAttribute('name') || el.getAttribute('id');
                if (field) {
                    Alpine.store('ui').setValidation(field, isValid, message);
                }
                
                // UIフィードバック
                if (isValid) {
                    el.classList.remove('border-red-500');
                    el.classList.add('border-green-500');
                } else {
                    el.classList.remove('border-green-500');
                    el.classList.add('border-red-500');
                }
            });
        });

        // 自動保存ディレクティブ
        Alpine.directive('autosave', (el, { expression }, { evaluate }) => {
            const delay = evaluate(expression) || 1000;
            let timeout;
            
            el.addEventListener('input', () => {
                clearTimeout(timeout);
                timeout = setTimeout(() => {
                    this.eventBus?.emit('data:autosave', { element: el });
                }, delay);
            });
        });

        // ツールチップディレクティブ
        Alpine.directive('tooltip', (el, { expression }, { evaluate }) => {
            const tooltipText = evaluate(expression);
            
            el.addEventListener('mouseenter', () => {
                this._showTooltip(el, tooltipText);
            });
            
            el.addEventListener('mouseleave', () => {
                this._hideTooltip(el);
            });
        });

        this.log('Alpine.js directives configured');
    }

    /**
     * 状態同期の設定
     */
    _setupStateSync() {
        // StateManagerからAlpine.jsへの同期
        this.stateManager.subscribe('persona', (personaData) => {
            const store = Alpine.store('persona');
            Object.assign(store, personaData);
        });

        this.stateManager.subscribe('app', (appData) => {
            const store = Alpine.store('app');
            Object.assign(store, appData);
        });

        // Alpine.jsからStateManagerへの同期
        Alpine.effect(() => {
            const personaStore = Alpine.store('persona');
            this.stateManager.setState('persona', personaStore);
        });

        Alpine.effect(() => {
            const appStore = Alpine.store('app');
            this.stateManager.setState('app', appStore);
        });

        this.log('State synchronization configured');
    }

    /**
     * イベントハンドラーの設定
     */
    _setupEventHandlers() {
        // StateManager関連イベント
        this.eventBus.on('state:changed', (data) => {
            this._handleStateChange(data);
        });

        // タブ関連イベント
        this.eventBus.on('tab:changed', (data) => {
            Alpine.store('app').activeTab = data.tabId;
        });

        // モーダル関連イベント
        this.eventBus.on('modal:show', (data) => {
            this._handleModalShow(data);
        });

        this.eventBus.on('modal:hide', (data) => {
            this._handleModalHide(data);
        });

        // フォーム関連イベント
        this.eventBus.on('form:submit', (data) => {
            this._handleFormSubmit(data);
        });

        // エラーハンドリング
        this.eventBus.on('error', (error) => {
            Alpine.store('app').showNotification(
                `エラーが発生しました: ${error.message}`, 
                'error'
            );
        });

        this.log('Event handlers configured');
    }

    /**
     * リアクティビティの初期化
     */
    _initializeReactivity() {
        // DOM変更の監視
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    // 新しい要素にAlpine.jsを適用
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            Alpine.initTree(node);
                        }
                    });
                }
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        // 定期的な状態同期
        setInterval(() => {
            this._syncStores();
        }, 5000);

        this.log('Reactivity initialized');
    }

    // ==================== ユーティリティメソッド ====================

    /**
     * 状態変更の処理
     * @param {Object} data - 変更データ
     */
    _handleStateChange(data) {
        const { path, value } = data;
        
        if (path.startsWith('persona.')) {
            const personaStore = Alpine.store('persona');
            const keys = path.substring(8).split('.');
            this._setNestedValue(personaStore, keys, value);
        } else if (path.startsWith('app.')) {
            const appStore = Alpine.store('app');
            const keys = path.substring(4).split('.');
            this._setNestedValue(appStore, keys, value);
        }
    }

    /**
     * モーダル表示の処理
     * @param {Object} data - モーダルデータ
     */
    _handleModalShow(data) {
        const { modalId } = data;
        const modalElement = document.getElementById(modalId);
        
        if (modalElement) {
            modalElement.style.display = 'block';
            modalElement.classList.add('show');
        }
    }

    /**
     * モーダル非表示の処理
     * @param {Object} data - モーダルデータ
     */
    _handleModalHide(data) {
        const { modalId } = data;
        const modalElement = document.getElementById(modalId);
        
        if (modalElement) {
            modalElement.style.display = 'none';
            modalElement.classList.remove('show');
        }
    }

    /**
     * フォーム送信の処理
     * @param {Object} data - フォームデータ
     */
    _handleFormSubmit(data) {
        const { formId, data: formData } = data;
        
        // バリデーション実行
        const isValid = this._validateForm(formData);
        
        if (isValid) {
            this.stateManager.setState(`forms.${formId}`, formData);
            Alpine.store('app').showNotification('保存しました', 'success');
        } else {
            Alpine.store('app').showNotification('入力内容に誤りがあります', 'error');
        }
    }

    /**
     * ストアの同期
     */
    _syncStores() {
        try {
            const personaStore = Alpine.store('persona');
            const appStore = Alpine.store('app');
            
            this.stateManager.setState('persona', personaStore);
            this.stateManager.setState('app', appStore);
        } catch (error) {
            this.log('Store sync error', error);
        }
    }

    /**
     * フィールドバリデーション
     * @param {any} value - 値
     * @param {Object} rules - バリデーションルール
     * @returns {boolean} バリデーション結果
     */
    _validateField(value, rules) {
        if (rules.required && (!value || value.toString().trim() === '')) {
            return false;
        }
        
        if (rules.minLength && value.toString().length < rules.minLength) {
            return false;
        }
        
        if (rules.maxLength && value.toString().length > rules.maxLength) {
            return false;
        }
        
        if (rules.pattern && !new RegExp(rules.pattern).test(value)) {
            return false;
        }
        
        return true;
    }

    /**
     * フォームバリデーション
     * @param {Object} formData - フォームデータ
     * @returns {boolean} バリデーション結果
     */
    _validateForm(formData) {
        // 基本的なバリデーションロジック
        return Object.values(formData).every(value => 
            value !== null && value !== undefined && value !== ''
        );
    }

    /**
     * ネストした値の設定
     * @param {Object} obj - オブジェクト
     * @param {Array} keys - キーの配列
     * @param {any} value - 設定する値
     */
    _setNestedValue(obj, keys, value) {
        const lastKey = keys.pop();
        const target = keys.reduce((current, key) => {
            if (!current[key] || typeof current[key] !== 'object') {
                current[key] = {};
            }
            return current[key];
        }, obj);
        
        target[lastKey] = value;
    }

    /**
     * ツールチップ表示
     * @param {Element} element - 要素
     * @param {string} text - ツールチップテキスト
     */
    _showTooltip(element, text) {
        // 簡単なツールチップ実装
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip bg-gray-800 text-white p-2 rounded text-sm absolute z-50';
        tooltip.textContent = text;
        tooltip.id = 'alpine-tooltip';
        
        document.body.appendChild(tooltip);
        
        const rect = element.getBoundingClientRect();
        tooltip.style.left = rect.left + 'px';
        tooltip.style.top = (rect.top - tooltip.offsetHeight - 5) + 'px';
    }

    /**
     * ツールチップ非表示
     */
    _hideTooltip() {
        const tooltip = document.getElementById('alpine-tooltip');
        if (tooltip) {
            tooltip.remove();
        }
    }

    /**
     * ログ出力
     */
    log(message, data = null) {
        if (data !== null) {
            console.debug(`AlpineIntegration: ${message}`, data);
        } else {
            console.debug(`AlpineIntegration: ${message}`);
        }
    }
}

// グローバルインスタンス
window.AlpineIntegration = AlpineIntegration;

// 自動初期化（AppControllerから呼び出される場合はスキップ）
document.addEventListener('DOMContentLoaded', async () => {
    if (!window.alpineIntegrationInitialized) {
        const integration = new AlpineIntegration();
        
        // StateManagerとEventBusが利用可能になるまで待機
        const waitForDependencies = () => {
            return new Promise((resolve) => {
                const check = () => {
                    if (window.stateManager && window.eventBus) {
                        resolve();
                    } else {
                        setTimeout(check, 100);
                    }
                };
                check();
            });
        };
        
        await waitForDependencies();
        await integration.initialize(window.stateManager, window.eventBus);
        
        window.alpineIntegrationInitialized = true;
        window.alpineIntegration = integration;
        
        console.info('Alpine.js integration initialized automatically');
    }
});

// ES6モジュールとしてエクスポート
export { AlpineIntegration };