// js/core/globals.js
// グローバル変数と設定の一元管理

/**
 * アプリケーション設定
 */
window.UPPS_CONFIG = {
    // バージョン情報
    VERSION: '2025.2',
    
    // 自動保存間隔（ミリ秒）
    AUTO_SAVE_INTERVAL: 30000,
    
    // ローカルストレージキー
    STORAGE_KEYS: {
        PERSONA_DATA: 'upps_persona_data',
        LAST_SAVED: 'upps_persona_last_saved',
        USER_PREFERENCES: 'upps_user_preferences'
    },
    
    // ビジュアライザ設定
    VISUALIZER: {
        DEFAULT_WIDTH: 800,
        DEFAULT_HEIGHT: 500,
        NODE_RADIUS: {
            MIN: 8,
            MAX: 25,
            DEFAULT: 15
        },
        LINK_STRENGTH: {
            MIN: 1,
            MAX: 5,
            DEFAULT: 2
        }
    },
    
    // レーダーチャート設定
    RADAR_CHART: {
        LEVELS: 5,
        MAX_VALUE: 1,
        DOT_RADIUS: 6,
        OPACITY_AREA: 0.35,
        OPACITY_CIRCLES: 0.1
    },
    
    // バリデーション設定
    VALIDATION: {
        MAX_NAME_LENGTH: 100,
        MAX_DESCRIPTION_LENGTH: 500,
        MAX_CONTENT_LENGTH: 1000,
        MIN_AGE: 0,
        MAX_AGE: 120
    }
};

/**
 * 感情・性格・認知能力のラベル定義
 */
window.UPPS_LABELS = {
    // 感情ラベル
    EMOTIONS: {
        joy: '喜び',
        sadness: '悲しみ',
        anger: '怒り',
        fear: '恐怖',
        disgust: '嫌悪',
        surprise: '驚き'
    },
    
    // 感情アイコン
    EMOTION_ICONS: {
        joy: 'smile',
        sadness: 'frown',
        anger: 'flame',
        fear: 'alert-circle',
        disgust: 'x-circle',
        surprise: 'zap'
    },
    
    // 性格特性ラベル
    TRAITS: {
        openness: '開放性',
        conscientiousness: '誠実性',
        extraversion: '外向性',
        agreeableness: '協調性',
        neuroticism: '神経症的傾向'
    },
    
    // 認知能力ラベル
    ABILITIES: {
        verbal_comprehension: '言語理解',
        perceptual_reasoning: '知覚推理',
        working_memory: 'ワーキングメモリ',
        processing_speed: '処理速度'
    },
    
    // 記憶タイプラベル
    MEMORY_TYPES: {
        episodic: 'エピソード記憶',
        semantic: '意味記憶',
        procedural: '手続き記憶',
        autobiographical: '自伝的記憶'
    }
};

/**
 * 説明テキスト
 */
window.UPPS_DESCRIPTIONS = {
    // 性格特性の説明
    TRAITS: {
        openness: '新しい経験や概念に対する好奇心や興味の度合い。芸術性、想像力、創造性に関連。',
        conscientiousness: '計画性、責任感、自己制御の度合い。組織化能力、几帳面さ、勤勉さに関連。',
        extraversion: '他者との交流を好む度合い。社交性、活動性、自己主張に関連。',
        agreeableness: '他者との協力や調和を好む度合い。共感性、信頼性、利他性に関連。',
        neuroticism: '情緒不安定性の度合い。不安、怒り、抑うつなどのネガティブ感情の経験しやすさに関連。'
    },
    
    // 認知能力の説明
    ABILITIES: {
        verbal_comprehension: '言語による情報の理解、処理、表現能力。言語的知識、語彙力、抽象的思考を含む。',
        perceptual_reasoning: '視覚的情報の分析、処理、解釈能力。空間認識、パターン認識、視覚的推論を含む。',
        working_memory: '情報を一時的に保持し、操作する能力。短期記憶、注意力、集中力を含む。',
        processing_speed: '簡単な視覚情報を素早く正確に処理する能力。認知的効率性と自動処理を含む。'
    },
    
    // 記憶タイプの説明
    MEMORY_TYPES: {
        episodic: '個人的な出来事や特定の経験に関する記憶。時間と場所の情報を含む。',
        semantic: '一般的な知識や概念に関する記憶。事実、言葉の意味、世界の理解を含む。',
        procedural: 'スキルやタスクの実行方法に関する記憶。自転車の乗り方など。', 
        autobiographical: '自己のライフストーリーを形成する重要な個人的記憶。アイデンティティに関連。'
    }
};

/**
 * タブ設定
 */
window.UPPS_TABS = [
    { id: 'basic', icon: 'user', label: '基本情報' },
    { id: 'emotion', icon: 'heart', label: '感情システム' },
    { id: 'personality', icon: 'brain', label: '性格特性' },
    { id: 'memory', icon: 'database', label: '記憶システム' },
    { id: 'association', icon: 'network', label: '関連性' },
    { id: 'cognitive', icon: 'activity', label: '認知能力' }
];

/**
 * グローバルなUPPSエディタインスタンス
 * 注意: この変数は app.js で初期化される
 */
window.uppsEditor = null;

/**
 * ラベル取得のヘルパー関数
 */
window.UPPS_HELPERS = {
    getEmotionLabel: (emotionId) => {
        return window.UPPS_LABELS.EMOTIONS[emotionId] || emotionId;
    },
    
    getEmotionIcon: (emotionId) => {
        return window.UPPS_LABELS.EMOTION_ICONS[emotionId] || 'circle';
    },
    
    getTraitLabel: (traitId) => {
        return window.UPPS_LABELS.TRAITS[traitId] || traitId;
    },
    
    getTraitDescription: (traitId) => {
        return window.UPPS_DESCRIPTIONS.TRAITS[traitId] || '';
    },
    
    getAbilityLabel: (abilityId) => {
        return window.UPPS_LABELS.ABILITIES[abilityId] || abilityId;
    },
    
    getAbilityDescription: (abilityId) => {
        return window.UPPS_DESCRIPTIONS.ABILITIES[abilityId] || '';
    },
    
    getMemoryTypeLabel: (typeId) => {
        return window.UPPS_LABELS.MEMORY_TYPES[typeId] || typeId;
    },
    
    getMemoryTypeDescription: (typeId) => {
        return window.UPPS_DESCRIPTIONS.MEMORY_TYPES[typeId] || '';
    }
};

/**
 * デバッグ用ログ関数
 */
window.UPPS_LOG = {
    info: (message, data = null) => {
        console.log(`[UPPS] ${message}`, data || '');
    },
    
    warn: (message, data = null) => {
        console.warn(`[UPPS] ${message}`, data || '');
    },
    
    error: (message, error = null) => {
        console.error(`[UPPS] ${message}`, error || '');
    },
    
    debug: (message, data = null) => {
        if (window.UPPS_CONFIG.DEBUG_MODE) {
            console.debug(`[UPPS] ${message}`, data || '');
        }
    }
};

// 初期化完了ログ
window.UPPS_LOG.info('Globals initialized');
