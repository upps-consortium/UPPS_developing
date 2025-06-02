/**
 * ModalController.js - UPPS新アーキテクチャ モーダル管理システム
 * 
 * モーダルのライフサイクル管理、スタック管理、Alpine.js統合を提供
 * インターフェース定義書準拠実装
 */

class ModalController {
    constructor() {
        this.name = 'ModalController';
        
        // モーダルスタック管理
        this.modalStack = [];
        this.modalInstances = new Map(); // modalId -> instance
        this.modalStates = new Map(); // modalId -> state
        
        // モーダル設定
        this.defaultOptions = {
            size: 'md',
            closable: true,
            backdrop: true,
            keyboard: true,
            focus: true,
            show: true,
            animation: true,
            zIndexBase: 1050
        };
        
        // サイズ設定
        this.sizeClasses = {
            sm: 'max-w-sm',
            md: 'max-w-md',
            lg: 'max-w-lg',
            xl: 'max-w-xl',
            '2xl': 'max-w-2xl',
            '3xl': 'max-w-3xl',
            '4xl': 'max-w-4xl',
            full: 'max-w-full'
        };
        
        // イベントコールバック
        this.showCallbacks = new Map(); // modalId -> Set<callback>
        this.hideCallbacks = new Map(); // modalId -> Set<callback>
        this.confirmCallbacks = new Map(); // modalId -> callback
        this.cancelCallbacks = new Map(); // modalId -> callback
        
        // Promise resolvers（非同期対応）
        this.pendingPromises = new Map(); // modalId -> { resolve, reject }
        
        // コアシステム
        this.eventBus = null;
        this.stateManager = null;
        this.isInitialized = false;
        
        this.log('ModalController created');
    }

    /**
     * ModalControllerの初期化
     * @param {EventBus} eventBus - イベントバス
     * @param {StateManager} stateManager - 状態管理
     */
    async initialize(eventBus, stateManager) {
        if (this.isInitialized) {
            this.log('ModalController already initialized');
            return;
        }

        this.eventBus = eventBus;
        this.stateManager = stateManager;

        // イベントハンドラーの設定
        this._setupEventHandlers();

        // Alpine.js統合
        this._setupAlpineIntegration();

        // キーボードイベントの設定
        this._setupKeyboardHandlers();

        // 状態の復元
        this._restoreState();

        this.isInitialized = true;
        this.log('ModalController initialized successfully');
        
        this.eventBus.emit('modal:controller:initialized');
    }

    /**
     * モーダルを表示
     * @param {string} modalId - モーダルID
     * @param {Object} options - オプション
     * @returns {Promise<any>} モーダルの結果
     */
    async show(modalId, options = {}) {
        if (!modalId) {
            throw new Error('Modal ID is required');
        }

        if (this.isOpen(modalId)) {
            this.log(`Modal '${modalId}' is already open`);
            return;
        }

        const modalOptions = { ...this.defaultOptions, ...options };
        
        try {
            this.log(`Showing modal: ${modalId}`);
            
            // モーダル要素の取得または作成
            const modalElement = await this._getOrCreateModal(modalId, modalOptions);
            
            // モーダルインスタンスの作成
            const instance = this._createModalInstance(modalId, modalElement, modalOptions);
            
            // モーダルスタックに追加
            this._addToStack(modalId);
            
            // Z-indexの調整
            this._updateZIndex(modalElement);
            
            // モーダルを表示
            await this._showModal(instance);
            
            // コールバックの実行
            await this._executeShowCallbacks(modalId, modalOptions.data);
            
            // イベントの発行
            this.eventBus.emit('modal:shown', { modalId, options: modalOptions });
            
            // Alpine.jsストアの更新
            this._updateAlpineStore();
            
            // 非同期対応: Promiseを返す
            return new Promise((resolve, reject) => {
                this.pendingPromises.set(modalId, { resolve, reject });
            });
            
        } catch (error) {
            this.log(`Failed to show modal '${modalId}': ${error.message}`);
            this.eventBus.emit('modal:show:failed', { modalId, error: error.message });
            throw error;
        }
    }

    /**
     * モーダルを非表示
     * @param {string} modalId - モーダルID
     * @param {any} result - モーダルの結果
     */
    hide(modalId, result = null) {
        if (!this.isOpen(modalId)) {
            this.log(`Modal '${modalId}' is not open`);
            return;
        }

        try {
            this.log(`Hiding modal: ${modalId}`);
            
            const instance = this.modalInstances.get(modalId);
            if (!instance) {
                throw new Error(`Modal instance not found: ${modalId}`);
            }

            // モーダルを非表示
            this._hideModal(instance);
            
            // スタックから削除
            this._removeFromStack(modalId);
            
            // コールバックの実行
            this._executeHideCallbacks(modalId);
            
            // Promise の解決
            this._resolvePromise(modalId, result);
            
            // イベントの発行
            this.eventBus.emit('modal:hidden', { modalId, result });
            
            // Alpine.jsストアの更新
            this._updateAlpineStore();
            
        } catch (error) {
            this.log(`Failed to hide modal '${modalId}': ${error.message}`);
            this.eventBus.emit('modal:hide:failed', { modalId, error: error.message });
        }
    }

    /**
     * 全モーダルを非表示
     */
    hideAll() {
        const openModals = [...this.modalStack];
        
        this.log(`Hiding all modals: ${openModals.length}`);
        
        openModals.reverse().forEach(modalId => {
            this.hide(modalId);
        });
    }

    /**
     * モーダルが開いているかチェック
     * @param {string} modalId - モーダルID
     * @returns {boolean} 開いているかどうか
     */
    isOpen(modalId) {
        return this.modalStack.includes(modalId);
    }

    /**
     * 開いているモーダル一覧を取得
     * @returns {Array} 開いているモーダルIDの配列
     */
    getOpenModals() {
        return [...this.modalStack];
    }

    /**
     * モーダル表示時のコールバックを登録
     * @param {string} modalId - モーダルID
     * @param {Function} callback - コールバック関数
     */
    onShow(modalId, callback) {
        if (!this.showCallbacks.has(modalId)) {
            this.showCallbacks.set(modalId, new Set());
        }
        
        this.showCallbacks.get(modalId).add(callback);
        
        this.log(`Modal show callback registered: ${modalId}`);
    }

    /**
     * モーダル非表示時のコールバックを登録
     * @param {string} modalId - モーダルID
     * @param {Function} callback - コールバック関数
     */
    onHide(modalId, callback) {
        if (!this.hideCallbacks.has(modalId)) {
            this.hideCallbacks.set(modalId, new Set());
        }
        
        this.hideCallbacks.get(modalId).add(callback);
        
        this.log(`Modal hide callback registered: ${modalId}`);
    }

    /**
     * 確認ボタンのコールバックを登録
     * @param {string} modalId - モーダルID
     * @param {Function} callback - コールバック関数
     */
    onConfirm(modalId, callback) {
        this.confirmCallbacks.set(modalId, callback);
        this.log(`Modal confirm callback registered: ${modalId}`);
    }

    /**
     * キャンセルボタンのコールバックを登録
     * @param {string} modalId - モーダルID
     * @param {Function} callback - コールバック関数
     */
    onCancel(modalId, callback) {
        this.cancelCallbacks.set(modalId, callback);
        this.log(`Modal cancel callback registered: ${modalId}`);
    }

    /**
     * モーダルの確認
     * @param {string} modalId - モーダルID
     * @param {any} result - 確認結果
     */
    confirm(modalId, result = true) {
        const callback = this.confirmCallbacks.get(modalId);
        if (callback) {
            try {
                callback(result);
            } catch (error) {
                this.log(`Modal confirm callback error: ${error.message}`);
            }
        }
        
        this.hide(modalId, result);
        this.eventBus.emit('modal:confirmed', { modalId, result });
    }

    /**
     * モーダルのキャンセル
     * @param {string} modalId - モーダルID
     * @param {any} result - キャンセル結果
     */
    cancel(modalId, result = false) {
        const callback = this.cancelCallbacks.get(modalId);
        if (callback) {
            try {
                callback(result);
            } catch (error) {
                this.log(`Modal cancel callback error: ${error.message}`);
            }
        }
        
        this.hide(modalId, result);
        this.eventBus.emit('modal:cancelled', { modalId, result });
    }

    // ==================== 便利メソッド ====================

    /**
     * アラートモーダルを表示
     * @param {string} message - メッセージ
     * @param {string} title - タイトル
     * @returns {Promise<void>}
     */
    async alert(message, title = 'お知らせ') {
        const modalId = `alert_${Date.now()}`;
        
        const options = {
            title,
            data: { message },
            size: 'md',
            closable: false,
            template: 'alert'
        };
        
        return this.show(modalId, options);
    }

    /**
     * 確認モーダルを表示
     * @param {string} message - メッセージ
     * @param {string} title - タイトル
     * @returns {Promise<boolean>}
     */
    async confirm(message, title = '確認') {
        const modalId = `confirm_${Date.now()}`;
        
        const options = {
            title,
            data: { message },
            size: 'md',
            closable: false,
            template: 'confirm'
        };
        
        return this.show(modalId, options);
    }

    /**
     * 入力モーダルを表示
     * @param {string} message - メッセージ
     * @param {string} defaultValue - デフォルト値
     * @param {string} title - タイトル
     * @returns {Promise<string|null>}
     */
    async prompt(message, defaultValue = '', title = '入力') {
        const modalId = `prompt_${Date.now()}`;
        
        const options = {
            title,
            data: { message, defaultValue },
            size: 'md',
            closable: false,
            template: 'prompt'
        };
        
        return this.show(modalId, options);
    }

    // ==================== 内部メソッド ====================

    /**
     * イベントハンドラーの設定
     */
    _setupEventHandlers() {
        // AppControllerからのモーダル操作
        this.eventBus.on('modal:show', async (data) => {
            await this.show(data.modalId, data.options);
        });

        this.eventBus.on('modal:hide', (data) => {
            this.hide(data.modalId, data.result);
        });

        // Alpine.jsからのモーダル操作
        this.eventBus.on('alpine:modal:show', async (data) => {
            await this.show(data.modalId, data.options);
        });

        this.eventBus.on('alpine:modal:hide', (data) => {
            this.hide(data.modalId, data.result);
        });

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

        // Alpine.jsデータにモーダルコントローラーを追加
        Alpine.data('modalController', () => ({
            openModals: this.getOpenModals(),
            
            showModal: async (modalId, options = {}) => {
                return await this.show(modalId, options);
            },
            
            hideModal: (modalId, result = null) => {
                this.hide(modalId, result);
            },
            
            isModalOpen: (modalId) => {
                return this.isOpen(modalId);
            },
            
            confirmModal: (modalId, result = true) => {
                this.confirm(modalId, result);
            },
            
            cancelModal: (modalId, result = false) => {
                this.cancel(modalId, result);
            }
        }));

        // グローバルモーダルメソッドの追加
        Alpine.data('modal', () => ({
            // モーダル固有の状態
            isVisible: false,
            isClosing: false,
            
            // モーダル表示
            show() {
                this.isVisible = true;
                this.isClosing = false;
                
                // フォーカス管理
                this.$nextTick(() => {
                    const firstFocusable = this.$el.querySelector('[autofocus], input, button');
                    if (firstFocusable) {
                        firstFocusable.focus();
                    }
                });
            },
            
            // モーダル非表示
            hide() {
                this.isClosing = true;
                setTimeout(() => {
                    this.isVisible = false;
                    this.isClosing = false;
                }, 150); // アニメーション時間
            },
            
            // バックドロップクリック
            onBackdropClick(event) {
                if (event.target === event.currentTarget) {
                    this.hide();
                }
            },
            
            // ESCキー処理
            onEscape() {
                this.hide();
            }
        }));

        this.log('Alpine.js integration setup complete');
    }

    /**
     * キーボードハンドラーの設定
     */
    _setupKeyboardHandlers() {
        if (typeof window === 'undefined') {
            return;
        }

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && this.modalStack.length > 0) {
                const topModalId = this.modalStack[this.modalStack.length - 1];
                const instance = this.modalInstances.get(topModalId);
                
                if (instance && instance.options.keyboard) {
                    this.hide(topModalId);
                }
            }
        });
    }

    /**
     * 状態の復元
     */
    _restoreState() {
        // 通常、モーダルは一時的なものなので永続化しない
        // 必要に応じて実装
    }

    /**
     * モーダル要素の取得または作成
     * @param {string} modalId - モーダルID
     * @param {Object} options - オプション
     * @returns {Element} モーダル要素
     */
    async _getOrCreateModal(modalId, options) {
        let modalElement = document.getElementById(modalId);
        
        if (!modalElement) {
            modalElement = this._createModalElement(modalId, options);
            document.body.appendChild(modalElement);
        }
        
        return modalElement;
    }

    /**
     * モーダル要素の作成
     * @param {string} modalId - モーダルID
     * @param {Object} options - オプション
     * @returns {Element} 作成されたモーダル要素
     */
    _createModalElement(modalId, options) {
        const modal = document.createElement('div');
        modal.id = modalId;
        modal.className = 'fixed inset-0 z-50 overflow-y-auto';
        modal.style.display = 'none';
        
        const sizeClass = this.sizeClasses[options.size] || this.sizeClasses.md;
        
        modal.innerHTML = `
            <div class="flex items-center justify-center min-h-screen p-4"
                 x-data="modal()"
                 x-show="isVisible"
                 x-transition:enter="transition ease-out duration-300"
                 x-transition:enter-start="opacity-0"
                 x-transition:enter-end="opacity-100"
                 x-transition:leave="transition ease-in duration-200"
                 x-transition:leave-start="opacity-100"
                 x-transition:leave-end="opacity-0"
                 @click="onBackdropClick($event)"
                 @keydown.escape="onEscape()">
                
                <!-- バックドロップ -->
                <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
                
                <!-- モーダルコンテンツ -->
                <div class="relative bg-white rounded-lg shadow-xl transform transition-all ${sizeClass} w-full"
                     x-transition:enter="transition ease-out duration-300"
                     x-transition:enter-start="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                     x-transition:enter-end="opacity-100 translate-y-0 sm:scale-100"
                     x-transition:leave="transition ease-in duration-200"
                     x-transition:leave-start="opacity-100 translate-y-0 sm:scale-100"
                     x-transition:leave-end="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95">
                    
                    <!-- ヘッダー -->
                    <div class="flex items-center justify-between p-4 border-b border-gray-200">
                        <h3 class="text-lg font-medium text-gray-900" id="${modalId}-title">
                            ${options.title || 'モーダル'}
                        </h3>
                        ${options.closable ? `
                            <button type="button" 
                                    class="text-gray-400 hover:text-gray-500 focus:outline-none focus:text-gray-500 transition-colors"
                                    @click="hideModal('${modalId}')">
                                <span class="sr-only">閉じる</span>
                                <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        ` : ''}
                    </div>
                    
                    <!-- ボディ -->
                    <div class="p-4" id="${modalId}-body">
                        ${this._getModalBodyContent(options)}
                    </div>
                    
                    <!-- フッター -->
                    <div class="flex justify-end space-x-2 p-4 border-t border-gray-200" id="${modalId}-footer">
                        ${this._getModalFooterContent(modalId, options)}
                    </div>
                </div>
            </div>
        `;
        
        return modal;
    }

    /**
     * モーダルボディコンテンツの取得
     * @param {Object} options - オプション
     * @returns {string} HTMLコンテンツ
     */
    _getModalBodyContent(options) {
        if (options.template === 'alert') {
            return `<p class="text-gray-700">${options.data?.message || ''}</p>`;
        }
        
        if (options.template === 'confirm') {
            return `<p class="text-gray-700">${options.data?.message || ''}</p>`;
        }
        
        if (options.template === 'prompt') {
            return `
                <p class="text-gray-700 mb-4">${options.data?.message || ''}</p>
                <input type="text" 
                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                       value="${options.data?.defaultValue || ''}"
                       autofocus>
            `;
        }
        
        return options.content || '';
    }

    /**
     * モーダルフッターコンテンツの取得
     * @param {string} modalId - モーダルID
     * @param {Object} options - オプション
     * @returns {string} HTMLコンテンツ
     */
    _getModalFooterContent(modalId, options) {
        if (options.template === 'alert') {
            return `
                <button type="button" 
                        class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        @click="confirmModal('${modalId}')">
                    OK
                </button>
            `;
        }
        
        if (options.template === 'confirm') {
            return `
                <button type="button" 
                        class="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 mr-2"
                        @click="cancelModal('${modalId}')">
                    キャンセル
                </button>
                <button type="button" 
                        class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        @click="confirmModal('${modalId}')">
                    OK
                </button>
            `;
        }
        
        if (options.template === 'prompt') {
            return `
                <button type="button" 
                        class="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 mr-2"
                        @click="cancelModal('${modalId}')">
                    キャンセル
                </button>
                <button type="button" 
                        class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        @click="confirmModal('${modalId}')">
                    OK
                </button>
            `;
        }
        
        return options.footer || '';
    }

    /**
     * モーダルインスタンスの作成
     * @param {string} modalId - モーダルID
     * @param {Element} element - モーダル要素
     * @param {Object} options - オプション
     * @returns {Object} モーダルインスタンス
     */
    _createModalInstance(modalId, element, options) {
        const instance = {
            id: modalId,
            element,
            options,
            state: 'hidden',
            createdAt: Date.now()
        };
        
        this.modalInstances.set(modalId, instance);
        this.modalStates.set(modalId, 'created');
        
        return instance;
    }

    /**
     * モーダルスタックに追加
     * @param {string} modalId - モーダルID
     */
    _addToStack(modalId) {
        if (!this.modalStack.includes(modalId)) {
            this.modalStack.push(modalId);
        }
    }

    /**
     * モーダルスタックから削除
     * @param {string} modalId - モーダルID
     */
    _removeFromStack(modalId) {
        const index = this.modalStack.indexOf(modalId);
        if (index !== -1) {
            this.modalStack.splice(index, 1);
        }
    }

    /**
     * Z-indexの更新
     * @param {Element} modalElement - モーダル要素
     */
    _updateZIndex(modalElement) {
        const zIndex = this.defaultOptions.zIndexBase + (this.modalStack.length * 10);
        modalElement.style.zIndex = zIndex;
    }

    /**
     * モーダルの表示
     * @param {Object} instance - モーダルインスタンス
     */
    async _showModal(instance) {
        const { element, options } = instance;
        
        // 表示状態の更新
        element.style.display = 'block';
        instance.state = 'showing';
        this.modalStates.set(instance.id, 'showing');
        
        // Alpine.jsの初期化
        if (window.Alpine) {
            Alpine.initTree(element);
            
            // Alpine.jsでの表示
            const alpineData = Alpine.$data(element.querySelector('[x-data]'));
            if (alpineData && typeof alpineData.show === 'function') {
                alpineData.show();
            }
        }
        
        // アニメーション完了の待機
        if (options.animation) {
            await new Promise(resolve => setTimeout(resolve, 300));
        }
        
        // 状態の更新
        instance.state = 'shown';
        this.modalStates.set(instance.id, 'shown');
        
        // フォーカス管理
        if (options.focus) {
            this._manageFocus(element);
        }
    }

    /**
     * モーダルの非表示
     * @param {Object} instance - モーダルインスタンス
     */
    _hideModal(instance) {
        const { element, options } = instance;
        
        // 状態の更新
        instance.state = 'hiding';
        this.modalStates.set(instance.id, 'hiding');
        
        // Alpine.jsでの非表示
        if (window.Alpine) {
            const alpineData = Alpine.$data(element.querySelector('[x-data]'));
            if (alpineData && typeof alpineData.hide === 'function') {
                alpineData.hide();
            }
        }
        
        // アニメーション後に要素を非表示
        setTimeout(() => {
            element.style.display = 'none';
            instance.state = 'hidden';
            this.modalStates.set(instance.id, 'hidden');
            
            // インスタンスのクリーンアップ
            this._cleanupInstance(instance.id);
            
        }, options.animation ? 200 : 0);
    }

    /**
     * 表示コールバックの実行
     * @param {string} modalId - モーダルID
     * @param {any} data - データ
     */
    async _executeShowCallbacks(modalId, data) {
        const callbacks = this.showCallbacks.get(modalId);
        if (callbacks) {
            for (const callback of callbacks) {
                try {
                    await callback(data);
                } catch (error) {
                    this.log(`Modal show callback error for '${modalId}': ${error.message}`);
                }
            }
        }
    }

    /**
     * 非表示コールバックの実行
     * @param {string} modalId - モーダルID
     */
    _executeHideCallbacks(modalId) {
        const callbacks = this.hideCallbacks.get(modalId);
        if (callbacks) {
            callbacks.forEach(callback => {
                try {
                    callback();
                } catch (error) {
                    this.log(`Modal hide callback error for '${modalId}': ${error.message}`);
                }
            });
        }
    }

    /**
     * Promiseの解決
     * @param {string} modalId - モーダルID
     * @param {any} result - 結果
     */
    _resolvePromise(modalId, result) {
        const promise = this.pendingPromises.get(modalId);
        if (promise) {
            promise.resolve(result);
            this.pendingPromises.delete(modalId);
        }
    }

    /**
     * Alpine.jsストアの更新
     */
    _updateAlpineStore() {
        if (window.Alpine && Alpine.store('app')) {
            Alpine.store('app').ui.modalStack = [...this.modalStack];
        }
    }

    /**
     * フォーカス管理
     * @param {Element} modalElement - モーダル要素
     */
    _manageFocus(modalElement) {
        const focusableElements = modalElement.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements.length > 0) {
            focusableElements[0].focus();
        }
    }

    /**
     * インスタンスのクリーンアップ
     * @param {string} modalId - モーダルID
     */
    _cleanupInstance(modalId) {
        // インスタンスの削除
        this.modalInstances.delete(modalId);
        this.modalStates.delete(modalId);
        
        // コールバックのクリーンアップ
        this.showCallbacks.delete(modalId);
        this.hideCallbacks.delete(modalId);
        this.confirmCallbacks.delete(modalId);
        this.cancelCallbacks.delete(modalId);
        
        // 未解決のPromiseの拒否
        const promise = this.pendingPromises.get(modalId);
        if (promise) {
            promise.reject(new Error('Modal was closed'));
            this.pendingPromises.delete(modalId);
        }
    }

    /**
     * ログ出力
     */
    log(message, data = null) {
        if (data !== null) {
            console.debug(`ModalController: ${message}`, data);
        } else {
            console.debug(`ModalController: ${message}`);
        }
    }
}

// ES6モジュールとしてエクスポート
export { ModalController };