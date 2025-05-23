// js/modules/cognitive_system.js
// 認知能力システムの管理

/**
 * 認知システム管理クラス
 */
class CognitiveSystemManager {
    constructor() {
        this.supportedModels = ['WAIS-IV', 'CHC', 'Custom'];
        this.currentModel = 'WAIS-IV';
        
        // WAIS-IVの能力定義
        this.waisAbilities = {
            verbal_comprehension: {
                label: '言語理解',
                description: '言語による情報の理解、処理、表現能力。言語的知識、語彙力、抽象的思考を含む。',
                default: 75
            },
            perceptual_reasoning: {
                label: '知覚推理',
                description: '視覚的情報の分析、処理、解釈能力。空間認識、パターン認識、視覚的推論を含む。',
                default: 70
            },
            working_memory: {
                label: 'ワーキングメモリ',
                description: '情報を一時的に保持し、操作する能力。短期記憶、注意力、集中力を含む。',
                default: 65
            },
            processing_speed: {
                label: '処理速度',
                description: '簡単な視覚情報を素早く正確に処理する能力。認知的効率性と自動処理を含む。',
                default: 80
            }
        };
        
        // レーダーチャート用の軸マッピング
        this.axisMapping = {
            "言語理解": "verbal_comprehension",
            "知覚推理": "perceptual_reasoning",
            "ワーキングメモリ": "working_memory",
            "処理速度": "processing_speed"
        };
    }
    
    /**
     * 認知システムの初期化
     * @param {Object} persona ペルソナデータ
     * @param {string} model 認知モデル名
     */
    initializeCognitiveSystem(persona, model = null) {
        const targetModel = model || persona?.cognitive_system?.model || 'WAIS-IV';
        
        if (!persona.cognitive_system) {
            persona.cognitive_system = {};
        }
        
        persona.cognitive_system.model = targetModel;
        
        window.UPPS_LOG.info('Initializing cognitive model', { model: targetModel });
        
        // モデルに応じた初期化
        switch (targetModel) {
            case 'WAIS-IV':
                this.initializeWAISModel(persona);
                break;
            case 'CHC':
                this.initializeCHCModel(persona);
                break;
            case 'Custom':
                this.initializeCustomModel(persona);
                break;
            default:
                window.UPPS_LOG.warn('Unknown cognitive model, using WAIS-IV', { model: targetModel });
                this.initializeWAISModel(persona);
        }
        
        this.currentModel = targetModel;
    }
    
    /**
     * WAIS-IVモデルの初期化
     * @param {Object} persona ペルソナデータ
     */
    initializeWAISModel(persona) {
        // すでに適切に初期化されていれば何もしない
        if (persona.cognitive_system.abilities && 
            persona.cognitive_system.abilities.verbal_comprehension) {
            return;
        }
        
        // 4つの主要能力の初期化
        persona.cognitive_system.abilities = {};
        
        for (const [abilityId, abilityData] of Object.entries(this.waisAbilities)) {
            persona.cognitive_system.abilities[abilityId] = {
                level: abilityData.default,
                description: abilityData.description
            };
        }
        
        window.UPPS_LOG.info('WAIS-IV cognitive model initialized');
    }
    
    /**
     * CHCモデルの初期化（未実装）
     * @param {Object} persona ペルソナデータ
     */
    initializeCHCModel(persona) {
        window.UPPS_LOG.warn('CHC model not yet implemented');
        // 将来の実装用プレースホルダー
        this.initializeWAISModel(persona); // フォールバック
    }
    
    /**
     * カスタムモデルの初期化（未実装）
     * @param {Object} persona ペルソナデータ
     */
    initializeCustomModel(persona) {
        window.UPPS_LOG.warn('Custom cognitive model not yet implemented');
        // 将来の実装用プレースホルダー
        this.initializeWAISModel(persona); // フォールバック
    }
    
    /**
     * 認知能力値を更新
     * @param {Object} persona ペルソナデータ
     * @param {string} axisName 軸名（日本語）
     * @param {number} value 新しい値
     */
    updateCognitiveAbility(persona, axisName, value) {
        // 軸名から能力IDを取得
        const abilityId = this.axisMapping[axisName];
        if (!abilityId) {
            window.UPPS_LOG.warn('Unknown axis name', { axisName });
            return false;
        }
        
        if (!persona.cognitive_system?.abilities?.[abilityId]) {
            window.UPPS_LOG.warn('Cognitive ability not found', { abilityId });
            return false;
        }
        
        // 値の範囲チェック
        const clampedValue = Math.max(0, Math.min(100, Math.round(value)));
        
        // ペルソナデータを更新
        persona.cognitive_system.abilities[abilityId].level = clampedValue;
        
        // UI表示も更新
        this.updateCognitiveAbilityDisplay(abilityId, clampedValue);
        
        window.UPPS_LOG.debug('Cognitive ability updated', { abilityId, value: clampedValue });
        
        return true;
    }
    
    /**
     * 認知能力表示を更新
     * @param {string} abilityId 能力ID
     * @param {number} value 新しい値
     */
    updateCognitiveAbilityDisplay(abilityId, value) {
        // レンジスライダーの更新
        const slider = document.querySelector(`[data-validation="ability_${abilityId}_level"]`);
        if (slider) {
            slider.value = value;
            slider.style.setProperty('--value', value);
        }
        
        // テキスト表示の更新
        const valueDisplay = document.querySelector(`[data-ability-value="${abilityId}"]`);
        if (valueDisplay) {
            valueDisplay.textContent = value + '%';
        }
        
        // プログレスバーの更新（存在する場合）
        const progressBar = document.querySelector(`[data-ability-progress="${abilityId}"]`);
        if (progressBar) {
            progressBar.style.width = value + '%';
        }
    }
    
    /**
     * 能力値を直接設定
     * @param {Object} persona ペルソナデータ
     * @param {string} abilityId 能力ID
     * @param {number} level 新しいレベル
     */
    setAbilityLevel(persona, abilityId, level) {
        if (!persona.cognitive_system?.abilities?.[abilityId]) {
            window.UPPS_LOG.warn('Cannot set ability level: ability not found', { abilityId });
            return false;
        }
        
        // 値の範囲チェック
        const clampedLevel = Math.max(0, Math.min(100, Math.round(level)));
        
        persona.cognitive_system.abilities[abilityId].level = clampedLevel;
        
        // UI表示を更新
        this.updateCognitiveAbilityDisplay(abilityId, clampedLevel);
        
        window.UPPS_LOG.info('Ability level set', { abilityId, level: clampedLevel });
        
        return true;
    }
    
    /**
     * 能力値を取得
     * @param {Object} persona ペルソナデータ
     * @param {string} abilityId 能力ID
     * @returns {number|null} 能力値またはnull
     */
    getAbilityLevel(persona, abilityId) {
        return persona.cognitive_system?.abilities?.[abilityId]?.level || null;
    }
    
    /**
     * 全能力の統計を取得
     * @param {Object} persona ペルソナデータ
     * @returns {Object} 統計情報
     */
    getAbilityStats(persona) {
        if (!persona.cognitive_system?.abilities) {
            return null;
        }
        
        const abilities = persona.cognitive_system.abilities;
        const levels = Object.values(abilities).map(ability => ability.level);
        
        return {
            average: levels.reduce((sum, level) => sum + level, 0) / levels.length,
            min: Math.min(...levels),
            max: Math.max(...levels),
            range: Math.max(...levels) - Math.min(...levels),
            abilities: Object.keys(abilities).length
        };
    }
    
    /**
     * レーダーチャート用のデータを生成
     * @param {Object} persona ペルソナデータ
     * @returns {Array} レーダーチャート用データ
     */
    generateRadarChartData(persona) {
        if (!persona.cognitive_system?.abilities) {
            return [];
        }
        
        const data = [];
        
        for (const [abilityId, abilityData] of Object.entries(persona.cognitive_system.abilities)) {
            const axisName = this.waisAbilities[abilityId]?.label || abilityId;
            data.push({
                axis: axisName,
                value: abilityData.level / 100,
                level: abilityData.level,
                abilityId: abilityId
            });
        }
        
        return data;
    }
    
    /**
     * 認知プロファイルの解釈を生成
     * @param {Object} persona ペルソナデータ
     * @returns {Object} プロファイル解釈
     */
    generateCognitiveProfile(persona) {
        const stats = this.getAbilityStats(persona);
        if (!stats) {
            return null;
        }
        
        const profile = {
            overall: this.interpretOverallProfile(stats),
            strengths: this.identifyStrengths(persona),
            weaknesses: this.identifyWeaknesses(persona),
            recommendations: this.generateRecommendations(persona, stats)
        };
        
        return profile;
    }
    
    /**
     * 全体的なプロファイルの解釈
     * @param {Object} stats 統計情報
     * @returns {string} 解釈文
     */
    interpretOverallProfile(stats) {
        if (stats.average >= 80) {
            return '全体的に高い認知能力を示しています。';
        } else if (stats.average >= 60) {
            return '平均的な認知能力を示しています。';
        } else if (stats.average >= 40) {
            return '一部の認知能力に改善の余地があります。';
        } else {
            return '認知能力全般の向上が推奨されます。';
        }
    }
    
    /**
     * 強みを特定
     * @param {Object} persona ペルソナデータ
     * @returns {Array} 強みのリスト
     */
    identifyStrengths(persona) {
        const abilities = persona.cognitive_system?.abilities || {};
        const strengths = [];
        
        for (const [abilityId, abilityData] of Object.entries(abilities)) {
            if (abilityData.level >= 75) {
                strengths.push({
                    ability: this.waisAbilities[abilityId]?.label || abilityId,
                    level: abilityData.level,
                    description: this.waisAbilities[abilityId]?.description || ''
                });
            }
        }
        
        return strengths.sort((a, b) => b.level - a.level);
    }
    
    /**
     * 弱点を特定
     * @param {Object} persona ペルソナデータ
     * @returns {Array} 弱点のリスト
     */
    identifyWeaknesses(persona) {
        const abilities = persona.cognitive_system?.abilities || {};
        const weaknesses = [];
        
        for (const [abilityId, abilityData] of Object.entries(abilities)) {
            if (abilityData.level < 50) {
                weaknesses.push({
                    ability: this.waisAbilities[abilityId]?.label || abilityId,
                    level: abilityData.level,
                    description: this.waisAbilities[abilityId]?.description || ''
                });
            }
        }
        
        return weaknesses.sort((a, b) => a.level - b.level);
    }
    
    /**
     * 改善推奨事項を生成
     * @param {Object} persona ペルソナデータ
     * @param {Object} stats 統計情報
     * @returns {Array} 推奨事項のリスト
     */
    generateRecommendations(persona, stats) {
        const recommendations = [];
        
        if (stats.range > 30) {
            recommendations.push('能力間のバランスを改善することで、全体的なパフォーマンスが向上する可能性があります。');
        }
        
        if (stats.min < 40) {
            recommendations.push('最も低い認知能力分野に焦点を当てたトレーニングを検討してください。');
        }
        
        if (stats.average < 60) {
            recommendations.push('日常的な認知活動（読書、パズル、新しいスキル学習）を増やすことを推奨します。');
        }
        
        return recommendations;
    }
    
    /**
     * 認知システムのバリデーション
     * @param {Object} persona ペルソナデータ
     * @returns {Array} エラーリスト
     */
    validateCognitiveSystem(persona) {
        const errors = [];
        
        if (!persona.cognitive_system) {
            errors.push('認知システムが定義されていません');
            return errors;
        }
        
        if (!persona.cognitive_system.model) {
            errors.push('認知モデルが指定されていません');
        } else if (!this.supportedModels.includes(persona.cognitive_system.model)) {
            errors.push(`サポートされていない認知モデルです: ${persona.cognitive_system.model}`);
        }
        
        // WAIS-IVモデルの詳細バリデーション
        if (persona.cognitive_system.model === 'WAIS-IV') {
            if (!persona.cognitive_system.abilities) {
                errors.push('認知能力データが定義されていません');
            } else {
                for (const [abilityId, abilityData] of Object.entries(this.waisAbilities)) {
                    if (!persona.cognitive_system.abilities[abilityId]) {
                        errors.push(`必須認知能力が不足しています: ${abilityData.label}`);
                    } else {
                        const level = persona.cognitive_system.abilities[abilityId].level;
                        if (level === undefined || level === null || 
                            isNaN(level) || level < 0 || level > 100) {
                            errors.push(`${abilityData.label}のレベルが不正です`);
                        }
                    }
                }
            }
        }
        
        return errors;
    }
    
    /**
     * サポートしているモデルのリストを取得
     * @returns {Array} モデルリスト
     */
    getSupportedModels() {
        return [...this.supportedModels];
    }
    
    /**
     * WAIS-IV能力の定義を取得
     * @returns {Object} 能力定義
     */
    getWAISAbilities() {
        return { ...this.waisAbilities };
    }
    
    /**
     * 現在のモデルを取得
     * @returns {string} 現在のモデル名
     */
    getCurrentModel() {
        return this.currentModel;
    }
}

// グローバルインスタンスを作成
window.CognitiveSystem = new CognitiveSystemManager();

// UPPSEditorプロトタイプに関数を追加
if (typeof UPPSEditor !== 'undefined') {
    UPPSEditor.prototype.handleCognitiveModelChange = function() {
        window.CognitiveSystem.initializeCognitiveSystem(this.persona);
    };
    
    UPPSEditor.prototype.updateCognitiveAbility = function(axisName, value) {
        return window.CognitiveSystem.updateCognitiveAbility(this.persona, axisName, value);
    };
    
    UPPSEditor.prototype.updateCognitiveAbilityDisplay = function(abilityId) {
        const level = window.CognitiveSystem.getAbilityLevel(this.persona, abilityId);
        if (level !== null) {
            window.CognitiveSystem.updateCognitiveAbilityDisplay(abilityId, level);
        }
    };
    
    UPPSEditor.prototype.getCognitiveProfile = function() {
        return window.CognitiveSystem.generateCognitiveProfile(this.persona);
    };
    
    UPPSEditor.prototype.getCognitiveRadarData = function() {
        return window.CognitiveSystem.generateRadarChartData(this.persona);
    };
}

window.UPPS_LOG.info('Cognitive system module initialized');
