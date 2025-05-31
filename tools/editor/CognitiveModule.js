/**
 * CognitiveModule.js - UPPS新アーキテクチャ 認知能力システムモジュール
 * 
 * 認知能力データの管理、分析、プロファイル生成を担当するドメインモジュール
 * インターフェース定義書準拠実装
 */

class CognitiveModule {
    constructor() {
        this.name = 'CognitiveModule';
        this.dependencies = []; // 他モジュールへの依存なし
        
        // サポートされる認知モデル
        this.supportedModels = ['WAIS-IV', 'CHC', 'Custom'];
        this.currentModel = 'WAIS-IV';
        
        // WAIS-IVモデルの能力定義
        this.waisAbilities = {
            verbal_comprehension: {
                label: '言語理解',
                description: '言語による情報の理解、処理、表現能力。言語的知識、語彙力、抽象的思考を含む。',
                category: '言語系',
                default: 75
            },
            perceptual_reasoning: {
                label: '知覚推理',
                description: '視覚的情報の分析、処理、解釈能力。空間認識、パターン認識、視覚的推論を含む。',
                category: '非言語系',
                default: 70
            },
            working_memory: {
                label: 'ワーキングメモリ',
                description: '情報を一時的に保持し、操作する能力。短期記憶、注意力、集中力を含む。',
                category: '記憶系',
                default: 65
            },
            processing_speed: {
                label: '処理速度',
                description: '簡単な視覚情報を素早く正確に処理する能力。認知的効率性と自動処理を含む。',
                category: '処理系',
                default: 80
            }
        };
        
        // バリデーション設定
        this.validation = {
            maxLevel: 100,
            minLevel: 0,
            maxDescriptionLength: 500
        };
        
        // モジュール状態
        this.eventBus = null;
        this.stateManager = null;
        this.isInitialized = false;
        
        this.log('CognitiveModule created');
    }

    /**
     * モジュールの初期化
     * @param {EventBus} eventBus - イベントバス
     * @param {StateManager} stateManager - 状態管理
     */
    async initialize(eventBus, stateManager) {
        if (this.isInitialized) {
            this.log('CognitiveModule already initialized');
            return;
        }

        this.eventBus = eventBus;
        this.stateManager = stateManager;

        // イベントハンドラーの設定
        this._setupEventHandlers();

        // 状態の初期化
        this._initializeState();

        this.isInitialized = true;
        this.log('CognitiveModule initialized successfully');
        
        this.eventBus.emit('cognitive:module:initialized');
    }

    /**
     * モジュールの開始
     */
    async start() {
        if (!this.isInitialized) {
            throw new Error('CognitiveModule must be initialized before starting');
        }

        // 既存データの検証と修正
        this._validateExistingCognitiveSystem();

        this.log('CognitiveModule started successfully');
        this.eventBus.emit('cognitive:module:started');
    }

    /**
     * モジュールの停止
     */
    async stop() {
        this.log('CognitiveModule stopped');
        this.eventBus.emit('cognitive:module:stopped');
    }

    /**
     * モジュールの破棄
     */
    async destroy() {
        this.eventBus = null;
        this.stateManager = null;
        this.isInitialized = false;
        
        this.log('CognitiveModule destroyed');
    }

    // ==================== 認知モデル管理 ====================

    /**
     * 認知モデルを初期化
     * @param {Object} model - 認知モデル
     */
    initializeModel(model) {
        const targetModel = model.type || 'WAIS-IV';
        
        if (!this.supportedModels.includes(targetModel)) {
            throw new Error(`Unsupported cognitive model: ${targetModel}`);
        }

        this.currentModel = targetModel;

        // 状態にモデル情報を設定
        this.stateManager.setState('persona.cognitive_system.model', targetModel);

        // モデルに応じた能力の初期化
        switch (targetModel) {
            case 'WAIS-IV':
                this._initializeWAISModel(model.abilities);
                break;
            case 'CHC':
                this._initializeCHCModel(model.abilities);
                break;
            case 'Custom':
                this._initializeCustomModel(model.abilities);
                break;
        }

        this.log('Cognitive model initialized', { model: targetModel });
        this.eventBus.emit('cognitive:model:changed', { model: targetModel });
    }

    /**
     * 現在のモデルを取得
     * @returns {Object} 認知モデル
     */
    getModel() {
        const modelType = this.stateManager.getState('persona.cognitive_system.model') || 'WAIS-IV';
        const abilities = this.stateManager.getState('persona.cognitive_system.abilities') || {};

        return {
            type: modelType,
            abilities
        };
    }

    /**
     * モデルを切り替え
     * @param {string} modelType - モデルタイプ
     */
    switchModel(modelType) {
        if (!this.supportedModels.includes(modelType)) {
            throw new Error(`Unsupported cognitive model: ${modelType}`);
        }

        const currentAbilities = this.stateManager.getState('persona.cognitive_system.abilities') || {};
        
        this.initializeModel({
            type: modelType,
            abilities: currentAbilities
        });

        this.log('Cognitive model switched', { from: this.currentModel, to: modelType });
    }

    // ==================== 能力操作 ====================

    /**
     * 能力レベルを設定
     * @param {string} abilityId - 能力ID
     * @param {number} level - レベル値
     */
    setAbilityLevel(abilityId, level) {
        const currentAbilities = this.stateManager.getState('persona.cognitive_system.abilities') || {};
        
        if (!currentAbilities[abilityId]) {
            throw new Error(`Ability not found: ${abilityId}`);
        }

        // 値の範囲チェック
        const clampedLevel = Math.max(this.validation.minLevel, 
                                     Math.min(this.validation.maxLevel, Math.round(level)));

        // 状態を更新
        const updatedAbilities = { ...currentAbilities };
        updatedAbilities[abilityId].level = clampedLevel;
        
        this.stateManager.setState('persona.cognitive_system.abilities', updatedAbilities);

        this.log('Ability level set', { abilityId, level: clampedLevel });
        this.eventBus.emit('cognitive:ability:changed', { abilityId, level: clampedLevel });
    }

    /**
     * 能力レベルを取得
     * @param {string} abilityId - 能力ID
     * @returns {number} レベル値
     */
    getAbilityLevel(abilityId) {
        const abilities = this.stateManager.getState('persona.cognitive_system.abilities') || {};
        return abilities[abilityId]?.level || 0;
    }

    /**
     * 能力の説明を更新
     * @param {string} abilityId - 能力ID
     * @param {string} description - 新しい説明
     */
    updateAbilityDescription(abilityId, description) {
        const currentAbilities = this.stateManager.getState('persona.cognitive_system.abilities') || {};
        
        if (!currentAbilities[abilityId]) {
            throw new Error(`Ability not found: ${abilityId}`);
        }

        // 説明の長さチェック
        if (description.length > this.validation.maxDescriptionLength) {
            throw new Error(`Description too long: max ${this.validation.maxDescriptionLength} characters`);
        }

        // 状態を更新
        const updatedAbilities = { ...currentAbilities };
        updatedAbilities[abilityId].description = description;
        
        this.stateManager.setState('persona.cognitive_system.abilities', updatedAbilities);

        this.log('Ability description updated', { abilityId });
        this.eventBus.emit('cognitive:ability:description:changed', { abilityId, description });
    }

    // ==================== 分析機能 ====================

    /**
     * 認知プロファイルを生成
     * @returns {Object} 認知プロファイル
     */
    generateProfile() {
        const abilities = this.stateManager.getState('persona.cognitive_system.abilities') || {};
        const stats = this.getStatistics();

        const profile = {
            overall: this._interpretOverallProfile(stats),
            strengths: this.identifyStrengths(),
            weaknesses: this.identifyWeaknesses(),
            recommendations: this._generateRecommendations(stats),
            balance: this._analyzeBalance(stats),
            metadata: {
                generatedAt: new Date().toISOString(),
                model: this.currentModel,
                totalAbilities: Object.keys(abilities).length
            }
        };

        this.log('Cognitive profile generated');
        this.eventBus.emit('cognitive:profile:generated', { profile });

        return profile;
    }

    /**
     * 統計情報を取得
     * @returns {Object} 統計情報
     */
    getStatistics() {
        const abilities = this.stateManager.getState('persona.cognitive_system.abilities') || {};
        const levels = Object.values(abilities).map(ability => ability.level || 0);

        if (levels.length === 0) {
            return {
                average: 0,
                min: 0,
                max: 0,
                range: 0,
                standardDeviation: 0,
                count: 0
            };
        }

        const average = levels.reduce((sum, level) => sum + level, 0) / levels.length;
        const min = Math.min(...levels);
        const max = Math.max(...levels);
        const variance = levels.reduce((sum, level) => sum + Math.pow(level - average, 2), 0) / levels.length;
        const standardDeviation = Math.sqrt(variance);

        return {
            average: Math.round(average * 10) / 10,
            min,
            max,
            range: max - min,
            standardDeviation: Math.round(standardDeviation * 10) / 10,
            count: levels.length
        };
    }

    /**
     * 強みを特定
     * @returns {Array} 強みの配列
     */
    identifyStrengths() {
        const abilities = this.stateManager.getState('persona.cognitive_system.abilities') || {};
        const stats = this.getStatistics();
        const strengths = [];

        for (const [abilityId, abilityData] of Object.entries(abilities)) {
            // 平均より25%以上高い、または75以上を強みとする
            const threshold = Math.max(75, stats.average + 25);
            
            if (abilityData.level >= threshold) {
                const abilityInfo = this.waisAbilities[abilityId] || {};
                
                strengths.push({
                    ability: abilityInfo.label || abilityId,
                    level: abilityData.level,
                    description: abilityData.description || abilityInfo.description || '',
                    category: abilityInfo.category || 'その他'
                });
            }
        }

        // レベルの高い順にソート
        return strengths.sort((a, b) => b.level - a.level);
    }

    /**
     * 弱みを特定
     * @returns {Array} 弱みの配列
     */
    identifyWeaknesses() {
        const abilities = this.stateManager.getState('persona.cognitive_system.abilities') || {};
        const stats = this.getStatistics();
        const weaknesses = [];

        for (const [abilityId, abilityData] of Object.entries(abilities)) {
            // 平均より25%以上低い、または50以下を弱みとする
            const threshold = Math.min(50, stats.average - 25);
            
            if (abilityData.level <= threshold) {
                const abilityInfo = this.waisAbilities[abilityId] || {};
                
                weaknesses.push({
                    ability: abilityInfo.label || abilityId,
                    level: abilityData.level,
                    description: abilityData.description || abilityInfo.description || '',
                    category: abilityInfo.category || 'その他'
                });
            }
        }

        // レベルの低い順にソート
        return weaknesses.sort((a, b) => a.level - b.level);
    }

    // ==================== CRUD Operations ====================

    /**
     * 能力データを作成
     * @param {Object} data - 能力データ
     * @returns {string} 作成された能力のID
     */
    create(data) {
        const abilityId = data.id || `ability_${Date.now()}`;
        const abilityData = {
            level: data.level || 50,
            description: data.description || '',
            category: data.category || 'その他',
            created_at: new Date().toISOString()
        };

        const currentAbilities = this.stateManager.getState('persona.cognitive_system.abilities') || {};
        const updatedAbilities = { ...currentAbilities, [abilityId]: abilityData };
        
        this.stateManager.setState('persona.cognitive_system.abilities', updatedAbilities);

        this.log('Cognitive ability created', { abilityId });
        this.eventBus.emit('cognitive:ability:created', { abilityId, data: abilityData });

        return abilityId;
    }

    /**
     * 能力データを読み取り
     * @param {string} id - 能力ID
     * @returns {Object|null} 能力データ
     */
    read(id) {
        const abilities = this.stateManager.getState('persona.cognitive_system.abilities') || {};
        return abilities[id] || null;
    }

    /**
     * 能力データを更新
     * @param {string} id - 能力ID
     * @param {Object} data - 更新データ
     */
    update(id, data) {
        const currentAbilities = this.stateManager.getState('persona.cognitive_system.abilities') || {};
        
        if (!currentAbilities[id]) {
            throw new Error(`Ability not found: ${id}`);
        }

        const updatedAbility = { 
            ...currentAbilities[id], 
            ...data, 
            updated_at: new Date().toISOString()
        };

        const updatedAbilities = { ...currentAbilities, [id]: updatedAbility };
        this.stateManager.setState('persona.cognitive_system.abilities', updatedAbilities);

        this.log('Cognitive ability updated', { id, data });
        this.eventBus.emit('cognitive:ability:updated', { id, data: updatedAbility });
    }

    /**
     * 能力データを削除
     * @param {string} id - 能力ID
     */
    delete(id) {
        const currentAbilities = this.stateManager.getState('persona.cognitive_system.abilities') || {};
        
        if (!currentAbilities[id]) {
            throw new Error(`Ability not found: ${id}`);
        }

        const updatedAbilities = { ...currentAbilities };
        delete updatedAbilities[id];
        
        this.stateManager.setState('persona.cognitive_system.abilities', updatedAbilities);

        this.log('Cognitive ability deleted', { id });
        this.eventBus.emit('cognitive:ability:deleted', { id });
    }

    /**
     * 全能力データを取得
     * @returns {Array} 能力データの配列
     */
    list() {
        const abilities = this.stateManager.getState('persona.cognitive_system.abilities') || {};
        return Object.entries(abilities).map(([id, data]) => ({ id, ...data }));
    }

    // ==================== バリデーション ====================

    /**
     * 認知システムのバリデーション
     * @param {Object} data - 認知システムデータ
     * @returns {Object} バリデーション結果
     */
    validate(data) {
        const errors = [];

        // モデル検証
        if (!data.model) {
            errors.push({
                field: 'model',
                message: 'Cognitive model is required',
                code: 'MISSING_MODEL'
            });
        } else if (!this.supportedModels.includes(data.model)) {
            errors.push({
                field: 'model',
                message: `Unsupported cognitive model: ${data.model}`,
                code: 'UNSUPPORTED_MODEL'
            });
        }

        // 能力データ検証
        if (data.abilities) {
            for (const [abilityId, abilityData] of Object.entries(data.abilities)) {
                const abilityErrors = this._validateAbility(abilityId, abilityData);
                errors.push(...abilityErrors);
            }
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
            model: this.getModel(),
            abilities: this.list(),
            statistics: this.getStatistics(),
            profile: this.generateProfile()
        };
    }

    /**
     * モジュール状態を設定
     * @param {Object} state - 設定する状態
     */
    setState(state) {
        if (state.model) {
            this.initializeModel(state.model);
        }
        
        if (state.abilities) {
            const abilitiesMap = {};
            state.abilities.forEach(ability => {
                const { id, ...data } = ability;
                abilitiesMap[id] = data;
            });
            this.stateManager.setState('persona.cognitive_system.abilities', abilitiesMap);
        }
    }

    /**
     * 変更イベントを発行
     * @param {string} type - 変更タイプ
     * @param {Object} data - イベントデータ
     */
    emitChange(type, data) {
        this.eventBus.emit(`cognitive:${type}`, data);
    }

    // ==================== 内部メソッド ====================

    /**
     * イベントハンドラーの設定
     */
    _setupEventHandlers() {
        // ペルソナデータの読み込み時の初期化
        this.eventBus.on('persona:loaded', () => {
            this._initializeCognitiveSystem();
        });

        this.log('Event handlers setup complete');
    }

    /**
     * 状態の初期化
     */
    _initializeState() {
        const cognitiveSystem = this.stateManager.getState('persona.cognitive_system');
        if (!cognitiveSystem) {
            this.stateManager.setState('persona.cognitive_system', {
                model: 'WAIS-IV',
                abilities: {}
            });
        }
    }

    /**
     * 認知システムの初期化
     */
    _initializeCognitiveSystem() {
        const model = this.stateManager.getState('persona.cognitive_system.model') || 'WAIS-IV';
        const abilities = this.stateManager.getState('persona.cognitive_system.abilities') || {};

        this.initializeModel({ type: model, abilities });
    }

    /**
     * WAIS-IVモデルの初期化
     * @param {Object} existingAbilities - 既存の能力データ
     */
    _initializeWAISModel(existingAbilities = {}) {
        const abilities = {};

        for (const [abilityId, abilityInfo] of Object.entries(this.waisAbilities)) {
            abilities[abilityId] = {
                level: existingAbilities[abilityId]?.level || abilityInfo.default,
                description: existingAbilities[abilityId]?.description || abilityInfo.description,
                category: abilityInfo.category
            };
        }

        this.stateManager.setState('persona.cognitive_system.abilities', abilities);
        this.log('WAIS-IV model initialized');
    }

    /**
     * CHCモデルの初期化（プレースホルダー）
     * @param {Object} existingAbilities - 既存の能力データ
     */
    _initializeCHCModel(existingAbilities = {}) {
        this.log('CHC model not yet implemented, falling back to WAIS-IV');
        this._initializeWAISModel(existingAbilities);
    }

    /**
     * カスタムモデルの初期化（プレースホルダー）
     * @param {Object} existingAbilities - 既存の能力データ
     */
    _initializeCustomModel(existingAbilities = {}) {
        this.log('Custom model not yet implemented, falling back to WAIS-IV');
        this._initializeWAISModel(existingAbilities);
    }

    /**
     * 既存認知システムの検証と修正
     */
    _validateExistingCognitiveSystem() {
        const cognitiveSystem = this.stateManager.getState('persona.cognitive_system');
        
        if (!cognitiveSystem) {
            this._initializeCognitiveSystem();
            return;
        }

        const validationResult = this.validate(cognitiveSystem);
        
        if (!validationResult.valid) {
            this.log('Cognitive system validation failed, reinitializing', { 
                errors: validationResult.errors 
            });
            this._initializeCognitiveSystem();
        }
    }

    /**
     * 全体プロファイルの解釈
     * @param {Object} stats - 統計情報
     * @returns {string} 解釈文
     */
    _interpretOverallProfile(stats) {
        if (stats.average >= 80) {
            return '全体的に高い認知能力を示しています。多くの分野で優秀なパフォーマンスが期待できます。';
        } else if (stats.average >= 60) {
            return '平均的な認知能力を示しています。バランスの良い認知機能を持っています。';
        } else if (stats.average >= 40) {
            return '一部の認知能力に改善の余地があります。特定の分野に焦点を当てた向上が効果的でしょう。';
        } else {
            return '認知能力全般の向上が推奨されます。段階的な能力開発が重要です。';
        }
    }

    /**
     * 推奨事項の生成
     * @param {Object} stats - 統計情報
     * @returns {Array} 推奨事項の配列
     */
    _generateRecommendations(stats) {
        const recommendations = [];

        if (stats.range > 30) {
            recommendations.push('能力間のバランスを改善することで、全体的なパフォーマンスが向上する可能性があります。');
        }

        if (stats.standardDeviation > 20) {
            recommendations.push('認知能力のばらつきが大きいため、一貫性のある能力開発を心がけましょう。');
        }

        if (stats.min < 40) {
            recommendations.push('最も低い認知能力分野に焦点を当てたトレーニングを検討してください。');
        }

        if (stats.average < 60) {
            recommendations.push('日常的な認知活動（読書、パズル、新しいスキル学習）を増やすことを推奨します。');
        }

        if (stats.max - stats.min > 40) {
            recommendations.push('強みを活かしつつ、弱みを補完するような学習戦略が効果的です。');
        }

        return recommendations;
    }

    /**
     * バランス分析
     * @param {Object} stats - 統計情報
     * @returns {Object} バランス分析結果
     */
    _analyzeBalance(stats) {
        return {
            score: Math.max(0, 100 - (stats.standardDeviation * 2)), // 標準偏差からバランススコアを算出
            status: stats.range <= 20 ? 'excellent' : 
                   stats.range <= 40 ? 'good' : 
                   stats.range <= 60 ? 'fair' : 'poor',
            description: stats.range <= 20 ? '非常にバランスが取れています' :
                        stats.range <= 40 ? 'バランスが良好です' :
                        stats.range <= 60 ? 'やや偏りがあります' : '大きな偏りがあります'
        };
    }

    /**
     * 能力データのバリデーション
     * @param {string} abilityId - 能力ID
     * @param {Object} abilityData - 能力データ
     * @returns {Array} エラー配列
     */
    _validateAbility(abilityId, abilityData) {
        const errors = [];

        // レベル検証
        if (abilityData.level === undefined || abilityData.level === null) {
            errors.push({
                field: `abilities.${abilityId}.level`,
                message: 'Ability level is required',
                code: 'MISSING_LEVEL'
            });
        } else if (typeof abilityData.level !== 'number' || 
                   abilityData.level < this.validation.minLevel || 
                   abilityData.level > this.validation.maxLevel) {
            errors.push({
                field: `abilities.${abilityId}.level`,
                message: `Level must be between ${this.validation.minLevel} and ${this.validation.maxLevel}`,
                code: 'INVALID_LEVEL'
            });
        }

        // 説明検証
        if (abilityData.description && 
            abilityData.description.length > this.validation.maxDescriptionLength) {
            errors.push({
                field: `abilities.${abilityId}.description`,
                message: `Description too long: max ${this.validation.maxDescriptionLength} characters`,
                code: 'DESCRIPTION_TOO_LONG'
            });
        }

        return errors;
    }

    /**
     * ログ出力
     */
    log(message, data = null) {
        if (data !== null) {
            console.debug(`CognitiveModule: ${message}`, data);
        } else {
            console.debug(`CognitiveModule: ${message}`);
        }
    }
}

// ES6モジュールとしてエクスポート
export { CognitiveModule };