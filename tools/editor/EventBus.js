/**
 * EventBus.js - UPPS新アーキテクチャ イベント通信システム
 * 
 * パブサブパターンとミドルウェア対応のイベント通信を提供
 * インターフェース定義書準拠実装
 */

class EventBus {
    constructor(options = {}) {
        // 設定
        this.options = {
            enableLogging: true,
            maxListeners: 100,
            enableWildcard: true,
            ...options
        };

        // イベントハンドラーストレージ
        this.events = new Map(); // eventName -> Set<handler>
        this.onceEvents = new Map(); // eventName -> Set<handler>
        this.middlewares = []; // ミドルウェア配列
        this.namespaces = new Map(); // namespace -> EventBus instance
        
        // 統計情報
        this.stats = {
            emitted: 0,
            handled: 0,
            errors: 0
        };

        this.log('EventBus initialized');
    }

    /**
     * イベントを発火
     * @param {string} event - イベント名
     * @param {any} data - イベントデータ
     */
    emit(event, data = null) {
        this.stats.emitted++;
        
        this.log(`Emitting event: ${event}`, data);

        try {
            // ミドルウェアチェーンを実行
            this._runMiddlewares(event, data, () => {
                // 通常のハンドラー実行
                this._executeHandlers(event, data);
                
                // ワイルドカード対応
                if (this.options.enableWildcard) {
                    this._executeWildcardHandlers(event, data);
                }
            });
        } catch (error) {
            this.stats.errors++;
            console.error(`EventBus: Error emitting event '${event}'`, error);
        }
    }

    /**
     * イベントハンドラーを登録
     * @param {string} event - イベント名
     * @param {Function} handler - ハンドラー関数
     * @returns {Function} 登録解除関数
     */
    on(event, handler) {
        if (typeof handler !== 'function') {
            throw new Error('EventBus: Handler must be a function');
        }

        // リスナー数制限チェック
        this._checkMaxListeners(event);

        // ハンドラーを登録
        if (!this.events.has(event)) {
            this.events.set(event, new Set());
        }
        
        this.events.get(event).add(handler);
        
        this.log(`Handler registered for event: ${event}`);

        // 登録解除関数を返す
        return () => this.off(event, handler);
    }

    /**
     * イベントハンドラーを削除
     * @param {string} event - イベント名
     * @param {Function} handler - ハンドラー関数（省略時は全ハンドラー削除）
     */
    off(event, handler = null) {
        if (handler === null) {
            // 指定イベントの全ハンドラーを削除
            this.events.delete(event);
            this.onceEvents.delete(event);
            this.log(`All handlers removed for event: ${event}`);
        } else {
            // 特定ハンドラーを削除
            const eventHandlers = this.events.get(event);
            if (eventHandlers) {
                eventHandlers.delete(handler);
                if (eventHandlers.size === 0) {
                    this.events.delete(event);
                }
            }

            const onceHandlers = this.onceEvents.get(event);
            if (onceHandlers) {
                onceHandlers.delete(handler);
                if (onceHandlers.size === 0) {
                    this.onceEvents.delete(event);
                }
            }
            
            this.log(`Handler removed for event: ${event}`);
        }
    }

    /**
     * 一度だけ実行されるイベントハンドラーを登録
     * @param {string} event - イベント名
     * @param {Function} handler - ハンドラー関数
     */
    once(event, handler) {
        if (typeof handler !== 'function') {
            throw new Error('EventBus: Handler must be a function');
        }

        // リスナー数制限チェック
        this._checkMaxListeners(event);

        // onceハンドラーを登録
        if (!this.onceEvents.has(event)) {
            this.onceEvents.set(event, new Set());
        }
        
        this.onceEvents.get(event).add(handler);
        
        this.log(`Once handler registered for event: ${event}`);
    }

    /**
     * 名前空間付きEventBusを作成
     * @param {string} name - 名前空間名
     * @returns {EventBus} 名前空間付きEventBus
     */
    namespace(name) {
        if (this.namespaces.has(name)) {
            return this.namespaces.get(name);
        }

        // 名前空間付きEventBusを作成
        const namespacedBus = new NamespacedEventBus(this, name);
        this.namespaces.set(name, namespacedBus);
        
        this.log(`Namespace created: ${name}`);
        
        return namespacedBus;
    }

    /**
     * ミドルウェアを追加
     * @param {Function} middleware - ミドルウェア関数
     */
    use(middleware) {
        if (typeof middleware !== 'function') {
            throw new Error('EventBus: Middleware must be a function');
        }

        this.middlewares.push(middleware);
        this.log('Middleware added');
    }

    /**
     * 登録されているイベント一覧を取得
     * @returns {string[]} イベント名の配列
     */
    listEvents() {
        const allEvents = new Set([
            ...this.events.keys(),
            ...this.onceEvents.keys()
        ]);
        
        return Array.from(allEvents);
    }

    /**
     * 指定イベントにリスナーがあるかチェック
     * @param {string} event - イベント名
     * @returns {boolean} リスナーの有無
     */
    hasListeners(event) {
        const hasRegular = this.events.has(event) && this.events.get(event).size > 0;
        const hasOnce = this.onceEvents.has(event) && this.onceEvents.get(event).size > 0;
        
        return hasRegular || hasOnce;
    }

    /**
     * すべてのイベントハンドラーをクリア
     */
    clear() {
        this.events.clear();
        this.onceEvents.clear();
        this.namespaces.clear();
        
        this.log('All event handlers cleared');
    }

    /**
     * 統計情報を取得
     * @returns {Object} 統計情報
     */
    getStats() {
        return {
            ...this.stats,
            totalEvents: this.listEvents().length,
            totalHandlers: this._getTotalHandlerCount(),
            namespaces: Array.from(this.namespaces.keys())
        };
    }

    // ==================== 内部メソッド ====================

    /**
     * ミドルウェアチェーンを実行
     */
    _runMiddlewares(event, data, next) {
        let index = 0;

        const runNext = () => {
            if (index >= this.middlewares.length) {
                // すべてのミドルウェア実行完了
                next();
                return;
            }

            const middleware = this.middlewares[index++];
            
            try {
                middleware(event, data, runNext);
            } catch (error) {
                this.stats.errors++;
                console.error(`EventBus: Error in middleware`, error);
                runNext(); // エラーでも続行
            }
        };

        runNext();
    }

    /**
     * 通常のハンドラーを実行
     */
    _executeHandlers(event, data) {
        // 通常のハンドラー実行
        const eventHandlers = this.events.get(event);
        if (eventHandlers) {
            eventHandlers.forEach(handler => {
                this._safeExecuteHandler(handler, data, event);
            });
        }

        // onceハンドラー実行（実行後に削除）
        const onceHandlers = this.onceEvents.get(event);
        if (onceHandlers) {
            onceHandlers.forEach(handler => {
                this._safeExecuteHandler(handler, data, event);
            });
            this.onceEvents.delete(event);
        }
    }

    /**
     * ワイルドカードハンドラーを実行
     */
    _executeWildcardHandlers(event, data) {
        // 'module.*' のようなワイルドカードパターンをサポート
        const eventParts = event.split('.');
        
        for (const [wildcardEvent, handlers] of this.events) {
            if (this._matchWildcard(wildcardEvent, eventParts)) {
                handlers.forEach(handler => {
                    this._safeExecuteHandler(handler, data, event);
                });
            }
        }
    }

    /**
     * ワイルドカードマッチング
     */
    _matchWildcard(pattern, eventParts) {
        if (!pattern.includes('*')) return false;
        
        const patternParts = pattern.split('.');
        
        if (patternParts.length !== eventParts.length) return false;
        
        for (let i = 0; i < patternParts.length; i++) {
            if (patternParts[i] !== '*' && patternParts[i] !== eventParts[i]) {
                return false;
            }
        }
        
        return true;
    }

    /**
     * ハンドラーを安全に実行
     */
    _safeExecuteHandler(handler, data, event) {
        try {
            handler(data);
            this.stats.handled++;
        } catch (error) {
            this.stats.errors++;
            console.error(`EventBus: Error in handler for event '${event}'`, error);
        }
    }

    /**
     * 最大リスナー数チェック
     */
    _checkMaxListeners(event) {
        const currentCount = this._getHandlerCount(event);
        if (currentCount >= this.options.maxListeners) {
            console.warn(`EventBus: Max listeners (${this.options.maxListeners}) reached for event '${event}'`);
        }
    }

    /**
     * 指定イベントのハンドラー数を取得
     */
    _getHandlerCount(event) {
        const regularCount = this.events.has(event) ? this.events.get(event).size : 0;
        const onceCount = this.onceEvents.has(event) ? this.onceEvents.get(event).size : 0;
        return regularCount + onceCount;
    }

    /**
     * 全ハンドラー数を取得
     */
    _getTotalHandlerCount() {
        let total = 0;
        for (const handlers of this.events.values()) {
            total += handlers.size;
        }
        for (const handlers of this.onceEvents.values()) {
            total += handlers.size;
        }
        return total;
    }

    /**
     * ログ出力
     */
    log(message, data = null) {
        if (this.options.enableLogging) {
            if (data !== null) {
                console.debug(`EventBus: ${message}`, data);
            } else {
                console.debug(`EventBus: ${message}`);
            }
        }
    }

    /**
     * 破棄処理
     */
    destroy() {
        this.clear();
        this.middlewares = [];
        this.log('EventBus destroyed');
    }
}

/**
 * 名前空間付きEventBus
 */
class NamespacedEventBus {
    constructor(parentBus, namespace) {
        this.parent = parentBus;
        this.namespace = namespace;
    }

    emit(event, data) {
        const namespacedEvent = `${this.namespace}:${event}`;
        this.parent.emit(namespacedEvent, data);
    }

    on(event, handler) {
        const namespacedEvent = `${this.namespace}:${event}`;
        return this.parent.on(namespacedEvent, handler);
    }

    off(event, handler) {
        const namespacedEvent = `${this.namespace}:${event}`;
        this.parent.off(namespacedEvent, handler);
    }

    once(event, handler) {
        const namespacedEvent = `${this.namespace}:${event}`;
        this.parent.once(namespacedEvent, handler);
    }

    namespace(name) {
        const combinedNamespace = `${this.namespace}:${name}`;
        return this.parent.namespace(combinedNamespace);
    }

    use(middleware) {
        // 名前空間固有のミドルウェアラッパー
        const namespacedMiddleware = (event, data, next) => {
            if (event.startsWith(`${this.namespace}:`)) {
                const localEvent = event.substring(this.namespace.length + 1);
                middleware(localEvent, data, next);
            } else {
                next();
            }
        };
        
        this.parent.use(namespacedMiddleware);
    }

    listEvents() {
        const prefix = `${this.namespace}:`;
        return this.parent.listEvents()
            .filter(event => event.startsWith(prefix))
            .map(event => event.substring(prefix.length));
    }

    hasListeners(event) {
        const namespacedEvent = `${this.namespace}:${event}`;
        return this.parent.hasListeners(namespacedEvent);
    }

    clear() {
        const prefix = `${this.namespace}:`;
        const eventsToRemove = this.parent.listEvents()
            .filter(event => event.startsWith(prefix));
        
        eventsToRemove.forEach(event => {
            this.parent.off(event);
        });
    }
}

// ES6モジュールとしてエクスポート
export { EventBus, NamespacedEventBus };