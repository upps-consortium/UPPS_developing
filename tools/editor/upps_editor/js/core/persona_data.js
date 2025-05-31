// js/core/persona-data.js
// ペルソナデータの管理とテンプレート機能

/**
 * デフォルトペルソナテンプレートを取得
 * @returns {Object} デフォルトペルソナデータ
 */
function getDefaultPersona() {
    return {
        version: window.UPPS_CONFIG.VERSION,
        personal_info: {
            name: '',
            age: null,
            gender: '',
            occupation: ''
        },
        background: '',
        // 現在の感情状態はランタイム変数として扱う（初期値はベースラインから生成）
        current_emotion_state: {},
        emotion_system: {
            model: 'Ekman',
            emotions: {
                joy: {
                    baseline: 60,
                    description: '喜び、幸福感、達成感を表します。'
                },
                sadness: {
                    baseline: 30,
                    description: '悲しみ、喪失感、失望を表します。'
                },
                anger: {
                    baseline: 25,
                    description: '怒り、不満、憤りを表します。'
                },
                fear: {
                    baseline: 40,
                    description: '恐怖、不安、心配を表します。'
                },
                disgust: {
                    baseline: 20,
                    description: '嫌悪、拒否反応を表します。'
                },
                surprise: {
                    baseline: 50,
                    description: '驚き、予期しない反応を表します。'
                }
            }
        },
        personality: {
            model: 'Big Five',
            traits: {
                openness: 0.7,
                conscientiousness: 0.6,
                extraversion: 0.4,
                agreeableness: 0.65,
                neuroticism: 0.35
            }
        },
        memory_system: {
            memories: [
                {
                    id: 'childhood_memory_1',
                    type: 'episodic',
                    content: '子供の頃に家族で訪れた海での休暇。波に初めて触れた感動と、貝殻を集めた思い出。',
                    period: '子供時代',
                    emotional_valence: 0.8
                }
            ]
        },
        association_system: {
            associations: [
                {
                    id: 'assoc_1',
                    trigger: {
                        type: 'memory',
                        id: 'childhood_memory_1'
                    },
                    response: {
                        type: 'emotion',
                        id: 'joy',
                        association_strength: 85
                    }
                }
            ]
        },
        cognitive_system: {
            model: 'WAIS-IV',
            abilities: {
                verbal_comprehension: {
                    level: 75,
                    description: '言語理解、語彙力、知識の蓄積を表します。'
                },
                perceptual_reasoning: {
                    level: 70,
                    description: '視覚的・空間的な情報処理、パターン認識を表します。'
                },
                working_memory: {
                    level: 65,
                    description: '情報の一時的保持と操作、注意集中力を表します。'
                },
                processing_speed: {
                    level: 80,
                    description: '情報処理の速度、効率を表します。'
                }
            }
        }
    };
}

/**
 * ペルソナデータのバリデーション
 * @param {Object} persona ペルソナデータ
 * @returns {boolean} バリデーション結果
 */
function validatePersonaStructure(persona) {
    if (!persona || typeof persona !== 'object') {
        return false;
    }
    
    // 必須フィールドのチェック
    const requiredFields = [
        'personal_info',
        'emotion_system',
        'personality',
        'memory_system',
        'association_system',
        'cognitive_system'
    ];
    
    for (const field of requiredFields) {
        if (!persona[field]) {
            window.UPPS_LOG.warn(`Missing required field: ${field}`);
            return false;
        }
    }
    
    return true;
}

/**
 * ペルソナデータを深くマージする
 * @param {Object} target マージ先
 * @param {Object} source マージ元
 * @returns {Object} マージ結果
 */
function deepMergePersona(target, source) {
    const isObject = obj => obj && typeof obj === 'object' && !Array.isArray(obj);
    
    if (!isObject(target) || !isObject(source)) {
        return source;
    }
    
    const output = Object.assign({}, target);
    
    Object.keys(source).forEach(key => {
        if (isObject(source[key])) {
            if (!(key in target)) {
                Object.assign(output, { [key]: source[key] });
            } else {
                output[key] = deepMergePersona(target[key], source[key]);
            }
        } else {
            Object.assign(output, { [key]: source[key] });
        }
    });
    
    return output;
}

/**
 * テンプレートとマージして不足フィールドを補完
 * @param {Object} data インポートされたデータ
 * @returns {Object} 完全なペルソナデータ
 */
function mergeWithTemplate(data) {
    const template = getDefaultPersona();
    return deepMergePersona(template, data);
}

/**
 * バージョン互換性チェック
 * @param {Object} persona ペルソナデータ
 * @returns {Object} 互換性情報
 */
function checkVersionCompatibility(persona) {
    const currentVersion = window.UPPS_CONFIG.VERSION;
    const dataVersion = persona.version || '1.0.0';
    
    const result = {
        compatible: true,
        needsUpdate: false,
        warnings: []
    };
    
    if (dataVersion !== currentVersion) {
        result.needsUpdate = true;
        result.warnings.push(`データバージョン (${dataVersion}) が現在のエディタバージョン (${currentVersion}) と異なります`);
        
        // バージョン固有の互換性チェック
        if (dataVersion < '2025.0') {
            result.warnings.push('古いバージョンのデータです。一部機能が正常に動作しない可能性があります');
        }
    }
    
    return result;
}

/**
 * ペルソナデータをクリーンアップ
 * @param {Object} persona ペルソナデータ
 * @returns {Object} クリーンアップされたデータ
 */
function cleanupPersonaData(persona) {
    const cleaned = JSON.parse(JSON.stringify(persona));
    
    // 空の値を削除
    function removeEmptyValues(obj) {
        for (const key in obj) {
            if (obj[key] === null || obj[key] === undefined || obj[key] === '') {
                delete obj[key];
            } else if (typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
                removeEmptyValues(obj[key]);
                
                // 空のオブジェクトを削除
                if (Object.keys(obj[key]).length === 0) {
                    delete obj[key];
                }
            } else if (Array.isArray(obj[key])) {
                // 配列内の空の要素を削除
                obj[key] = obj[key].filter(item => {
                    if (typeof item === 'object') {
                        removeEmptyValues(item);
                        return Object.keys(item).length > 0;
                    }
                    return item !== null && item !== undefined && item !== '';
                });
                
                // 空の配列を削除
                if (obj[key].length === 0) {
                    delete obj[key];
                }
            }
        }
    }
    
    removeEmptyValues(cleaned);
    
    return cleaned;
}

/**
 * IDの重複チェック
 * @param {Object} persona ペルソナデータ
 * @returns {Array} 重複ID のリスト
 */
function checkDuplicateIds(persona) {
    const duplicates = [];
    
    // 記憶IDの重複チェック
    if (persona.memory_system && persona.memory_system.memories) {
        const memoryIds = new Set();
        
        for (const memory of persona.memory_system.memories) {
            if (memoryIds.has(memory.id)) {
                duplicates.push({
                    type: 'memory',
                    id: memory.id,
                    message: `記憶ID "${memory.id}" が重複しています`
                });
            } else {
                memoryIds.add(memory.id);
            }
        }
    }
    
    // 関連性IDの重複チェック
    if (persona.association_system && persona.association_system.associations) {
        const assocIds = new Set();
        
        for (const assoc of persona.association_system.associations) {
            if (assoc.id) {
                if (assocIds.has(assoc.id)) {
                    duplicates.push({
                        type: 'association',
                        id: assoc.id,
                        message: `関連性ID "${assoc.id}" が重複しています`
                    });
                } else {
                    assocIds.add(assoc.id);
                }
            }
        }
    }
    
    return duplicates;
}

/**
 * 感情状態をベースラインから初期化
 * @param {Object} persona ペルソナデータ
 * @returns {Object} 更新されたペルソナデータ
 */
function initializeEmotionState(persona) {
    if (!persona.emotion_system || !persona.emotion_system.emotions) {
        window.UPPS_LOG.warn('Cannot initialize emotion state: emotion system not found');
        return persona;
    }
    
    const emotions = persona.emotion_system.emotions;
    persona.current_emotion_state = {};
    
    for (const [emotion, data] of Object.entries(emotions)) {
        // ベースラインを基準に、±20%の範囲でランダムな値を生成
        const min = Math.max(0, data.baseline - 20);
        const max = Math.min(100, data.baseline + 20);
        persona.current_emotion_state[emotion] = Math.floor(Math.random() * (max - min + 1)) + min;
    }
    
    window.UPPS_LOG.info('Emotion state initialized from baseline values');
    
    return persona;
}

/**
 * 参照整合性チェック
 * @param {Object} persona ペルソナデータ
 * @returns {Array} 整合性エラーのリスト
 */
function checkReferentialIntegrity(persona) {
    const errors = [];
    
    // 存在する記憶IDと感情IDを収集
    const memoryIds = new Set();
    const emotionIds = new Set();
    
    if (persona.memory_system && persona.memory_system.memories) {
        persona.memory_system.memories.forEach(memory => memoryIds.add(memory.id));
    }
    
    if (persona.emotion_system && persona.emotion_system.emotions) {
        Object.keys(persona.emotion_system.emotions).forEach(id => emotionIds.add(id));
    }
    
    // 関連性システムの参照をチェック
    if (persona.association_system && persona.association_system.associations) {
        persona.association_system.associations.forEach((assoc, index) => {
            // トリガーのチェック
            if (assoc.trigger) {
                if (assoc.trigger.type === 'memory' && !memoryIds.has(assoc.trigger.id)) {
                    errors.push(`関連性${index + 1}: トリガー記憶ID "${assoc.trigger.id}" が存在しません`);
                }
                
                if (assoc.trigger.type === 'emotion' && !emotionIds.has(assoc.trigger.id)) {
                    errors.push(`関連性${index + 1}: トリガー感情ID "${assoc.trigger.id}" が存在しません`);
                }
                
                // 複合条件のチェック
                if (assoc.trigger.type === 'complex' && assoc.trigger.conditions) {
                    assoc.trigger.conditions.forEach((condition, condIndex) => {
                        if (condition.type === 'memory' && !memoryIds.has(condition.id)) {
                            errors.push(`関連性${index + 1}条件${condIndex + 1}: 記憶ID "${condition.id}" が存在しません`);
                        }
                        if (condition.type === 'emotion' && !emotionIds.has(condition.id)) {
                            errors.push(`関連性${index + 1}条件${condIndex + 1}: 感情ID "${condition.id}" が存在しません`);
                        }
                    });
                }
            }
            
            // レスポンスのチェック
            if (assoc.response) {
                if (assoc.response.type === 'memory' && !memoryIds.has(assoc.response.id)) {
                    errors.push(`関連性${index + 1}: レスポンス記憶ID "${assoc.response.id}" が存在しません`);
                }
                
                if (assoc.response.type === 'emotion' && !emotionIds.has(assoc.response.id)) {
                    errors.push(`関連性${index + 1}: レスポンス感情ID "${assoc.response.id}" が存在しません`);
                }
            }
        });
    }
    
    return errors;
}

// グローバルに公開
window.PersonaData = {
    getDefaultPersona,
    validatePersonaStructure,
    deepMergePersona,
    mergeWithTemplate,
    checkVersionCompatibility,
    cleanupPersonaData,
    checkDuplicateIds,
    initializeEmotionState,
    checkReferentialIntegrity
};

window.UPPS_LOG.info('Persona data module initialized');
