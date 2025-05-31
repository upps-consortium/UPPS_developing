/**
 * EmotionModule.js - UPPS新アーキテクチャ 感情システムモジュール
 * 
 * 感情モデル管理、ベースライン設定、状態同期を提供
 * 既存emotion_system.jsの機能を新アーキテクチャで再実装
 */

class EmotionModule {
    constructor() {
        // DomainModule基本プロパティ
        this.name = 'emotion';
        this.dependencies = [];
        
        // 感情システム設定
        this.supportedModels = ['Ekman', 'Plutchik', 'PAD', 'Custom'];
        this.currentModel = 'Ekman';
        
        // システム参照
        this.eventBus = null;
        this.stateManager = null;
        
        // 内部状態
        this.initialized = false;
        this.emotionData = null;
        
        // 既存システムとの互換性用
        this.legacyMode = false;
        
        this.log('EmotionModule created');
    }

    /**
     * モジュール初期化
     * @param {EventBus} eventBus - イベントバス
     * @param {StateManager} stateManager - 状態管理
     */
    async initialize(eventBus, stateManager) {
        if (this.initialized) {
            this.log('EmotionModule already initialized');
            return;
        }

        this.eventBus = eventBus;
        this.stateManager = stateManager;

        try {
            // 状態管理の初期化
            this._initializeState();
            
            // イベントハンドリングの設定
            this._setupEventHandlers();
            
            // 既存システムとの互換性チェック
            this._checkLegacyCompatibility();
            
            this.initialized = true;
            this.log('EmotionModule initialized successfully');
            this.eventBus.emit('emotion:initialized');
            
        } catch (error) {
            this.log(`EmotionModule initialization failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * モジュール開始
     */
    async start() {
        if (!this.initialized) {
            throw new Error('EmotionModule must be initialized before starting');
        }

        // 現在のペルソナデータから感情システムを読み込み
        const personaData = this.stateManager.getState('app.persona');
        if (personaData) {
            await this._loadEmotionSystem(personaData);
        }

        this.log('EmotionModule started');
        this.eventBus.emit('emotion:started');
    }

    /**
     * モジュール停止
     */
    async stop() {
        this.log('EmotionModule stopped');
        this.eventBus.emit('emotion:stopped');
    }

    /**
     * モジュール破棄
     */
    async destroy() {
        this.initialized = false;
        this.emotionData = null;
        this.log('EmotionModule destroyed');
        this.eventBus.emit('emotion:destroyed');
    }

    // ==================== 感情モデル管理 ====================

    /**
     * 感情モデルを初期化
     * @param {Object} model - 感情モデル
     */
    initializeModel(model) {
        if (!model || !model.type) {
            throw new Error('Invalid emotion model');
        }

        if (!this.supportedModels.includes(model.type)) {
            this.log(`Unsupported model type: ${model.type}, using Ekman`);
            model.type = 'Ekman';
        }

        this.currentModel = model.type;
        this.emotionData = model;

        // 状態を更新
        this.stateManager.setState('app.persona.emotion_system', {
            model: model.type,
            emotions: model.emotions
        });

        this.log(`Emotion model initialized: ${model.type}`);
        this.eventBus.emit('emotion:model:changed', { model: model.type });
    }

    /**
     * 現在の感情モデルを取得
     * @returns {Object} 感情モデル
     */
    getModel() {
        if (!this.emotionData) {
            return this._createDefaultModel();
        }
        return { ...this.emotionData };
    }

    /**
     * 感情モデルを切り替え
     * @param {string} modelType - モデルタイプ
     */
    switchModel(modelType) {
        if (!this.supportedModels.includes(modelType)) {
            throw new Error(`Unsupported model type: ${modelType}`);
        }

        const newModel = this._createModelByType(modelType);
        this.initializeModel(newModel);
        
        this.log(`Switched to emotion model: ${modelType}`);
    }

    // ==================== 感情操作 ====================

    /**
     * ベースライン値を設定
     * @param {string} emotionId - 感情ID
     * @param {number} value - ベースライン値（0-100）
     */
    setBaseline(emotionId, value) {
        if (!this._validateEmotionId(emotionId)) {
            throw new Error(`Invalid emotion ID: ${emotionId}`);
        }

        const clampedValue = Math.max(0, Math.min(100, value));
        
        if (!this.emotionData.emotions[emotionId]) {
            this.emotionData.emotions[emotionId] = {};
        }
        
        this.emotionData.emotions[emotionId].baseline = clampedValue;
        
        // 状態を更新
        this.stateManager.setState(
            `app.persona.emotion_system.emotions.${emotionId}.baseline`, 
            clampedValue
        );

        this.log(`Baseline set for ${emotionId}: ${clampedValue}`);
        this.eventBus.emit('emotion:baseline:changed', { 
            emotionId, 
            value: clampedValue 
        });
    }

    /**
     * ベースライン値を取得
     * @param {string} emotionId - 感情ID
     * @returns {number} ベースライン値
     */
    getBaseline(emotionId) {
        if (!this._validateEmotionId(emotionId)) {
            return 50; // デフォルト値
        }

        return this.emotionData.emotions[emotionId]?.baseline || 50;
    }

    /**
     * 現在の感情状態を更新
     * @param {string} emotionId - 感情ID
     * @param {number} value - 現在値（0-100）
     */
    updateCurrentState(emotionId, value) {
        if (!this._validateEmotionId(emotionId)) {
            throw new Error(`Invalid emotion ID: ${emotionId}`);
        }

        const clampedValue = Math.max(0, Math.min(100, value));
        
        // 状態を更新
        this.stateManager.setState(
            `app.persona.current_emotion_state.${emotionId}`, 
            clampedValue
        );

        this.log(`Current state updated for ${emotionId}: ${clampedValue}`);
        this.eventBus.emit('emotion:state:changed', { 
            emotionId, 
            value: clampedValue 
        });
    }

    /**
     * 現在の感情状態を取得
     * @param {string} emotionId - 感情ID
     * @returns {number} 現在値
     */
    getCurrentState(emotionId) {
        if (!this._validateEmotionId(emotionId)) {
            return 50; // デフォルト値
        }

        const currentState = this.stateManager.getState('app.persona.current_emotion_state');
        return currentState?.[emotionId] || this.getBaseline(emotionId);
    }

    // ==================== 同期機能 ====================

    /**
     * ベースラインから現在状態を同期
     */
    syncStateFromBaseline() {
        if (!this.emotionData?.emotions) {
            this.log('Cannot sync: no emotion data');
            return;
        }

        const newState = {};
        
        for (const [emotionId, data] of Object.entries(this.emotionData.emotions)) {
            // ベースライン ± 20% の範囲でランダム値を生成
            const baseline = data.baseline || 50;
            const variance = 20;
            const min = Math.max(0, baseline - variance);
            const max = Math.min(100, baseline + variance);
            
            newState[emotionId] = Math.floor(Math.random() * (max - min + 1)) + min;
        }

        // 状態を一括更新
        this.stateManager.setState('app.persona.current_emotion_state', newState);

        this.log('Emotion state synced from baseline');
        this.eventBus.emit('emotion:synced', { state: newState });
    }

    /**
     * ベースラインにリセット
     * @param {string} emotionId - 感情ID（省略時は全て）
     */
    resetToBaseline(emotionId = null) {
        if (emotionId) {
            // 個別リセット
            const baseline = this.getBaseline(emotionId);
            this.updateCurrentState(emotionId, baseline);
        } else {
            // 全体リセット
            if (!this.emotionData?.emotions) return;
            
            const resetState = {};
            for (const [id, data] of Object.entries(this.emotionData.emotions)) {
                resetState[id] = data.baseline || 50;
            }
            
            this.stateManager.setState('app.persona.current_emotion_state', resetState);
            this.eventBus.emit('emotion:reset', { state: resetState });
        }

        this.log(`Reset to baseline: ${emotionId || 'all emotions'}`);
    }

    // ==================== データ操作（BaseDomainModule準拠） ====================

    /**
     * 感情データを作成
     * @param {Object} data - 感情データ
     * @returns {Promise<string>} 感情ID
     */
    async create(data) {
        // 新しい感情をシステムに追加
        const emotionId = data.id || this._generateEmotionId();
        
        this.emotionData.emotions[emotionId] = {
            baseline: data.baseline || 50,
            description: data.description || '',
            category: data.category
        };

        this.stateManager.setState(
            `app.persona.emotion_system.emotions.${emotionId}`, 
            this.emotionData.emotions[emotionId]
        );

        this.eventBus.emit('emotion:created', { emotionId, data });
        return emotionId;
    }

    /**
     * 感情データを読み取り
     * @param {string} id - 感情ID
     * @returns {Promise<Object>} 感情データ
     */
    async read(id) {
        return this.emotionData?.emotions?.[id] || null;
    }

    /**
     * 感情データを更新
     * @param {string} id - 感情ID
     * @param {Object} data - 更新データ
     */
    async update(id, data) {
        if (!this.emotionData?.emotions?.[id]) {
            throw new Error(`Emotion not found: ${id}`);
        }

        Object.assign(this.emotionData.emotions[id], data);
        
        this.stateManager.setState(
            `app.persona.emotion_system.emotions.${id}`, 
            this.emotionData.emotions[id]
        );

        this.eventBus.emit('emotion:updated', { emotionId: id, data });
    }

    /**
     * 感情データを削除
     * @param {string} id - 感情ID
     */
    async delete(id) {
        if (!this.emotionData?.emotions?.[id]) {
            return; // 存在しない場合は何もしない
        }

        delete this.emotionData.emotions[id];
        this.stateManager.deleteState(`app.persona.emotion_system.emotions.${id}`);
        this.stateManager.deleteState(`app.persona.current_emotion_state.${id}`);

        this.eventBus.emit('emotion:deleted', { emotionId: id });
    }

    /**
     * 全感情データを取得
     * @returns {Promise<Array>} 感情データ配列
     */
    async list() {
        if (!this.emotionData?.emotions) return [];
        
        return Object.entries(this.emotionData.emotions).map(([id, data]) => ({
            id,
            ...data
        }));
    }

    // ==================== バリデーション ====================

    /**
     * 感情データをバリデーション
     * @param {Object} data - バリデーション対象データ
     * @returns {Object} バリデーション結果
     */
    validate(data) {
        const errors = [];

        if (!data) {
            errors.push({ field: 'data', message: 'データが指定されていません', code: 'REQUIRED' });
            return { valid: false, errors };
        }

        // モデルタイプの検証
        if (data.model && !this.supportedModels.includes(data.model)) {
            errors.push({ 
                field: 'model', 
                message: `サポートされていないモデルです: ${data.model}`, 
                code: 'INVALID_MODEL' 
            });
        }

        // Ekmanモデルの場合の詳細検証
        if (data.model === 'Ekman' && data.emotions) {
            const requiredEmotions = ['joy', 'sadness', 'anger', 'fear', 'disgust', 'surprise'];
            
            for (const emotion of requiredEmotions) {
                if (!data.emotions[emotion]) {
                    errors.push({ 
                        field: `emotions.${emotion}`, 
                        message: `必須感情が不足: ${emotion}`, 
                        code: 'MISSING_EMOTION' 
                    });
                } else {
                    const baseline = data.emotions[emotion].baseline;
                    if (baseline !== undefined && (isNaN(baseline) || baseline < 0 || baseline > 100)) {
                        errors.push({ 
                            field: `emotions.${emotion}.baseline`, 
                            message: 'ベースライン値は0-100の範囲で指定してください', 
                            code: 'INVALID_RANGE' 
                        });
                    }
                }
            }
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    // ==================== 内部メソッド ====================

    /**
     * 状態管理の初期化
     */
    _initializeState() {
        // 感情システムの初期状態を設定
        this.stateManager.setState('app.persona.emotion_system', {
            model: 'Ekman',
            emotions: {}
        });

        this.stateManager.setState('app.persona.current_emotion_state', {});
    }

    /**
     * イベントハンドラーの設定
     */
    _setupEventHandlers() {
        // ペルソナデータの変更を監視
        this.stateManager.subscribe('app.persona', (personaData) => {
            if (personaData?.emotion_system) {
                this._loadEmotionSystem(personaData);
            }
        });

        // タブ切り替えイベント
        this.eventBus.on('tab:changed', (data) => {
            if (data.to === 'emotion') {
                this._onEmotionTabEnter();
            }
        });
    }

    /**
     * 既存システムとの互換性チェック
     */
    _checkLegacyCompatibility() {
        if (typeof window !== 'undefined' && window.EmotionSystem) {
            this.legacyMode = true;
            this.log('Legacy emotion system detected, enabling compatibility mode');
        }
    }

    /**
     * ペルソナデータから感情システムを読み込み
     * @param {Object} personaData - ペルソナデータ
     */
    async _loadEmotionSystem(personaData) {
        if (!personaData.emotion_system) {
            // デフォルトシステムを作成
            const defaultModel = this._createDefaultModel();
            this.initializeModel(defaultModel);
            return;
        }

        const model = {
            type: personaData.emotion_system.model || 'Ekman',
            emotions: personaData.emotion_system.emotions || {}
        };

        this.initializeModel(model);
        
        // 現在の感情状態がない場合は同期
        if (!personaData.current_emotion_state) {
            this.syncStateFromBaseline();
        }
    }

    /**
     * デフォルトモデルを作成
     * @returns {Object} デフォルト感情モデル
     */
    _createDefaultModel() {
        return {
            type: 'Ekman',
            emotions: {
                joy: { baseline: 60, description: '喜び、幸福感、達成感を表します。' },
                sadness: { baseline: 30, description: '悲しみ、喪失感、失望を表します。' },
                anger: { baseline: 25, description: '怒り、不満、憤りを表します。' },
                fear: { baseline: 40, description: '恐怖、不安、心配を表します。' },
                disgust: { baseline: 20, description: '嫌悪、拒否反応を表します。' },
                surprise: { baseline: 50, description: '驚き、予期しない反応を表します。' }
            }
        };
    }

    /**
     * タイプ別モデルを作成
     * @param {string} modelType - モデルタイプ
     * @returns {Object} 感情モデル
     */
    _createModelByType(modelType) {
        switch (modelType) {
            case 'Ekman':
                return this._createDefaultModel();
            case 'Plutchik':
                // 将来実装
                this.log('Plutchik model not implemented, using Ekman');
                return this._createDefaultModel();
            case 'PAD':
                // 将来実装
                this.log('PAD model not implemented, using Ekman');
                return this._createDefaultModel();
            case 'Custom':
                // 将来実装
                this.log('Custom model not implemented, using Ekman');
                return this._createDefaultModel();
            default:
                return this._createDefaultModel();
        }
    }

    /**
     * 感情IDの妥当性チェック
     * @param {string} emotionId - 感情ID
     * @returns {boolean} 妥当性
     */
    _validateEmotionId(emotionId) {
        return this.emotionData?.emotions?.hasOwnProperty(emotionId) || false;
    }

    /**
     * 新しい感情IDを生成
     * @returns {string} 感情ID
     */
    _generateEmotionId() {
        return `emotion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * 感情タブ入場時の処理
     */
    _onEmotionTabEnter() {
        // ビジュアライザーとの互換性
        if (this.legacyMode && window.uppsEditor?.updateVisualizerFromEmotionState) {
            const personaData = this.stateManager.getState('app.persona');
            window.uppsEditor.updateVisualizerFromEmotionState(personaData);
        }
        
        this.eventBus.emit('emotion:tab:entered');
    }

    /**
     * ログ出力
     * @param {string} message - メッセージ
     * @param {Object} data - ログデータ
     */
    log(message, data = null) {
        if (data !== null) {
            console.debug(`EmotionModule: ${message}`, data);
        } else {
            console.debug(`EmotionModule: ${message}`);
        }
    }
}

// ES6モジュールとしてエクスポート
export { EmotionModule };