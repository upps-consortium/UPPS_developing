/**
 * ModuleRegistry.js - UPPS新アーキテクチャ モジュール管理システム
 * 
 * 動的モジュール管理、依存関係解決、ライフサイクル管理を提供
 * インターフェース定義書準拠実装
 */

class ModuleRegistry {
    constructor(eventBus, stateManager) {
        if (!eventBus || !stateManager) {
            throw new Error('ModuleRegistry requires EventBus and StateManager instances');
        }

        this.eventBus = eventBus;
        this.stateManager = stateManager;
        
        // モジュール管理
        this.modules = new Map(); // name -> module instance
        this.moduleStates = new Map(); // name -> state ('registered', 'initialized', 'started', 'stopped')
        this.dependencyGraph = new Map(); // name -> Set<dependency names>
        
        // ライフサイクル管理
        this.initializationOrder = [];
        this.isInitialized = false;
        this.isStarted = false;
        
        // 統計情報
        this.stats = {
            registered: 0,
            initialized: 0,
            started: 0,
            failed: 0
        };

        this.log('ModuleRegistry created');
    }

    /**
     * モジュールを登録
     * @param {string} name - モジュール名
     * @param {DomainModule} module - モジュールインスタンス
     */
    register(name, module) {
        if (!name || typeof name !== 'string') {
            throw new Error('Module name must be a non-empty string');
        }

        if (!module || typeof module !== 'object') {
            throw new Error('Module must be an object');
        }

        if (this.modules.has(name)) {
            throw new Error(`Module '${name}' is already registered`);
        }

        // モジュールの基本プロパティをチェック
        if (!module.name) {
            module.name = name;
        }

        // 依存関係情報を記録
        const dependencies = module.dependencies || [];
        this.dependencyGraph.set(name, new Set(dependencies));

        // モジュールを登録
        this.modules.set(name, module);
        this.moduleStates.set(name, 'registered');
        this.stats.registered++;

        this.log(`Module registered: ${name}`, { dependencies });
        this.eventBus.emit('module:registered', { name, module, dependencies });
    }

    /**
     * モジュールの登録を解除
     * @param {string} name - モジュール名
     */
    unregister(name) {
        if (!this.modules.has(name)) {
            this.log(`Module '${name}' not found for unregistration`);
            return;
        }

        const module = this.modules.get(name);
        const state = this.moduleStates.get(name);

        // 停止・破棄処理
        if (state === 'started') {
            this._stopModule(name);
        }
        if (state !== 'registered') {
            this._destroyModule(name);
        }

        // 登録解除
        this.modules.delete(name);
        this.moduleStates.delete(name);
        this.dependencyGraph.delete(name);
        
        // 初期化順序からも削除
        const orderIndex = this.initializationOrder.indexOf(name);
        if (orderIndex !== -1) {
            this.initializationOrder.splice(orderIndex, 1);
        }

        this.stats.registered--;
        this.log(`Module unregistered: ${name}`);
        this.eventBus.emit('module:unregistered', { name });
    }

    /**
     * モジュールを取得
     * @param {string} name - モジュール名
     * @returns {DomainModule|null} モジュールインスタンス
     */
    get(name) {
        return this.modules.get(name) || null;
    }

    /**
     * モジュールの存在確認
     * @param {string} name - モジュール名
     * @returns {boolean} 存在するかどうか
     */
    has(name) {
        return this.modules.has(name);
    }

    /**
     * 全モジュールを初期化
     * @returns {Promise<void>}
     */
    async initialize() {
        if (this.isInitialized) {
            this.log('ModuleRegistry already initialized');
            return;
        }

        this.log('Starting module initialization...');
        
        try {
            // 依存関係を解決
            this.resolveDependencies();
            
            // 循環依存をチェック
            const circularDeps = this.checkCircularDependencies();
            if (circularDeps.length > 0) {
                throw new Error(`Circular dependencies detected: ${circularDeps.join(', ')}`);
            }

            // 初期化順序に従って初期化
            for (const moduleName of this.initializationOrder) {
                await this._initializeModule(moduleName);
            }

            this.isInitialized = true;
            this.log('All modules initialized successfully');
            this.eventBus.emit('registry:initialized', { order: this.initializationOrder });
            
        } catch (error) {
            this.log(`Module initialization failed: ${error.message}`);
            this.eventBus.emit('registry:initialization:failed', { error: error.message });
            throw error;
        }
    }

    /**
     * 全モジュールを開始
     * @returns {Promise<void>}
     */
    async start() {
        if (!this.isInitialized) {
            throw new Error('ModuleRegistry must be initialized before starting');
        }

        if (this.isStarted) {
            this.log('ModuleRegistry already started');
            return;
        }

        this.log('Starting all modules...');

        try {
            // 初期化順序に従って開始
            for (const moduleName of this.initializationOrder) {
                await this._startModule(moduleName);
            }

            this.isStarted = true;
            this.log('All modules started successfully');
            this.eventBus.emit('registry:started');
            
        } catch (error) {
            this.log(`Module start failed: ${error.message}`);
            this.eventBus.emit('registry:start:failed', { error: error.message });
            throw error;
        }
    }

    /**
     * 全モジュールを停止
     * @returns {Promise<void>}
     */
    async stop() {
        if (!this.isStarted) {
            this.log('ModuleRegistry not started');
            return;
        }

        this.log('Stopping all modules...');

        try {
            // 開始と逆順で停止
            const stopOrder = [...this.initializationOrder].reverse();
            
            for (const moduleName of stopOrder) {
                await this._stopModule(moduleName);
            }

            this.isStarted = false;
            this.log('All modules stopped successfully');
            this.eventBus.emit('registry:stopped');
            
        } catch (error) {
            this.log(`Module stop failed: ${error.message}`);
            this.eventBus.emit('registry:stop:failed', { error: error.message });
            throw error;
        }
    }

    /**
     * 全モジュールを破棄
     * @returns {Promise<void>}
     */
    async destroy() {
        this.log('Destroying all modules...');

        try {
            // 先に停止
            if (this.isStarted) {
                await this.stop();
            }

            // 初期化と逆順で破棄
            const destroyOrder = [...this.initializationOrder].reverse();
            
            for (const moduleName of destroyOrder) {
                await this._destroyModule(moduleName);
            }

            // レジストリ自体をリセット
            this.modules.clear();
            this.moduleStates.clear();
            this.dependencyGraph.clear();
            this.initializationOrder = [];
            this.isInitialized = false;
            this.isStarted = false;

            this.log('All modules destroyed successfully');
            this.eventBus.emit('registry:destroyed');
            
        } catch (error) {
            this.log(`Module destroy failed: ${error.message}`);
            this.eventBus.emit('registry:destroy:failed', { error: error.message });
            throw error;
        }
    }

    /**
     * 依存関係を解決（トポロジカルソート）
     */
    resolveDependencies() {
        const visited = new Set();
        const visiting = new Set();
        const sorted = [];

        const visit = (moduleName) => {
            if (visiting.has(moduleName)) {
                throw new Error(`Circular dependency detected involving module: ${moduleName}`);
            }
            
            if (visited.has(moduleName)) {
                return;
            }

            visiting.add(moduleName);
            
            // 依存関係をチェック
            const dependencies = this.dependencyGraph.get(moduleName) || new Set();
            for (const dep of dependencies) {
                if (!this.modules.has(dep)) {
                    throw new Error(`Missing dependency: ${dep} required by ${moduleName}`);
                }
                visit(dep);
            }

            visiting.delete(moduleName);
            visited.add(moduleName);
            sorted.push(moduleName);
        };

        // 全モジュールを訪問
        for (const moduleName of this.modules.keys()) {
            visit(moduleName);
        }

        this.initializationOrder = sorted;
        this.log('Dependencies resolved', { order: sorted });
    }

    /**
     * 循環依存をチェック
     * @returns {string[]} 循環依存に関わるモジュール名の配列
     */
    checkCircularDependencies() {
        const circularDeps = [];
        const visited = new Set();
        const recursionStack = new Set();

        const hasCycle = (moduleName, path = []) => {
            if (recursionStack.has(moduleName)) {
                const cycleStart = path.indexOf(moduleName);
                const cycle = path.slice(cycleStart).concat(moduleName);
                circularDeps.push(cycle.join(' -> '));
                return true;
            }

            if (visited.has(moduleName)) {
                return false;
            }

            visited.add(moduleName);
            recursionStack.add(moduleName);
            
            const dependencies = this.dependencyGraph.get(moduleName) || new Set();
            for (const dep of dependencies) {
                if (hasCycle(dep, [...path, moduleName])) {
                    return true;
                }
            }

            recursionStack.delete(moduleName);
            return false;
        };

        for (const moduleName of this.modules.keys()) {
            hasCycle(moduleName);
        }

        return circularDeps;
    }

    /**
     * 統計情報を取得
     * @returns {Object} 統計情報
     */
    getStats() {
        return {
            ...this.stats,
            total: this.modules.size,
            states: this._getStateDistribution(),
            initializationOrder: [...this.initializationOrder]
        };
    }

    // ==================== 内部メソッド ====================

    /**
     * 個別モジュールの初期化
     */
    async _initializeModule(name) {
        const module = this.modules.get(name);
        const currentState = this.moduleStates.get(name);

        if (currentState !== 'registered') {
            return; // 既に初期化済み
        }

        try {
            this.log(`Initializing module: ${name}`);
            
            if (typeof module.initialize === 'function') {
                await module.initialize(this.eventBus, this.stateManager);
            }

            this.moduleStates.set(name, 'initialized');
            this.stats.initialized++;
            
            this.log(`Module initialized: ${name}`);
            this.eventBus.emit('module:initialized', { name });
            
        } catch (error) {
            this.stats.failed++;
            this.moduleStates.set(name, 'error');
            this.log(`Module initialization failed: ${name} - ${error.message}`);
            this.eventBus.emit('module:initialization:failed', { name, error: error.message });
            throw error;
        }
    }

    /**
     * 個別モジュールの開始
     */
    async _startModule(name) {
        const module = this.modules.get(name);
        const currentState = this.moduleStates.get(name);

        if (currentState !== 'initialized') {
            return; // 初期化されていないか既に開始済み
        }

        try {
            this.log(`Starting module: ${name}`);
            
            if (typeof module.start === 'function') {
                await module.start();
            }

            this.moduleStates.set(name, 'started');
            this.stats.started++;
            
            this.log(`Module started: ${name}`);
            this.eventBus.emit('module:started', { name });
            
        } catch (error) {
            this.stats.failed++;
            this.moduleStates.set(name, 'error');
            this.log(`Module start failed: ${name} - ${error.message}`);
            this.eventBus.emit('module:start:failed', { name, error: error.message });
            throw error;
        }
    }

    /**
     * 個別モジュールの停止
     */
    async _stopModule(name) {
        const module = this.modules.get(name);
        const currentState = this.moduleStates.get(name);

        if (currentState !== 'started') {
            return; // 開始されていない
        }

        try {
            this.log(`Stopping module: ${name}`);
            
            if (typeof module.stop === 'function') {
                await module.stop();
            }

            this.moduleStates.set(name, 'initialized');
            this.stats.started--;
            
            this.log(`Module stopped: ${name}`);
            this.eventBus.emit('module:stopped', { name });
            
        } catch (error) {
            this.log(`Module stop failed: ${name} - ${error.message}`);
            this.eventBus.emit('module:stop:failed', { name, error: error.message });
            // stopは失敗しても続行
        }
    }

    /**
     * 個別モジュールの破棄
     */
    async _destroyModule(name) {
        const module = this.modules.get(name);

        try {
            this.log(`Destroying module: ${name}`);
            
            if (typeof module.destroy === 'function') {
                await module.destroy();
            }

            this.moduleStates.set(name, 'registered');
            
            this.log(`Module destroyed: ${name}`);
            this.eventBus.emit('module:destroyed', { name });
            
        } catch (error) {
            this.log(`Module destroy failed: ${name} - ${error.message}`);
            this.eventBus.emit('module:destroy:failed', { name, error: error.message });
            // destroyは失敗しても続行
        }
    }

    /**
     * 状態分布を取得
     */
    _getStateDistribution() {
        const distribution = {};
        for (const state of this.moduleStates.values()) {
            distribution[state] = (distribution[state] || 0) + 1;
        }
        return distribution;
    }

    /**
     * ログ出力
     */
    log(message, data = null) {
        if (data !== null) {
            console.debug(`ModuleRegistry: ${message}`, data);
        } else {
            console.debug(`ModuleRegistry: ${message}`);
        }
    }
}

// ES6モジュールとしてエクスポート
export { ModuleRegistry };