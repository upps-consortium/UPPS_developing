/**
 * NotificationController.js - UPPS新アーキテクチャ 通知管理システム
 * 
 * 通知のライフサイクル管理、プログレス通知、Alpine.js統合を提供
 * インターフェース定義書準拠実装
 */

class NotificationController {
    constructor() {
        this.name = 'NotificationController';
        
        // 通知管理
        this.notifications = new Map(); // id -> notification
        this.notificationQueue = [];
        this.notificationCounter = 0;
        
        // 通知タイプの設定
        this.notificationTypes = {
            success: {
                icon: 'check-circle',
                bgColor: 'bg-green-50',
                borderColor: 'border-green-200',
                iconColor: 'text-green-400',
                textColor: 'text-green-800',
                duration: 4000
            },
            error: {
                icon: 'x-circle',
                bgColor: 'bg-red-50',
                borderColor: 'border-red-200',
                iconColor: 'text-red-400',
                textColor: 'text-red-800',
                duration: 6000
            },
            warning: {
                icon: 'alert-triangle',
                bgColor: 'bg-yellow-50',
                borderColor: 'border-yellow-200',
                iconColor: 'text-yellow-400',
                textColor: 'text-yellow-800',
                duration: 5000
            },
            info: {
                icon: 'info',
                bgColor: 'bg-blue-50',
                borderColor: 'border-blue-200',
                iconColor: 'text-blue-400',
                textColor: 'text-blue-800',
                duration: 4000
            }
        };
        
        // デフォルトオプション
        this.defaultOptions = {
            duration: 4000,
            persistent: false,
            position: 'top-right',
            maxVisible: 5,
            animation: true,
            sound: false
        };
        
        // プログレス通知の管理
        this.progressNotifications = new Map(); // id -> progress data
        
        // コアシステム
        this.eventBus = null;
        this.stateManager = null;
        this.isInitialized = false;
        
        // 通知コンテナ
        this.container = null;
        
        this.log('NotificationController created');
    }

    /**
     * NotificationControllerの初期化
     * @param {EventBus} eventBus - イベントバス
     * @param {StateManager} stateManager - 状態管理
     */
    async initialize(eventBus, stateManager) {
        if (this.isInitialized) {
            this.log('NotificationController already initialized');
            return;
        }

        this.eventBus = eventBus;
        this.stateManager = stateManager;

        // 通知コンテナの作成
        this._createNotificationContainer();

        // イベントハンドラーの設定
        this._setupEventHandlers();

        // Alpine.js統合
        this._setupAlpineIntegration();

        this.isInitialized = true;
        this.log('NotificationController initialized successfully');
        
        this.eventBus.emit('notification:controller:initialized');
    }

    /**
     * 通知を表示
     * @param {string} message - メッセージ
     * @param {string} type - 通知タイプ
     * @param {Object} options - オプション
     * @returns {string} 通知ID
     */
    show(message, type = 'info', options = {}) {
        if (!message) {
            throw new Error('Notification message is required');
        }

        if (!this.notificationTypes[type]) {
            throw new Error(`Invalid notification type: ${type}`);
        }

        const notificationId = this._generateNotificationId();
        const notificationOptions = { ...this.defaultOptions, ...options };
        const typeConfig = this.notificationTypes[type];

        const notification = {
            id: notificationId,
            message,
            type,
            options: notificationOptions,
            config: typeConfig,
            createdAt: Date.now(),
            element: null,
            timer: null,
            isVisible: false
        };

        try {
            this.log(`Showing notification: ${type} - ${message}`);
            
            // 通知を保存
            this.notifications.set(notificationId, notification);
            
            // 通知要素の作成と表示
            this._createAndShowNotification(notification);
            
            // 自動削除の設定
            if (!notificationOptions.persistent && notificationOptions.duration > 0) {
                this._scheduleAutoHide(notificationId, notificationOptions.duration);
            }
            
            // 通知数の制限チェック
            this._enforceMaxVisible();
            
            // イベントの発行
            this.eventBus.emit('notification:shown', { 
                id: notificationId, 
                message, 
                type 
            });
            
            // Alpine.jsストアの更新
            this._updateAlpineStore();
            
            // サウンド再生（オプション）
            if (notificationOptions.sound) {
                this._playNotificationSound(type);
            }

            return notificationId;

        } catch (error) {
            this.log(`Failed to show notification: ${error.message}`);
            this.notifications.delete(notificationId);
            throw error;
        }
    }

    /**
     * 通知を非表示
     * @param {string} id - 通知ID
     */
    hide(id) {
        const notification = this.notifications.get(id);
        if (!notification) {
            this.log(`Notification not found: ${id}`);
            return;
        }

        try {
            this.log(`Hiding notification: ${id}`);
            
            // タイマーのクリア
            if (notification.timer) {
                clearTimeout(notification.timer);
                notification.timer = null;
            }
            
            // アニメーションで非表示
            this._hideNotification(notification);
            
            // 通知の削除
            this.notifications.delete(id);
            
            // プログレス通知の場合は専用データも削除
            this.progressNotifications.delete(id);
            
            // イベントの発行
            this.eventBus.emit('notification:hidden', { id });
            
            // Alpine.jsストアの更新
            this._updateAlpineStore();

        } catch (error) {
            this.log(`Failed to hide notification '${id}': ${error.message}`);
        }
    }

    /**
     * 全通知を非表示
     */
    hideAll() {
        const notificationIds = Array.from(this.notifications.keys());
        
        this.log(`Hiding all notifications: ${notificationIds.length}`);
        
        notificationIds.forEach(id => {
            this.hide(id);
        });
    }

    /**
     * 成功通知を表示
     * @param {string} message - メッセージ
     * @param {Object} options - オプション
     * @returns {string} 通知ID
     */
    success(message, options = {}) {
        return this.show(message, 'success', options);
    }

    /**
     * エラー通知を表示
     * @param {string} message - メッセージ
     * @param {Object} options - オプション
     * @returns {string} 通知ID
     */
    error(message, options = {}) {
        const errorOptions = { 
            persistent: true, // エラーは永続化
            ...options 
        };
        return this.show(message, 'error', errorOptions);
    }

    /**
     * 警告通知を表示
     * @param {string} message - メッセージ
     * @param {Object} options - オプション
     * @returns {string} 通知ID
     */
    warning(message, options = {}) {
        return this.show(message, 'warning', options);
    }

    /**
     * 情報通知を表示
     * @param {string} message - メッセージ
     * @param {Object} options - オプション
     * @returns {string} 通知ID
     */
    info(message, options = {}) {
        return this.show(message, 'info', options);
    }

    /**
     * プログレス通知を表示
     * @param {string} message - メッセージ
     * @param {number} progress - 進捗率（0-100）
     * @returns {string} 通知ID
     */
    showProgress(message, progress = 0) {
        const progressId = this._generateNotificationId();
        
        const progressData = {
            id: progressId,
            message,
            progress: Math.max(0, Math.min(100, progress)),
            startTime: Date.now()
        };
        
        // プログレス通知データを保存
        this.progressNotifications.set(progressId, progressData);
        
        // 通常の通知として表示（永続化）
        const notificationId = this.show(
            this._formatProgressMessage(message, progress),
            'info',
            { 
                persistent: true,
                template: 'progress',
                progressData
            }
        );
        
        // プログレス通知とリンク
        progressData.notificationId = notificationId;
        
        this.log(`Progress notification started: ${progressId}`);
        this.eventBus.emit('notification:progress:started', { id: progressId, progress });
        
        return progressId;
    }

    /**
     * プログレス通知を更新
     * @param {string} id - プログレス通知ID
     * @param {string} message - 新しいメッセージ
     * @param {number} progress - 新しい進捗率
     */
    updateProgress(id, message, progress) {
        const progressData = this.progressNotifications.get(id);
        if (!progressData) {
            this.log(`Progress notification not found: ${id}`);
            return;
        }

        const notification = this.notifications.get(progressData.notificationId);
        if (!notification) {
            this.log(`Associated notification not found: ${progressData.notificationId}`);
            return;
        }

        // 進捗データの更新
        progressData.message = message;
        progressData.progress = Math.max(0, Math.min(100, progress));
        progressData.lastUpdated = Date.now();

        // 通知要素の更新
        this._updateProgressNotification(notification, progressData);

        // 100%完了時の自動非表示
        if (progress >= 100) {
            setTimeout(() => {
                this.hide(progressData.notificationId);
            }, 2000);
        }

        this.log(`Progress updated: ${id} - ${progress}%`);
        this.eventBus.emit('notification:progress:updated', { id, progress, message });
    }

    /**
     * 現在の通知一覧を取得
     * @returns {Array} 通知一覧
     */
    getNotifications() {
        return Array.from(this.notifications.values()).map(notification => ({
            id: notification.id,
            message: notification.message,
            type: notification.type,
            createdAt: notification.createdAt,
            isVisible: notification.isVisible
        }));
    }

    /**
     * 通知数を取得
     * @returns {number} 通知数
     */
    getCount() {
        return this.notifications.size;
    }

    // ==================== 内部メソッド ====================

    /**
     * イベントハンドラーの設定
     */
    _setupEventHandlers() {
        // AppControllerからの通知要求
        this.eventBus.on('notification:show', (data) => {
            this.show(data.message, data.type, data.options);
        });

        // Alpine.jsからの通知要求
        this.eventBus.on('alpine:notification:show', (data) => {
            this.show(data.message, data.type, data.options);
        });

        // エラーイベントの自動通知
        this.eventBus.on('error', (error) => {
            this.error(`エラーが発生しました: ${error.message}`);
        });

        // 成功イベントの自動通知
        this.eventBus.on('success', (data) => {
            this.success(data.message || '操作が完了しました');
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

        // Alpine.jsデータに通知コントローラーを追加
        Alpine.data('notificationController', () => ({
            notifications: this.getNotifications(),
            
            showNotification: (message, type = 'info', options = {}) => {
                return this.show(message, type, options);
            },
            
            hideNotification: (id) => {
                this.hide(id);
            },
            
            hideAllNotifications: () => {
                this.hideAll();
            },
            
            success: (message, options = {}) => {
                return this.success(message, options);
            },
            
            error: (message, options = {}) => {
                return this.error(message, options);
            },
            
            warning: (message, options = {}) => {
                return this.warning(message, options);
            },
            
            info: (message, options = {}) => {
                return this.info(message, options);
            }
        }));

        // 通知表示用のAlpine.jsデータ
        Alpine.data('notification', (notificationData) => ({
            notification: notificationData,
            isVisible: false,
            isClosing: false,
            
            init() {
                this.$nextTick(() => {
                    this.show();
                });
            },
            
            show() {
                this.isVisible = true;
            },
            
            hide() {
                this.isClosing = true;
                setTimeout(() => {
                    this.isVisible = false;
                    this.$el.remove();
                }, 300);
            },
            
            dismiss() {
                window.notificationController?.hide(this.notification.id);
            }
        }));

        this.log('Alpine.js integration setup complete');
    }

    /**
     * 通知コンテナの作成
     */
    _createNotificationContainer() {
        if (typeof window === 'undefined') {
            return;
        }

        // 既存のコンテナをチェック
        this.container = document.getElementById('notification-container');
        
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'notification-container';
            this.container.className = 'fixed top-4 right-4 z-50 space-y-2 max-w-sm';
            document.body.appendChild(this.container);
        }

        this.log('Notification container created');
    }

    /**
     * 通知要素の作成と表示
     * @param {Object} notification - 通知オブジェクト
     */
    _createAndShowNotification(notification) {
        const element = this._createNotificationElement(notification);
        notification.element = element;
        
        // コンテナに追加
        this.container.appendChild(element);
        
        // Alpine.jsの初期化
        if (window.Alpine) {
            Alpine.initTree(element);
        }
        
        // 表示状態の更新
        notification.isVisible = true;
        
        // 表示アニメーション
        requestAnimationFrame(() => {
            element.classList.remove('translate-x-full');
            element.classList.add('translate-x-0');
        });
    }

    /**
     * 通知要素の作成
     * @param {Object} notification - 通知オブジェクト
     * @returns {Element} 通知要素
     */
    _createNotificationElement(notification) {
        const { id, message, type, config, options } = notification;
        
        const element = document.createElement('div');
        element.id = `notification-${id}`;
        element.className = `
            transform translate-x-full transition-transform duration-300 ease-in-out
            rounded-lg border p-4 shadow-lg
            ${config.bgColor} ${config.borderColor}
        `;
        
        const isProgress = options.template === 'progress';
        
        element.innerHTML = `
            <div x-data="notification(${JSON.stringify(notification).replace(/"/g, '&quot;')})"
                 x-show="isVisible"
                 x-transition:enter="transition ease-out duration-300"
                 x-transition:enter-start="opacity-0 transform scale-95"
                 x-transition:enter-end="opacity-100 transform scale-100"
                 x-transition:leave="transition ease-in duration-200"
                 x-transition:leave-start="opacity-100 transform scale-100"
                 x-transition:leave-end="opacity-0 transform scale-95">
                
                <div class="flex items-start">
                    <!-- アイコン -->
                    <div class="flex-shrink-0">
                        ${this._getIconSVG(config.icon, config.iconColor)}
                    </div>
                    
                    <!-- コンテンツ -->
                    <div class="ml-3 flex-1">
                        <div class="${config.textColor} text-sm font-medium">
                            ${message}
                        </div>
                        
                        ${isProgress ? this._getProgressBarHTML(options.progressData) : ''}
                        
                        ${options.action ? this._getActionHTML(options.action, config.textColor) : ''}
                    </div>
                    
                    <!-- 閉じるボタン -->
                    <div class="ml-4 flex-shrink-0">
                        <button type="button" 
                                class="${config.textColor} hover:opacity-75 focus:outline-none focus:opacity-75 transition-opacity"
                                @click="dismiss()">
                            <span class="sr-only">閉じる</span>
                            <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        return element;
    }

    /**
     * アイコンSVGの取得
     * @param {string} iconName - アイコン名
     * @param {string} colorClass - 色クラス
     * @returns {string} SVG HTML
     */
    _getIconSVG(iconName, colorClass) {
        const icons = {
            'check-circle': `
                <svg class="h-5 w-5 ${colorClass}" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
            `,
            'x-circle': `
                <svg class="h-5 w-5 ${colorClass}" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                </svg>
            `,
            'alert-triangle': `
                <svg class="h-5 w-5 ${colorClass}" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                </svg>
            `,
            'info': `
                <svg class="h-5 w-5 ${colorClass}" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
                </svg>
            `
        };
        
        return icons[iconName] || icons['info'];
    }

    /**
     * プログレスバーHTMLの取得
     * @param {Object} progressData - プログレスデータ
     * @returns {string} プログレスバーHTML
     */
    _getProgressBarHTML(progressData) {
        return `
            <div class="mt-2">
                <div class="bg-gray-200 rounded-full h-2">
                    <div class="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                         style="width: ${progressData.progress}%"
                         id="progress-bar-${progressData.id}">
                    </div>
                </div>
                <div class="text-xs text-gray-500 mt-1" id="progress-text-${progressData.id}">
                    ${progressData.progress}%
                </div>
            </div>
        `;
    }

    /**
     * アクションHTMLの取得
     * @param {Object} action - アクション設定
     * @param {string} textColor - テキスト色
     * @returns {string} アクションHTML
     */
    _getActionHTML(action, textColor) {
        return `
            <div class="mt-2">
                <button type="button" 
                        class="${textColor} underline hover:no-underline focus:outline-none focus:no-underline"
                        onclick="(${action.callback.toString()})()">
                    ${action.label}
                </button>
            </div>
        `;
    }

    /**
     * 通知の非表示
     * @param {Object} notification - 通知オブジェクト
     */
    _hideNotification(notification) {
        const element = notification.element;
        if (!element) return;

        notification.isVisible = false;
        
        // 非表示アニメーション
        element.classList.remove('translate-x-0');
        element.classList.add('translate-x-full');
        
        // 要素の削除
        setTimeout(() => {
            if (element.parentNode) {
                element.parentNode.removeChild(element);
            }
        }, 300);
    }

    /**
     * プログレス通知の更新
     * @param {Object} notification - 通知オブジェクト
     * @param {Object} progressData - プログレスデータ
     */
    _updateProgressNotification(notification, progressData) {
        const element = notification.element;
        if (!element) return;

        // メッセージの更新
        const messageElement = element.querySelector('.font-medium');
        if (messageElement) {
            messageElement.textContent = this._formatProgressMessage(progressData.message, progressData.progress);
        }

        // プログレスバーの更新
        const progressBar = element.querySelector(`#progress-bar-${progressData.id}`);
        if (progressBar) {
            progressBar.style.width = `${progressData.progress}%`;
        }

        // プログレステキストの更新
        const progressText = element.querySelector(`#progress-text-${progressData.id}`);
        if (progressText) {
            progressText.textContent = `${progressData.progress}%`;
        }
    }

    /**
     * 自動非表示のスケジュール
     * @param {string} notificationId - 通知ID
     * @param {number} duration - 継続時間
     */
    _scheduleAutoHide(notificationId, duration) {
        const notification = this.notifications.get(notificationId);
        if (!notification) return;

        notification.timer = setTimeout(() => {
            this.hide(notificationId);
        }, duration);
    }

    /**
     * 最大表示数の制限
     */
    _enforceMaxVisible() {
        const visibleNotifications = Array.from(this.notifications.values())
            .filter(n => n.isVisible)
            .sort((a, b) => a.createdAt - b.createdAt);

        while (visibleNotifications.length > this.defaultOptions.maxVisible) {
            const oldestNotification = visibleNotifications.shift();
            this.hide(oldestNotification.id);
        }
    }

    /**
     * Alpine.jsストアの更新
     */
    _updateAlpineStore() {
        if (window.Alpine && Alpine.store('app')) {
            Alpine.store('app').ui.notifications = this.getNotifications();
        }
    }

    /**
     * 通知音の再生
     * @param {string} type - 通知タイプ
     */
    _playNotificationSound(type) {
        // 簡単なビープ音（実際の実装では音声ファイルを使用）
        if (typeof window !== 'undefined' && window.AudioContext) {
            try {
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                const frequency = type === 'error' ? 220 : type === 'warning' ? 440 : 660;
                oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
                oscillator.type = 'sine';
                
                gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
                
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.2);
                
            } catch (error) {
                this.log('Failed to play notification sound', error);
            }
        }
    }

    /**
     * 通知IDの生成
     * @returns {string} 一意な通知ID
     */
    _generateNotificationId() {
        return `notification_${++this.notificationCounter}_${Date.now()}`;
    }

    /**
     * プログレスメッセージのフォーマット
     * @param {string} message - メッセージ
     * @param {number} progress - 進捗率
     * @returns {string} フォーマットされたメッセージ
     */
    _formatProgressMessage(message, progress) {
        return `${message} (${progress}%)`;
    }

    /**
     * ログ出力
     */
    log(message, data = null) {
        if (data !== null) {
            console.debug(`NotificationController: ${message}`, data);
        } else {
            console.debug(`NotificationController: ${message}`);
        }
    }
}

// ES6モジュールとしてエクスポート
export { NotificationController };