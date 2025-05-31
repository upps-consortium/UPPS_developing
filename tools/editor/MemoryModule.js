/**
 * MemoryModule.js - UPPS新アーキテクチャ 記憶システムモジュール
 * 
 * 記憶データの管理、操作、検証を担当するドメインモジュール
 * インターフェース定義書準拠実装
 */

class MemoryModule {
    constructor() {
        this.name = 'MemoryModule';
        this.dependencies = []; // 他モジュールへの依存なし
        
        // 記憶タイプの定義
        this.supportedTypes = ['episodic', 'semantic', 'procedural', 'autobiographical'];
        
        // ID検証パターン
        this.idPattern = /^[a-zA-Z0-9_]+$/;
        
        // バリデーション設定
        this.validation = {
            maxContentLength: 1000,
            maxIdLength: 50,
            minIdLength: 1
        };
        
        // モジュール状態
        this.eventBus = null;
        this.stateManager = null;
        this.isInitialized = false;
        
        this.log('MemoryModule created');
    }

    /**
     * モジュールの初期化
     * @param {EventBus} eventBus - イベントバス
     * @param {StateManager} stateManager - 状態管理
     */
    async initialize(eventBus, stateManager) {
        if (this.isInitialized) {
            this.log('MemoryModule already initialized');
            return;
        }

        this.eventBus = eventBus;
        this.stateManager = stateManager;

        // イベントハンドラーの設定
        this._setupEventHandlers();

        // 状態の初期化
        this._initializeState();

        this.isInitialized = true;
        this.log('MemoryModule initialized successfully');
        
        this.eventBus.emit('memory:module:initialized');
    }

    /**
     * モジュールの開始
     */
    async start() {
        if (!this.isInitialized) {
            throw new Error('MemoryModule must be initialized before starting');
        }

        // 既存データの検証と修正
        this._validateExistingMemories();

        this.log('MemoryModule started successfully');
        this.eventBus.emit('memory:module:started');
    }

    /**
     * モジュールの停止
     */
    async stop() {
        this.log('MemoryModule stopped');
        this.eventBus.emit('memory:module:stopped');
    }

    /**
     * モジュールの破棄
     */
    async destroy() {
        this.eventBus = null;
        this.stateManager = null;
        this.isInitialized = false;
        
        this.log('MemoryModule destroyed');
    }

    // ==================== 記憶操作メソッド ====================

    /**
     * 新しい記憶を追加
     * @param {Object} memory - 記憶データ
     * @returns {string} 追加された記憶のID
     */
    addMemory(memory) {
        const validationResult = this.validate(memory);
        if (!validationResult.valid) {
            const errors = validationResult.errors.map(e => e.message).join(', ');
            throw new Error(`Memory validation failed: ${errors}`);
        }

        // 一意なIDの生成
        const memoryId = memory.id || this.generateUniqueId();
        
        // 記憶データの構築
        const newMemory = {
            id: memoryId,
            type: memory.type || 'episodic',
            content: memory.content || '',
            period: memory.period || '',
            emotional_valence: memory.emotional_valence || 0.5,
            metadata: memory.metadata || {},
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        // 状態への追加
        const currentMemories = this.stateManager.getState('persona.memory_system.memories') || [];
        const updatedMemories = [...currentMemories, newMemory];
        
        this.stateManager.setState('persona.memory_system.memories', updatedMemories);

        this.log('Memory added', { memoryId, type: newMemory.type });
        this.eventBus.emit('memory:added', { memory: newMemory });

        return memoryId;
    }

    /**
     * 記憶を更新
     * @param {string} id - 記憶ID
     * @param {Object} updates - 更新内容
     */
    updateMemory(id, updates) {
        const currentMemories = this.stateManager.getState('persona.memory_system.memories') || [];
        const memoryIndex = currentMemories.findIndex(m => m.id === id);
        
        if (memoryIndex === -1) {
            throw new Error(`Memory not found: ${id}`);
        }

        // 更新データの検証
        const updatedMemory = { ...currentMemories[memoryIndex], ...updates };
        updatedMemory.updated_at = new Date().toISOString();
        
        const validationResult = this.validate(updatedMemory);
        if (!validationResult.valid) {
            const errors = validationResult.errors.map(e => e.message).join(', ');
            throw new Error(`Memory validation failed: ${errors}`);
        }

        // IDが変更された場合の処理
        if (updates.id && updates.id !== id) {
            this.updateReferences(id, updates.id);
        }

        // 状態の更新
        const updatedMemories = [...currentMemories];
        updatedMemories[memoryIndex] = updatedMemory;
        
        this.stateManager.setState('persona.memory_system.memories', updatedMemories);

        this.log('Memory updated', { id, updates });
        this.eventBus.emit('memory:updated', { id, memory: updatedMemory, oldId: id });
    }

    /**
     * 記憶を削除
     * @param {string} id - 記憶ID
     */
    removeMemory(id) {
        const currentMemories = this.stateManager.getState('persona.memory_system.memories') || [];
        const memoryIndex = currentMemories.findIndex(m => m.id === id);
        
        if (memoryIndex === -1) {
            throw new Error(`Memory not found: ${id}`);
        }

        const memory = currentMemories[memoryIndex];

        // 関連性の削除を他のモジュールに委ねる
        this.eventBus.emit('memory:before:remove', { id, memory });

        // 状態から削除
        const updatedMemories = currentMemories.filter(m => m.id !== id);
        this.stateManager.setState('persona.memory_system.memories', updatedMemories);

        this.log('Memory removed', { id });
        this.eventBus.emit('memory:removed', { id, memory });
    }

    /**
     * IDで記憶を取得
     * @param {string} id - 記憶ID
     * @returns {Object|null} 記憶データまたはnull
     */
    getMemory(id) {
        const memories = this.stateManager.getState('persona.memory_system.memories') || [];
        return memories.find(m => m.id === id) || null;
    }

    /**
     * タイプで記憶を取得
     * @param {string} type - 記憶タイプ
     * @returns {Array} 記憶データの配列
     */
    getMemoriesByType(type) {
        const memories = this.stateManager.getState('persona.memory_system.memories') || [];
        return memories.filter(m => m.type === type);
    }

    /**
     * 全記憶を取得
     * @returns {Array} 記憶データの配列
     */
    list() {
        return this.stateManager.getState('persona.memory_system.memories') || [];
    }

    // ==================== ID管理メソッド ====================

    /**
     * 記憶IDを更新
     * @param {string} oldId - 古いID
     * @param {string} newId - 新しいID
     */
    updateMemoryId(oldId, newId) {
        this.updateMemory(oldId, { id: newId });
    }

    /**
     * 一意なIDを生成
     * @returns {string} 一意なID
     */
    generateUniqueId() {
        const existingMemories = this.list();
        const existingIds = new Set(existingMemories.map(m => m.id));
        
        let counter = 1;
        let candidateId;
        
        do {
            candidateId = `memory_${counter}`;
            counter++;
        } while (existingIds.has(candidateId));
        
        return candidateId;
    }

    /**
     * IDの妥当性検証
     * @param {string} id - 記憶ID
     * @returns {boolean} 妥当かどうか
     */
    validateId(id) {
        return typeof id === 'string' && 
               id.length >= this.validation.minIdLength && 
               id.length <= this.validation.maxIdLength && 
               this.idPattern.test(id);
    }

    // ==================== 関連性対応メソッド ====================

    /**
     * 参照されている記憶IDを取得
     * @returns {Array} 参照されている記憶IDの配列
     */
    getReferencedMemories() {
        const associations = this.stateManager.getState('persona.association_system.associations') || [];
        const referencedIds = new Set();

        associations.forEach(assoc => {
            // トリガー側の記憶参照
            if (assoc.trigger.type === 'memory' && assoc.trigger.id) {
                referencedIds.add(assoc.trigger.id);
            }

            // 複合トリガー内の記憶参照
            if (assoc.trigger.type === 'complex' && assoc.trigger.conditions) {
                assoc.trigger.conditions.forEach(cond => {
                    if (cond.type === 'memory' && cond.id) {
                        referencedIds.add(cond.id);
                    }
                });
            }

            // レスポンス側の記憶参照
            if (assoc.response.type === 'memory' && assoc.response.id) {
                referencedIds.add(assoc.response.id);
            }
        });

        return Array.from(referencedIds);
    }

    /**
     * 記憶ID参照を更新
     * @param {string} oldId - 古いID
     * @param {string} newId - 新しいID
     */
    updateReferences(oldId, newId) {
        if (oldId === newId) return;

        // 他のモジュールに参照更新を通知
        this.eventBus.emit('memory:id:changed', { oldId, newId });

        this.log('Memory references updated', { oldId, newId });
    }

    // ==================== バリデーション ====================

    /**
     * 記憶データのバリデーション
     * @param {Object} memory - 記憶データ
     * @returns {Object} バリデーション結果
     */
    validate(memory) {
        const errors = [];

        // ID検証
        if (memory.id && !this.validateId(memory.id)) {
            errors.push({
                field: 'id',
                message: `Invalid ID format: ${memory.id}`,
                code: 'INVALID_ID_FORMAT'
            });
        }

        // ID重複チェック
        if (memory.id) {
            const existingMemory = this.getMemory(memory.id);
            if (existingMemory && existingMemory !== memory) {
                errors.push({
                    field: 'id',
                    message: `Duplicate ID: ${memory.id}`,
                    code: 'DUPLICATE_ID'
                });
            }
        }

        // タイプ検証
        if (!memory.type) {
            errors.push({
                field: 'type',
                message: 'Memory type is required',
                code: 'MISSING_TYPE'
            });
        } else if (!this.supportedTypes.includes(memory.type)) {
            errors.push({
                field: 'type',
                message: `Unsupported memory type: ${memory.type}`,
                code: 'UNSUPPORTED_TYPE'
            });
        }

        // 内容検証
        if (!memory.content || memory.content.trim() === '') {
            errors.push({
                field: 'content',
                message: 'Memory content is required',
                code: 'MISSING_CONTENT'
            });
        } else if (memory.content.length > this.validation.maxContentLength) {
            errors.push({
                field: 'content',
                message: `Content too long: ${memory.content.length} chars`,
                code: 'CONTENT_TOO_LONG'
            });
        }

        // 感情的価値検証
        if (memory.emotional_valence !== undefined) {
            const valence = parseFloat(memory.emotional_valence);
            if (isNaN(valence) || valence < 0 || valence > 1) {
                errors.push({
                    field: 'emotional_valence',
                    message: 'Emotional valence must be between 0 and 1',
                    code: 'INVALID_VALENCE'
                });
            }
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    // ==================== CRUD Operations ====================

    /**
     * 記憶を作成（addMemoryのエイリアス）
     * @param {Object} data - 記憶データ
     * @returns {string} 作成された記憶のID
     */
    create(data) {
        return this.addMemory(data);
    }

    /**
     * 記憶を読み取り（getMemoryのエイリアス）
     * @param {string} id - 記憶ID
     * @returns {Object|null} 記憶データ
     */
    read(id) {
        return this.getMemory(id);
    }

    /**
     * 記憶を更新（updateMemoryのエイリアス）
     * @param {string} id - 記憶ID
     * @param {Object} data - 更新データ
     */
    update(id, data) {
        this.updateMemory(id, data);
    }

    /**
     * 記憶を削除（removeMemoryのエイリアス）
     * @param {string} id - 記憶ID
     */
    delete(id) {
        this.removeMemory(id);
    }

    // ==================== 状態管理 ====================

    /**
     * モジュール状態を取得
     * @returns {Object} モジュール状態
     */
    getState() {
        return {
            memories: this.list(),
            stats: this.getStats(),
            supportedTypes: this.supportedTypes
        };
    }

    /**
     * モジュール状態を設定
     * @param {Object} state - 設定する状態
     */
    setState(state) {
        if (state.memories) {
            this.stateManager.setState('persona.memory_system.memories', state.memories);
        }
    }

    /**
     * 変更イベントを発行
     * @param {string} type - 変更タイプ
     * @param {Object} data - イベントデータ
     */
    emitChange(type, data) {
        this.eventBus.emit(`memory:${type}`, data);
    }

    // ==================== ユーティリティメソッド ====================

    /**
     * 記憶統計を取得
     * @returns {Object} 統計情報
     */
    getStats() {
        const memories = this.list();
        const stats = {
            total: memories.length,
            byType: {}
        };

        // タイプ別統計
        this.supportedTypes.forEach(type => {
            stats.byType[type] = memories.filter(m => m.type === type).length;
        });

        return stats;
    }

    /**
     * サポートされている記憶タイプを取得
     * @returns {Array} タイプ配列
     */
    getSupportedTypes() {
        return [...this.supportedTypes];
    }

    // ==================== 内部メソッド ====================

    /**
     * イベントハンドラーの設定
     */
    _setupEventHandlers() {
        // 関連性モジュールからの参照更新要求を監視
        this.eventBus.on('association:memory:reference:update', (data) => {
            const { oldId, newId } = data;
            this.updateReferences(oldId, newId);
        });

        // ペルソナデータの読み込み時の初期化
        this.eventBus.on('persona:loaded', () => {
            this._initializeMemorySystem();
        });

        this.log('Event handlers setup complete');
    }

    /**
     * 状態の初期化
     */
    _initializeState() {
        // メモリシステムの初期化
        const memorySystem = this.stateManager.getState('persona.memory_system');
        if (!memorySystem) {
            this.stateManager.setState('persona.memory_system', {
                memories: []
            });
        }
    }

    /**
     * 記憶システムの初期化
     */
    _initializeMemorySystem() {
        const memories = this.stateManager.getState('persona.memory_system.memories') || [];
        
        if (!Array.isArray(memories)) {
            this.stateManager.setState('persona.memory_system.memories', []);
            return;
        }

        this._validateExistingMemories();
    }

    /**
     * 既存記憶の検証と修正
     */
    _validateExistingMemories() {
        const memories = this.list();
        const seenIds = new Set();
        const fixedMemories = [];
        let needsUpdate = false;

        memories.forEach(memory => {
            let fixedMemory = { ...memory };

            // ID修正
            if (!this.validateId(memory.id) || seenIds.has(memory.id)) {
                const newId = this.generateUniqueId();
                fixedMemory.id = newId;
                needsUpdate = true;
                this.log('Memory ID fixed', { oldId: memory.id, newId });
            }

            seenIds.add(fixedMemory.id);
            fixedMemories.push(fixedMemory);
        });

        if (needsUpdate) {
            this.stateManager.setState('persona.memory_system.memories', fixedMemories);
            this.eventBus.emit('memory:validation:completed', { fixedCount: needsUpdate });
        }
    }

    /**
     * ログ出力
     */
    log(message, data = null) {
        if (data !== null) {
            console.debug(`MemoryModule: ${message}`, data);
        } else {
            console.debug(`MemoryModule: ${message}`);
        }
    }
}

// ES6モジュールとしてエクスポート
export { MemoryModule };