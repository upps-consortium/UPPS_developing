/**
 * AssociationModule.js - UPPS新アーキテクチャ 関連性システムモジュール
 * 
 * 記憶と感情の関連性ネットワークを管理するドメインモジュール
 * インターフェース定義書準拠実装
 */

class AssociationModule {
    constructor() {
        this.name = 'AssociationModule';
        this.dependencies = ['MemoryModule']; // 記憶モジュールとの連携
        
        // サポートされるタイプの定義
        this.supportedTriggerTypes = ['memory', 'emotion', 'external', 'complex'];
        this.supportedResponseTypes = ['memory', 'emotion'];
        this.supportedOperators = ['AND', 'OR'];
        this.supportedExternalCategories = ['topics', 'environment', 'keywords'];
        
        // バリデーション設定
        this.validation = {
            maxAssociationStrength: 100,
            minAssociationStrength: 0,
            maxThreshold: 100,
            minThreshold: 0,
            maxConditions: 10
        };
        
        // モジュール状態
        this.eventBus = null;
        this.stateManager = null;
        this.isInitialized = false;
        
        this.log('AssociationModule created');
    }

    /**
     * モジュールの初期化
     * @param {EventBus} eventBus - イベントバス
     * @param {StateManager} stateManager - 状態管理
     */
    async initialize(eventBus, stateManager) {
        if (this.isInitialized) {
            this.log('AssociationModule already initialized');
            return;
        }

        this.eventBus = eventBus;
        this.stateManager = stateManager;

        // イベントハンドラーの設定
        this._setupEventHandlers();

        // 状態の初期化
        this._initializeState();

        this.isInitialized = true;
        this.log('AssociationModule initialized successfully');
        
        this.eventBus.emit('association:module:initialized');
    }

    /**
     * モジュールの開始
     */
    async start() {
        if (!this.isInitialized) {
            throw new Error('AssociationModule must be initialized before starting');
        }

        // 既存データの検証と修正
        this._validateExistingAssociations();

        this.log('AssociationModule started successfully');
        this.eventBus.emit('association:module:started');
    }

    /**
     * モジュールの停止
     */
    async stop() {
        this.log('AssociationModule stopped');
        this.eventBus.emit('association:module:stopped');
    }

    /**
     * モジュールの破棄
     */
    async destroy() {
        this.eventBus = null;
        this.stateManager = null;
        this.isInitialized = false;
        
        this.log('AssociationModule destroyed');
    }

    // ==================== 関連性操作メソッド ====================

    /**
     * 新しい関連性を追加
     * @param {Object} association - 関連性データ
     * @returns {string} 追加された関連性のID
     */
    addAssociation(association) {
        const validationResult = this.validate(association);
        if (!validationResult.valid) {
            const errors = validationResult.errors.map(e => e.message).join(', ');
            throw new Error(`Association validation failed: ${errors}`);
        }

        // 一意なIDの生成
        const associationId = association.id || this.generateUniqueId();
        
        // 関連性データの構築
        const newAssociation = {
            id: associationId,
            trigger: this._normalizeTrigger(association.trigger),
            response: this._normalizeResponse(association.response),
            metadata: association.metadata || {},
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        // 状態への追加
        const currentAssociations = this.stateManager.getState('persona.association_system.associations') || [];
        const updatedAssociations = [...currentAssociations, newAssociation];
        
        this.stateManager.setState('persona.association_system.associations', updatedAssociations);

        this.log('Association added', { associationId, triggerType: newAssociation.trigger.type });
        this.eventBus.emit('association:added', { association: newAssociation });

        return associationId;
    }

    /**
     * 関連性を更新
     * @param {string} id - 関連性ID
     * @param {Object} updates - 更新内容
     */
    updateAssociation(id, updates) {
        const currentAssociations = this.stateManager.getState('persona.association_system.associations') || [];
        const associationIndex = currentAssociations.findIndex(a => a.id === id);
        
        if (associationIndex === -1) {
            throw new Error(`Association not found: ${id}`);
        }

        // 更新データの検証
        const updatedAssociation = { ...currentAssociations[associationIndex], ...updates };
        updatedAssociation.updated_at = new Date().toISOString();
        
        const validationResult = this.validate(updatedAssociation);
        if (!validationResult.valid) {
            const errors = validationResult.errors.map(e => e.message).join(', ');
            throw new Error(`Association validation failed: ${errors}`);
        }

        // 状態の更新
        const updatedAssociations = [...currentAssociations];
        updatedAssociations[associationIndex] = updatedAssociation;
        
        this.stateManager.setState('persona.association_system.associations', updatedAssociations);

        this.log('Association updated', { id, updates });
        this.eventBus.emit('association:updated', { id, association: updatedAssociation });
    }

    /**
     * 関連性を削除
     * @param {string} id - 関連性ID
     */
    removeAssociation(id) {
        const currentAssociations = this.stateManager.getState('persona.association_system.associations') || [];
        const associationIndex = currentAssociations.findIndex(a => a.id === id);
        
        if (associationIndex === -1) {
            throw new Error(`Association not found: ${id}`);
        }

        const association = currentAssociations[associationIndex];

        // 削除前イベント
        this.eventBus.emit('association:before:remove', { id, association });

        // 状態から削除
        const updatedAssociations = currentAssociations.filter(a => a.id !== id);
        this.stateManager.setState('persona.association_system.associations', updatedAssociations);

        this.log('Association removed', { id });
        this.eventBus.emit('association:removed', { id, association });
    }

    /**
     * IDで関連性を取得
     * @param {string} id - 関連性ID
     * @returns {Object|null} 関連性データまたはnull
     */
    getAssociation(id) {
        const associations = this.stateManager.getState('persona.association_system.associations') || [];
        return associations.find(a => a.id === id) || null;
    }

    // ==================== 複合条件管理 ====================

    /**
     * 複合条件を追加
     * @param {string} assocId - 関連性ID
     * @param {Object} condition - 条件データ
     */
    addComplexCondition(assocId, condition) {
        const association = this.getAssociation(assocId);
        if (!association) {
            throw new Error(`Association not found: ${assocId}`);
        }

        if (association.trigger.type !== 'complex') {
            throw new Error(`Association ${assocId} is not a complex trigger type`);
        }

        // 条件数制限チェック
        const currentConditions = association.trigger.conditions || [];
        if (currentConditions.length >= this.validation.maxConditions) {
            throw new Error(`Maximum conditions (${this.validation.maxConditions}) reached`);
        }

        // 条件の正規化
        const normalizedCondition = this._normalizeCondition(condition);

        // 複合条件に追加
        const updatedConditions = [...currentConditions, normalizedCondition];
        
        this.updateAssociation(assocId, {
            trigger: {
                ...association.trigger,
                conditions: updatedConditions
            }
        });

        this.log('Complex condition added', { assocId, condition: normalizedCondition });
        this.eventBus.emit('association:condition:added', { assocId, condition: normalizedCondition });
    }

    /**
     * 複合条件を削除
     * @param {string} assocId - 関連性ID
     * @param {number} conditionIndex - 条件のインデックス
     */
    removeComplexCondition(assocId, conditionIndex) {
        const association = this.getAssociation(assocId);
        if (!association) {
            throw new Error(`Association not found: ${assocId}`);
        }

        if (association.trigger.type !== 'complex') {
            throw new Error(`Association ${assocId} is not a complex trigger type`);
        }

        const currentConditions = association.trigger.conditions || [];
        if (conditionIndex < 0 || conditionIndex >= currentConditions.length) {
            throw new Error(`Invalid condition index: ${conditionIndex}`);
        }

        // 最低1つの条件は必要
        if (currentConditions.length <= 1) {
            throw new Error('Complex trigger must have at least one condition');
        }

        const removedCondition = currentConditions[conditionIndex];
        const updatedConditions = currentConditions.filter((_, index) => index !== conditionIndex);
        
        this.updateAssociation(assocId, {
            trigger: {
                ...association.trigger,
                conditions: updatedConditions
            }
        });

        this.log('Complex condition removed', { assocId, conditionIndex });
        this.eventBus.emit('association:condition:removed', { assocId, conditionIndex, condition: removedCondition });
    }

    /**
     * 複合条件を更新
     * @param {string} assocId - 関連性ID
     * @param {number} conditionIndex - 条件のインデックス
     * @param {Object} updates - 更新内容
     */
    updateComplexCondition(assocId, conditionIndex, updates) {
        const association = this.getAssociation(assocId);
        if (!association) {
            throw new Error(`Association not found: ${assocId}`);
        }

        if (association.trigger.type !== 'complex') {
            throw new Error(`Association ${assocId} is not a complex trigger type`);
        }

        const currentConditions = association.trigger.conditions || [];
        if (conditionIndex < 0 || conditionIndex >= currentConditions.length) {
            throw new Error(`Invalid condition index: ${conditionIndex}`);
        }

        // 条件の更新
        const updatedConditions = [...currentConditions];
        updatedConditions[conditionIndex] = { ...updatedConditions[conditionIndex], ...updates };
        
        this.updateAssociation(assocId, {
            trigger: {
                ...association.trigger,
                conditions: updatedConditions
            }
        });

        this.log('Complex condition updated', { assocId, conditionIndex, updates });
        this.eventBus.emit('association:condition:updated', { assocId, conditionIndex, updates });
    }

    // ==================== 外部トリガー管理 ====================

    /**
     * 外部トリガーのアイテムを更新
     * @param {string} assocId - 関連性ID
     * @param {Array} items - アイテム配列
     */
    updateExternalItems(assocId, items) {
        const association = this.getAssociation(assocId);
        if (!association) {
            throw new Error(`Association not found: ${assocId}`);
        }

        if (association.trigger.type !== 'external') {
            throw new Error(`Association ${assocId} is not an external trigger type`);
        }

        // アイテムの正規化
        const normalizedItems = items.filter(item => item && item.trim()).map(item => item.trim());

        this.updateAssociation(assocId, {
            trigger: {
                ...association.trigger,
                items: normalizedItems
            }
        });

        this.log('External items updated', { assocId, items: normalizedItems });
        this.eventBus.emit('association:external:items:updated', { assocId, items: normalizedItems });
    }

    /**
     * 外部トリガーのアイテムを取得
     * @param {string} assocId - 関連性ID
     * @returns {Array} アイテム配列
     */
    getExternalItems(assocId) {
        const association = this.getAssociation(assocId);
        if (!association || association.trigger.type !== 'external') {
            return [];
        }

        return association.trigger.items || [];
    }

    // ==================== 検索・分析 ====================

    /**
     * トリガーで関連性を検索
     * @param {Object} trigger - トリガー条件
     * @returns {Array} マッチする関連性の配列
     */
    findAssociationsByTrigger(trigger) {
        const associations = this.list();
        
        return associations.filter(assoc => {
            return this._matchesTrigger(assoc.trigger, trigger);
        });
    }

    /**
     * レスポンスで関連性を検索
     * @param {Object} response - レスポンス条件
     * @returns {Array} マッチする関連性の配列
     */
    findAssociationsByResponse(response) {
        const associations = this.list();
        
        return associations.filter(assoc => {
            return this._matchesResponse(assoc.response, response);
        });
    }

    /**
     * ネットワーク分析を実行
     * @returns {Object} 分析結果
     */
    analyzeNetwork() {
        const associations = this.list();
        const memories = this.stateManager.getState('persona.memory_system.memories') || [];
        const emotions = this.stateManager.getState('persona.emotion_system.emotions') || {};

        const analysis = {
            totalAssociations: associations.length,
            triggerTypeDistribution: {},
            responseTypeDistribution: {},
            strengthDistribution: { high: 0, medium: 0, low: 0 },
            memoryConnections: {},
            emotionConnections: {},
            complexityScore: 0
        };

        // トリガータイプ分布
        this.supportedTriggerTypes.forEach(type => {
            analysis.triggerTypeDistribution[type] = associations.filter(a => a.trigger.type === type).length;
        });

        // レスポンスタイプ分布
        this.supportedResponseTypes.forEach(type => {
            analysis.responseTypeDistribution[type] = associations.filter(a => a.response.type === type).length;
        });

        // 強度分布
        associations.forEach(assoc => {
            const strength = assoc.response.association_strength || 0;
            if (strength >= 70) analysis.strengthDistribution.high++;
            else if (strength >= 30) analysis.strengthDistribution.medium++;
            else analysis.strengthDistribution.low++;
        });

        // 記憶接続数
        memories.forEach(memory => {
            const connections = associations.filter(assoc => 
                (assoc.trigger.type === 'memory' && assoc.trigger.id === memory.id) ||
                (assoc.response.type === 'memory' && assoc.response.id === memory.id) ||
                (assoc.trigger.type === 'complex' && assoc.trigger.conditions?.some(c => 
                    c.type === 'memory' && c.id === memory.id))
            ).length;
            
            analysis.memoryConnections[memory.id] = connections;
        });

        // 感情接続数
        Object.keys(emotions).forEach(emotionId => {
            const connections = associations.filter(assoc => 
                (assoc.trigger.type === 'emotion' && assoc.trigger.id === emotionId) ||
                (assoc.response.type === 'emotion' && assoc.response.id === emotionId) ||
                (assoc.trigger.type === 'complex' && assoc.trigger.conditions?.some(c => 
                    c.type === 'emotion' && c.id === emotionId))
            ).length;
            
            analysis.emotionConnections[emotionId] = connections;
        });

        // 複雑度スコア（複合条件の数 + 外部トリガーの数）
        analysis.complexityScore = associations.reduce((score, assoc) => {
            if (assoc.trigger.type === 'complex') {
                score += (assoc.trigger.conditions?.length || 0);
            }
            if (assoc.trigger.type === 'external') {
                score += (assoc.trigger.items?.length || 0);
            }
            return score;
        }, 0);

        return analysis;
    }

    // ==================== CRUD Operations ====================

    /**
     * 関連性を作成（addAssociationのエイリアス）
     * @param {Object} data - 関連性データ
     * @returns {string} 作成された関連性のID
     */
    create(data) {
        return this.addAssociation(data);
    }

    /**
     * 関連性を読み取り（getAssociationのエイリアス）
     * @param {string} id - 関連性ID
     * @returns {Object|null} 関連性データ
     */
    read(id) {
        return this.getAssociation(id);
    }

    /**
     * 関連性を更新（updateAssociationのエイリアス）
     * @param {string} id - 関連性ID
     * @param {Object} data - 更新データ
     */
    update(id, data) {
        this.updateAssociation(id, data);
    }

    /**
     * 関連性を削除（removeAssociationのエイリアス）
     * @param {string} id - 関連性ID
     */
    delete(id) {
        this.removeAssociation(id);
    }

    /**
     * 全関連性を取得
     * @returns {Array} 関連性データの配列
     */
    list() {
        return this.stateManager.getState('persona.association_system.associations') || [];
    }

    // ==================== バリデーション ====================

    /**
     * 関連性データのバリデーション
     * @param {Object} association - 関連性データ
     * @returns {Object} バリデーション結果
     */
    validate(association) {
        const errors = [];

        // ID検証
        if (association.id && !this._validateId(association.id)) {
            errors.push({
                field: 'id',
                message: `Invalid ID format: ${association.id}`,
                code: 'INVALID_ID_FORMAT'
            });
        }

        // トリガー検証
        if (!association.trigger) {
            errors.push({
                field: 'trigger',
                message: 'Trigger is required',
                code: 'MISSING_TRIGGER'
            });
        } else {
            const triggerErrors = this._validateTrigger(association.trigger);
            errors.push(...triggerErrors);
        }

        // レスポンス検証
        if (!association.response) {
            errors.push({
                field: 'response',
                message: 'Response is required',
                code: 'MISSING_RESPONSE'
            });
        } else {
            const responseErrors = this._validateResponse(association.response);
            errors.push(...responseErrors);
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    // ==================== 状態管理 ====================

    /**
     * モジュール状態を取得
     * @returns {Object} モジュール状態
     */
    getState() {
        return {
            associations: this.list(),
            stats: this.getStats(),
            analysis: this.analyzeNetwork()
        };
    }

    /**
     * モジュール状態を設定
     * @param {Object} state - 設定する状態
     */
    setState(state) {
        if (state.associations) {
            this.stateManager.setState('persona.association_system.associations', state.associations);
        }
    }

    /**
     * 変更イベントを発行
     * @param {string} type - 変更タイプ
     * @param {Object} data - イベントデータ
     */
    emitChange(type, data) {
        this.eventBus.emit(`association:${type}`, data);
    }

    /**
     * 一意なIDを生成
     * @returns {string} 一意なID
     */
    generateUniqueId() {
        const existingAssociations = this.list();
        const existingIds = new Set(existingAssociations.map(a => a.id));
        
        let counter = 1;
        let candidateId;
        
        do {
            candidateId = `assoc_${counter}`;
            counter++;
        } while (existingIds.has(candidateId));
        
        return candidateId;
    }

    /**
     * 統計情報を取得
     * @returns {Object} 統計情報
     */
    getStats() {
        const associations = this.list();
        const stats = {
            total: associations.length,
            byTriggerType: {},
            byResponseType: {},
            byStrength: { high: 0, medium: 0, low: 0 }
        };

        // トリガータイプ別統計
        this.supportedTriggerTypes.forEach(type => {
            stats.byTriggerType[type] = associations.filter(a => a.trigger.type === type).length;
        });

        // レスポンスタイプ別統計
        this.supportedResponseTypes.forEach(type => {
            stats.byResponseType[type] = associations.filter(a => a.response.type === type).length;
        });

        // 強度別統計
        associations.forEach(assoc => {
            const strength = assoc.response.association_strength || 0;
            if (strength >= 70) stats.byStrength.high++;
            else if (strength >= 30) stats.byStrength.medium++;
            else stats.byStrength.low++;
        });

        return stats;
    }

    // ==================== 内部メソッド ====================

    /**
     * イベントハンドラーの設定
     */
    _setupEventHandlers() {
        // 記憶モジュールからの削除通知を監視
        this.eventBus.on('memory:before:remove', (data) => {
            this._removeMemoryReferences(data.id);
        });

        // 記憶ID変更通知を監視
        this.eventBus.on('memory:id:changed', (data) => {
            this._updateMemoryReferences(data.oldId, data.newId);
        });

        // ペルソナデータの読み込み時の初期化
        this.eventBus.on('persona:loaded', () => {
            this._initializeAssociationSystem();
        });

        this.log('Event handlers setup complete');
    }

    /**
     * 状態の初期化
     */
    _initializeState() {
        const associationSystem = this.stateManager.getState('persona.association_system');
        if (!associationSystem) {
            this.stateManager.setState('persona.association_system', {
                associations: []
            });
        }
    }

    /**
     * 関連性システムの初期化
     */
    _initializeAssociationSystem() {
        const associations = this.stateManager.getState('persona.association_system.associations') || [];
        
        if (!Array.isArray(associations)) {
            this.stateManager.setState('persona.association_system.associations', []);
            return;
        }

        this._validateExistingAssociations();
    }

    /**
     * 既存関連性の検証と修正
     */
    _validateExistingAssociations() {
        const associations = this.list();
        const seenIds = new Set();
        const fixedAssociations = [];
        let needsUpdate = false;

        associations.forEach(assoc => {
            let fixedAssociation = { ...assoc };

            // ID修正
            if (!this._validateId(assoc.id) || seenIds.has(assoc.id)) {
                const newId = this.generateUniqueId();
                fixedAssociation.id = newId;
                needsUpdate = true;
                this.log('Association ID fixed', { oldId: assoc.id, newId });
            }

            seenIds.add(fixedAssociation.id);
            fixedAssociations.push(fixedAssociation);
        });

        if (needsUpdate) {
            this.stateManager.setState('persona.association_system.associations', fixedAssociations);
            this.eventBus.emit('association:validation:completed', { fixedCount: needsUpdate });
        }
    }

    /**
     * 記憶参照の削除
     * @param {string} memoryId - 削除される記憶ID
     */
    _removeMemoryReferences(memoryId) {
        const associations = this.list();
        const toRemove = [];

        associations.forEach((assoc, index) => {
            const hasMemoryReference = 
                (assoc.trigger.type === 'memory' && assoc.trigger.id === memoryId) ||
                (assoc.response.type === 'memory' && assoc.response.id === memoryId) ||
                (assoc.trigger.type === 'complex' && assoc.trigger.conditions?.some(c => 
                    c.type === 'memory' && c.id === memoryId));

            if (hasMemoryReference) {
                toRemove.push(assoc.id);
            }
        });

        // 関連する関連性を削除
        toRemove.forEach(id => {
            this.removeAssociation(id);
        });

        if (toRemove.length > 0) {
            this.log('Memory references removed', { memoryId, removedCount: toRemove.length });
        }
    }

    /**
     * 記憶参照の更新
     * @param {string} oldId - 古いID
     * @param {string} newId - 新しいID
     */
    _updateMemoryReferences(oldId, newId) {
        const associations = this.list();
        let updateCount = 0;

        associations.forEach(assoc => {
            let needsUpdate = false;
            const updatedAssoc = { ...assoc };

            // トリガー側の更新
            if (assoc.trigger.type === 'memory' && assoc.trigger.id === oldId) {
                updatedAssoc.trigger = { ...assoc.trigger, id: newId };
                needsUpdate = true;
            }

            // レスポンス側の更新
            if (assoc.response.type === 'memory' && assoc.response.id === oldId) {
                updatedAssoc.response = { ...assoc.response, id: newId };
                needsUpdate = true;
            }

            // 複合条件内の更新
            if (assoc.trigger.type === 'complex' && assoc.trigger.conditions) {
                const updatedConditions = assoc.trigger.conditions.map(cond => {
                    if (cond.type === 'memory' && cond.id === oldId) {
                        needsUpdate = true;
                        return { ...cond, id: newId };
                    }
                    return cond;
                });

                if (needsUpdate) {
                    updatedAssoc.trigger = { ...assoc.trigger, conditions: updatedConditions };
                }
            }

            if (needsUpdate) {
                this.updateAssociation(assoc.id, updatedAssoc);
                updateCount++;
            }
        });

        if (updateCount > 0) {
            this.log('Memory references updated', { oldId, newId, updateCount });
        }
    }

    /**
     * トリガーの正規化
     * @param {Object} trigger - トリガーデータ
     * @returns {Object} 正規化されたトリガー
     */
    _normalizeTrigger(trigger) {
        const normalized = { type: trigger.type };

        switch (trigger.type) {
            case 'memory':
                normalized.id = trigger.id;
                break;
            case 'emotion':
                normalized.id = trigger.id;
                normalized.threshold = trigger.threshold || 50;
                break;
            case 'external':
                normalized.category = trigger.category || 'topics';
                normalized.items = trigger.items || [];
                break;
            case 'complex':
                normalized.operator = trigger.operator || 'AND';
                normalized.conditions = (trigger.conditions || []).map(c => this._normalizeCondition(c));
                break;
        }

        return normalized;
    }

    /**
     * レスポンスの正規化
     * @param {Object} response - レスポンスデータ
     * @returns {Object} 正規化されたレスポンス
     */
    _normalizeResponse(response) {
        return {
            type: response.type,
            id: response.id,
            association_strength: response.association_strength || 50
        };
    }

    /**
     * 条件の正規化
     * @param {Object} condition - 条件データ
     * @returns {Object} 正規化された条件
     */
    _normalizeCondition(condition) {
        const normalized = { type: condition.type };

        switch (condition.type) {
            case 'memory':
                normalized.id = condition.id;
                break;
            case 'emotion':
                normalized.id = condition.id;
                normalized.threshold = condition.threshold || 50;
                break;
            case 'external':
                normalized.category = condition.category || 'topics';
                normalized.items = condition.items || [];
                break;
        }

        return normalized;
    }

    /**
     * IDの妥当性検証
     * @param {string} id - ID
     * @returns {boolean} 妥当かどうか
     */
    _validateId(id) {
        return typeof id === 'string' && id.length > 0 && id.length <= 50;
    }

    /**
     * トリガーのバリデーション
     * @param {Object} trigger - トリガーデータ
     * @returns {Array} エラー配列
     */
    _validateTrigger(trigger) {
        const errors = [];

        if (!this.supportedTriggerTypes.includes(trigger.type)) {
            errors.push({
                field: 'trigger.type',
                message: `Unsupported trigger type: ${trigger.type}`,
                code: 'UNSUPPORTED_TRIGGER_TYPE'
            });
        }

        // タイプ別の詳細検証は省略（実装時に追加）

        return errors;
    }

    /**
     * レスポンスのバリデーション
     * @param {Object} response - レスポンスデータ
     * @returns {Array} エラー配列
     */
    _validateResponse(response) {
        const errors = [];

        if (!this.supportedResponseTypes.includes(response.type)) {
            errors.push({
                field: 'response.type',
                message: `Unsupported response type: ${response.type}`,
                code: 'UNSUPPORTED_RESPONSE_TYPE'
            });
        }

        // 強度のバリデーション
        const strength = response.association_strength;
        if (strength < this.validation.minAssociationStrength || strength > this.validation.maxAssociationStrength) {
            errors.push({
                field: 'response.association_strength',
                message: `Association strength must be between ${this.validation.minAssociationStrength} and ${this.validation.maxAssociationStrength}`,
                code: 'INVALID_ASSOCIATION_STRENGTH'
            });
        }

        return errors;
    }

    /**
     * トリガーマッチング
     * @param {Object} trigger1 - トリガー1
     * @param {Object} trigger2 - トリガー2
     * @returns {boolean} マッチするかどうか
     */
    _matchesTrigger(trigger1, trigger2) {
        if (trigger1.type !== trigger2.type) return false;

        switch (trigger1.type) {
            case 'memory':
            case 'emotion':
                return trigger1.id === trigger2.id;
            case 'external':
                return trigger1.category === trigger2.category;
            case 'complex':
                return trigger1.operator === trigger2.operator;
            default:
                return false;
        }
    }

    /**
     * レスポンスマッチング
     * @param {Object} response1 - レスポンス1
     * @param {Object} response2 - レスポンス2
     * @returns {boolean} マッチするかどうか
     */
    _matchesResponse(response1, response2) {
        return response1.type === response2.type && response1.id === response2.id;
    }

    /**
     * ログ出力
     */
    log(message, data = null) {
        if (data !== null) {
            console.debug(`AssociationModule: ${message}`, data);
        } else {
            console.debug(`AssociationModule: ${message}`);
        }
    }
}

// ES6モジュールとしてエクスポート
export { AssociationModule };