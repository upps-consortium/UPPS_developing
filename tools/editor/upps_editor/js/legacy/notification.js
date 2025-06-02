// js/ui/notification.js
// 通知システムの管理

/**
 * 通知管理クラス
 */
class NotificationManager {
    constructor() {
        this.notifications = new Set();
        this.maxNotifications = 5;
        this.defaultDuration = 4000;
        this.container = null;
        this.initialized = false;
    }
    
    /**
     * 通知システムを初期化
     */
    initialize() {
        if (this.initialized) return;
        
        // 通知コンテナを作成
        this.container = document.createElement('div');
        this.container.id = 'notification-container';
        this.container.className = 'fixed top-4 right-4 z-50 space-y-2';
        this.container.style.maxWidth = '400px';
        
        document.body.appendChild(this.container);
        
        this.initialized = true;
        window.UPPS_LOG.debug('Notification system initialized');
    }
    
    /**
     * 通知を表示
     * @param {string} message メッセージ
     * @param {string} type 通知タイプ ('success', 'error', 'warning', 'info')
     * @param {number} duration 表示時間（ミリ秒）
     * @param {Object} options 追加オプション
     * @returns {string} 通知ID
     */
    show(message, type = 'info', duration = null, options = {}) {
        this.initialize();
        
        // 最大通知数チェック
        if (this.notifications.size >= this.maxNotifications) {
            this.removeOldest();
        }
        
        const notificationId = this.generateId();
        const actualDuration = duration || this.defaultDuration;
        
        // 通知要素を作成
        const notification = this.createNotificationElement(notificationId, message, type, options);
        
        // コンテナに追加
        this.container.appendChild(notification);
        
        // セットに追加
        this.notifications.add(notificationId);
        
        // アニメーション開始
        this.animateIn(notification);
        
        // 自動削除タイマー
        if (actualDuration > 0) {
            setTimeout(() => {
                this.hide(notificationId);
            }, actualDuration);
        }
        
        window.UPPS_LOG.debug('Notification shown', { id: notificationId, type, message });
        
        return notificationId;
    }
    
    /**
     * 通知要素を作成
     * @param {string} id 通知ID
     * @param {string} message メッセージ
     * @param {string} type 通知タイプ
     * @param {Object} options オプション
     * @returns {HTMLElement} 通知要素
     */
    createNotificationElement(id, message, type, options) {
        const notification = document.createElement('div');
        notification.id = `notification-${id}`;
        notification.className = `notification notification-${type} rounded-lg shadow-lg p-4 text-white relative overflow-hidden`;
        
        // タイプ別の背景色
        const colors = {
            success: 'bg-green-500',
            error: 'bg-red-500',
            warning: 'bg-yellow-500',
            info: 'bg-blue-500'
        };
        
        notification.classList.add(colors[type] || colors.info);
        
        // アイコンマッピング
        const icons = {
            success: 'check-circle',
            error: 'alert-triangle',
            warning: 'alert-circle',
            info: 'info'
        };
        
        // 内容を構築
        const content = `
            <div class="flex items-start space-x-3">
                <div class="flex-shrink-0">
                    <i data-lucide="${icons[type] || icons.info}" class="w-5 h-5 mt-0.5"></i>
                </div>
                <div class="flex-1">
                    <div class="text-sm font-medium">
                        ${this.escapeHtml(message)}
                    </div>
                    ${options.description ? `<div class="text-xs opacity-90 mt-1">${this.escapeHtml(options.description)}</div>` : ''}
                </div>
                <div class="flex-shrink-0">
                    <button class="notification-close text-white/80 hover:text-white transition-colors" data-notification-id="${id}">
                        <i data-lucide="x" class="w-4 h-4"></i>
                    </button>
                </div>
            </div>
        `;
        
        notification.innerHTML = content;
        
        // 閉じるボタンのイベント
        const closeButton = notification.querySelector('.notification-close');
        closeButton.addEventListener('click', () => {
            this.hide(id);
        });
        
        // アクションボタン（オプション）
        if (options.action) {
            const actionButton = document.createElement('button');
            actionButton.className = 'mt-3 text-sm underline hover:no-underline';
            actionButton.textContent = options.action.label;
            actionButton.addEventListener('click', () => {
                options.action.callback();
                this.hide(id);
            });
            notification.querySelector('.flex-1').appendChild(actionButton);
        }
        
        // 初期状態（非表示）
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        notification.style.transition = 'all 0.3s ease-in-out';
        
        return notification;
    }
    
    /**
     * 通知をアニメーションで表示
     * @param {HTMLElement} notification 通知要素
     */
    animateIn(notification) {
        // Lucideアイコンの初期化
        if (window.lucide) {
            window.lucide.createIcons({ nameAttr: 'data-lucide' });
        }
        
        // アニメーション開始
        requestAnimationFrame(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        });
    }
    
    /**
     * 通知をアニメーションで非表示
     * @param {HTMLElement} notification 通知要素
     * @returns {Promise} アニメーション完了のPromise
     */
    animateOut(notification) {
        return new Promise((resolve) => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
                resolve();
            }, 300);
        });
    }
    
    /**
     * 通知を非表示
     * @param {string} notificationId 通知ID
     */
    async hide(notificationId) {
        const notification = document.getElementById(`notification-${notificationId}`);
        if (!notification) return;
        
        // セットから削除
        this.notifications.delete(notificationId);
        
        // アニメーションで非表示
        await this.animateOut(notification);
        
        window.UPPS_LOG.debug('Notification hidden', { id: notificationId });
    }
    
    /**
     * すべての通知を非表示
     */
    async hideAll() {
        const promises = Array.from(this.notifications).map(id => this.hide(id));
        await Promise.all(promises);
    }
    
    /**
     * 最も古い通知を削除
     */
    removeOldest() {
        if (this.notifications.size === 0) return;
        
        const oldestId = this.notifications.values().next().value;
        this.hide(oldestId);
    }
    
    /**
     * バリデーションエラーを表示
     * @param {Object} errors エラーオブジェクト
     * @param {Object} options オプション
     */
    showValidationErrors(errors, options = {}) {
        const errorCount = Object.keys(errors).length;
        if (errorCount === 0) return;
        
        // エラーサマリーメッセージ
        let message = `入力エラーが${errorCount}件あります`;
        
        // タブ別エラー数の計算
        const tabErrors = this.categorizeErrors(errors);
        const tabMessages = [];
        
        for (const [tab, count] of Object.entries(tabErrors)) {
            if (count > 0) {
                const tabName = this.getTabDisplayName(tab);
                tabMessages.push(`${tabName}: ${count}件`);
            }
        }
        
        const description = tabMessages.length > 0 ? tabMessages.join(', ') : null;
        
        // エラー通知を表示
        this.show(message, 'error', 8000, {
            description,
            action: {
                label: '最初のエラーに移動',
                callback: () => this.navigateToFirstError(tabErrors)
            }
        });
        
        window.UPPS_LOG.info('Validation errors displayed', { errorCount, tabErrors });
    }
    
    /**
     * エラーをタブ別に分類
     * @param {Object} errors エラーオブジェクト
     * @returns {Object} タブ別エラー数
     */
    categorizeErrors(errors) {
        const tabErrors = {
            basic: 0,
            emotion: 0,
            personality: 0,
            memory: 0,
            association: 0,
            cognitive: 0,
            unknown: 0
        };
        
        for (const key of Object.keys(errors)) {
            if (key.startsWith('name') || key.startsWith('age') || key.startsWith('gender') || 
                key.startsWith('occupation') || key.startsWith('background')) {
                tabErrors.basic++;
            } else if (key.startsWith('emotion') || key.includes('emotion')) {
                tabErrors.emotion++;
            } else if (key.startsWith('trait') || key.startsWith('personality')) {
                tabErrors.personality++;
            } else if (key.startsWith('memory') || key.includes('memory')) {
                tabErrors.memory++;
            } else if (key.startsWith('assoc') || key.includes('trigger') || key.includes('response')) {
                tabErrors.association++;
            } else if (key.startsWith('ability') || key.startsWith('cognitive')) {
                tabErrors.cognitive++;
            } else {
                tabErrors.unknown++;
            }
        }
        
        return tabErrors;
    }
    
    /**
     * タブ表示名を取得
     * @param {string} tabId タブID
     * @returns {string} 表示名
     */
    getTabDisplayName(tabId) {
        const displayNames = {
            basic: '基本情報',
            emotion: '感情システム',
            personality: '性格特性',
            memory: '記憶システム',
            association: '関連性',
            cognitive: '認知能力',
            unknown: 'その他'
        };
        
        return displayNames[tabId] || tabId;
    }
    
    /**
     * 最初のエラーがあるタブに移動
     * @param {Object} tabErrors タブ別エラー数
     */
    navigateToFirstError(tabErrors) {
        const tabPriority = ['basic', 'emotion', 'personality', 'memory', 'association', 'cognitive'];
        
        for (const tab of tabPriority) {
            if (tabErrors[tab] > 0) {
                if (window.uppsEditor) {
                    window.uppsEditor.activeTab = tab;
                }
                break;
            }
        }
    }
    
    /**
     * 成功通知のショートカット
     * @param {string} message メッセージ
     * @param {Object} options オプション
     */
    success(message, options = {}) {
        return this.show(message, 'success', this.defaultDuration, options);
    }
    
    /**
     * エラー通知のショートカット
     * @param {string} message メッセージ
     * @param {Object} options オプション
     */
    error(message, options = {}) {
        return this.show(message, 'error', this.defaultDuration * 2, options);
    }
    
    /**
     * 警告通知のショートカット
     * @param {string} message メッセージ
     * @param {Object} options オプション
     */
    warning(message, options = {}) {
        return this.show(message, 'warning', this.defaultDuration, options);
    }
    
    /**
     * 情報通知のショートカット
     * @param {string} message メッセージ
     * @param {Object} options オプション
     */
    info(message, options = {}) {
        return this.show(message, 'info', this.defaultDuration, options);
    }
    
    /**
     * 進行状況通知
     * @param {string} message メッセージ
     * @param {number} progress 進行率 (0-100)
     * @returns {string} 通知ID
     */
    showProgress(message, progress = 0) {
        const notificationId = this.generateId();
        const notification = this.createProgressNotification(notificationId, message, progress);
        
        this.initialize();
        this.container.appendChild(notification);
        this.notifications.add(notificationId);
        this.animateIn(notification);
        
        return notificationId;
    }
    
    /**
     * 進行状況通知を更新
     * @param {string} notificationId 通知ID
     * @param {string} message メッセージ
     * @param {number} progress 進行率 (0-100)
     */
    updateProgress(notificationId, message, progress) {
        const notification = document.getElementById(`notification-${notificationId}`);
        if (!notification) return;
        
        const messageElement = notification.querySelector('.progress-message');
        const progressBar = notification.querySelector('.progress-bar');
        const progressText = notification.querySelector('.progress-text');
        
        if (messageElement) messageElement.textContent = message;
        if (progressBar) progressBar.style.width = `${progress}%`;
        if (progressText) progressText.textContent = `${Math.round(progress)}%`;
    }
    
    /**
     * 進行状況通知要素を作成
     * @param {string} id 通知ID
     * @param {string} message メッセージ
     * @param {number} progress 進行率
     * @returns {HTMLElement} 通知要素
     */
    createProgressNotification(id, message, progress) {
        const notification = document.createElement('div');
        notification.id = `notification-${id}`;
        notification.className = 'notification bg-blue-500 rounded-lg shadow-lg p-4 text-white';
        
        notification.innerHTML = `
            <div class="flex items-center justify-between mb-2">
                <span class="progress-message text-sm font-medium">${this.escapeHtml(message)}</span>
                <span class="progress-text text-xs">${Math.round(progress)}%</span>
            </div>
            <div class="w-full bg-blue-700 rounded-full h-2">
                <div class="progress-bar bg-white h-2 rounded-full transition-all duration-300" style="width: ${progress}%"></div>
            </div>
        `;
        
        // 初期状態
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        notification.style.transition = 'all 0.3s ease-in-out';
        
        return notification;
    }
    
    /**
     * HTMLエスケープ
     * @param {string} text テキスト
     * @returns {string} エスケープされたテキスト
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    /**
     * 一意なIDを生成
     * @returns {string} ID
     */
    generateId() {
        return 'notif_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    /**
     * 通知システムをクリーンアップ
     */
    cleanup() {
        this.hideAll();
        
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
        
        this.container = null;
        this.initialized = false;
        this.notifications.clear();
        
        window.UPPS_LOG.debug('Notification system cleaned up');
    }
}

// グローバルインスタンスを作成
window.NotificationManager = new NotificationManager();

// UPPSEditorプロトタイプに関数を追加
if (typeof UPPSEditor !== 'undefined') {
    UPPSEditor.prototype.showNotification = function(message, type = 'info', options = {}) {
        return window.NotificationManager.show(message, type, null, options);
    };
    
    UPPSEditor.prototype.showValidationErrors = function(errors) {
        window.NotificationManager.showValidationErrors(errors);
    };
    
    UPPSEditor.prototype.hideAllNotifications = function() {
        return window.NotificationManager.hideAll();
    };
}

// ページアンロード時のクリーンアップ
window.addEventListener('beforeunload', () => {
    window.NotificationManager.cleanup();
});

window.UPPS_LOG.info('Notification system module initialized');
