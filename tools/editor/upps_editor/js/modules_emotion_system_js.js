// js/modules/emotion_system.js
// 感情システムの管理とモデル処理

/**
 * 感情システム管理クラス
 */
class EmotionSystemManager {
    constructor() {
        this.supportedModels = ['Ekman', 'Plutchik', 'PAD', 'Custom'];
        this.currentModel = 'Ekman';
    }
    
    /**
     * 感情モデルに応じた初期化
     * @param {Object} persona ペルソナデータ
     * @param {string} model 感情モデル名
     */
    initializeEmotionModel(persona, model = null) {
        const targetModel = model || persona?.emotion_system?.model || 'Ekman';
        
        window.UPPS_LOG.info('Initializing emotion model', { model: targetModel });
        
        // モデルに応じた初期化
        switch (targetModel) {
            case 'Ekman':
                this.initializeEkmanModel(persona);
                break;
            case 'Plutchik':
                this.initializePlutchikModel(persona);
                break;
            case 'PAD':
                this.initializePADModel(persona);
                break;
            case 'Custom':
                this.initializeCustomModel(persona);
                break;
            default:
                window.UPPS_LOG.warn('Unknown emotion model, using Ekman', { model: targetModel });
                this.initializeEkmanModel(persona);
        }
        
        this.currentModel = targetModel;
        
        // 感情状態を初期化
        this.syncEmotionState(persona);
    }
    
    /**
     * Ekmanモデル（6基本感情）の初期化
     * @param {Object} persona ペルソナデータ
     */
    initializeEkmanModel(persona) {
        // すでに適切に初期化されていれば何もしない
        if (persona.emotion_system.emotions && 
            persona.emotion_system.emotions.joy &&
            persona.emotion_system.emotions.sadness) {
            return;
        }
        
        // 基本6感情の初期化
        persona.emotion_system.emotions = {
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
        };
        
        window.UPPS_LOG.info('Ekman emotion model initialized');
    }
    
    /**
     * Plutchikモデルの初期化（未実装）
     * @param {Object} persona ペルソナデータ
     */
    initializePlutchikModel(persona) {
        window.UPPS_LOG.warn('Plutchik model not yet implemented');
        // 将来の実装用プレースホルダー
        this.initializeEkmanModel(persona); // フォールバック
    }
    
    /**
     * PADモデルの初期化（未実装）
     * @param {Object} persona ペルソナデータ
     */
    initializePADModel(persona) {
        window.UPPS_LOG.warn('PAD model not yet implemented');
        // 将来の実装用プレースホルダー
        this.initializeEkmanModel(persona); // フォールバック
    }
    
    /**
     * カスタムモデルの初期化（未実装）
     * @param {Object} persona ペルソナデータ
     */
    initializeCustomModel(persona) {
        window.UPPS_LOG.warn('Custom model not yet implemented');
        // 将来の実装用プレースホルダー
        this.initializeEkmanModel(persona); // フォールバック
    }
    
    /**
     * 感情状態をベースラインから同期
     * @param {Object} persona ペルソナデータ
     */
    syncEmotionState(persona) {
        if (!persona || !persona.emotion_system || !persona.emotion_system.emotions) {
            window.UPPS_LOG.warn('Cannot sync emotion state: emotion system not initialized');
            return;
        }
        
        // ベースラインから現在の感情状態を設定
        const emotions = persona.emotion_system.emotions;
        persona.current_emotion_state = {};
        
        for (const [emotion, data] of Object.entries(emotions)) {
            // ベースラインを基準に、±20%の範囲でランダムな値を生成
            const min = Math.max(0, data.baseline - 20);
            const max = Math.min(100, data.baseline + 20);
            persona.current_emotion_state[emotion] = Math.floor(Math.random() * (max - min + 1)) + min;
        }
        
        window.UPPS_LOG.info('Emotion state synchronized from baseline values');
        
        // ビジュアライザが開かれている場合、ノードを更新
        if (window.uppsEditor?.visualEditorOpen && window.uppsEditor?.networkVisualization) {
            this.updateVisualizerFromEmotionState(persona);
        }
    }
    
    /**
     * ビジュアライザの感情ノードを更新する
     * @param {Object} persona ペルソナデータ
     */
    updateVisualizerFromEmotionState(persona) {
        const editor = window.uppsEditor;
        if (!editor?.networkVisualization) return;
        
        // 感情ノードを見つけて更新
        editor.networkVisualization.nodes.forEach(node => {
            if (node.type === 'emotion' && persona.current_emotion_state[node.emotionId]) {
                // 現在の感情値で更新
                node.value = persona.current_emotion_state[node.emotionId];
                
                // ノードの視覚的な更新
                try {
                    d3.select(`#network-visualizer circle[data-id="${node.id}"]`)
                        .attr("r", this.getNodeRadius(node))
                        .attr("fill", this.getNodeColor(node));
                } catch (error) {
                    window.UPPS_LOG.warn('Error updating visualizer nodes', error);
                }
            }
        });
        
        window.UPPS_LOG.debug('Visualizer nodes updated from emotion state');
    }
    
    /**
     * ノードの半径を計算
     * @param {Object} node ノードデータ
     * @returns {number} 半径
     */
    getNodeRadius(node) {
        if (node.type !== 'emotion') return window.UPPS_CONFIG.VISUALIZER.NODE_RADIUS.DEFAULT;
        
        const value = node.value || 50;
        const min = window.UPPS_CONFIG.VISUALIZER.NODE_RADIUS.MIN;
        const max = window.UPPS_CONFIG.VISUALIZER.NODE_RADIUS.MAX;
        
        return min + (max - min) * (value / 100);
    }
    
    /**
     * ノードの色を取得
     * @param {Object} node ノードデータ
     * @returns {string} 色コード
     */
    getNodeColor(node) {
        if (node.type !== 'emotion') return '#6B7280';
        
        const value = node.value || 50;
        
        // 値に応じて色の濃さを調整
        const intensity = value / 100;
        const baseColor = '#4F46E5'; // インディゴ
        
        // RGB値を計算（簡易実装）
        const alpha = 0.3 + (intensity * 0.7);
        return `rgba(79, 70, 229, ${alpha})`;
    }
    
    /**
     * 感情ベースライン値を更新
     * @param {Object} persona ペルソナデータ
     * @param {string} emotionId 感情ID
     * @param {number} newBaseline 新しいベースライン値
     */
    updateEmotionBaseline(persona, emotionId, newBaseline) {
        if (!persona.emotion_system?.emotions?.[emotionId]) {
            window.UPPS_LOG.warn('Cannot update baseline: emotion not found', { emotionId });
            return false;
        }
        
        // 値の範囲チェック
        const clampedValue = Math.max(0, Math.min(100, newBaseline));
        
        // ベースライン値を更新
        persona.emotion_system.emotions[emotionId].baseline = clampedValue;
        
        // 現在の感情状態も調整（オプション）
        if (persona.current_emotion_state?.[emotionId]) {
            const currentDiff = persona.current_emotion_state[emotionId] - 
                               (persona.emotion_system.emotions[emotionId].baseline || 50);
            persona.current_emotion_state[emotionId] = Math.max(0, Math.min(100, clampedValue + currentDiff));
        }
        
        window.UPPS_LOG.info('Emotion baseline updated', { emotionId, newBaseline: clampedValue });
        
        return true;
    }
    
    /**
     * 現在の感情状態を更新
     * @param {Object} persona ペルソナデータ
     * @param {string} emotionId 感情ID
     * @param {number} newValue 新しい値
     */
    updateCurrentEmotionState(persona, emotionId, newValue) {
        if (!persona.current_emotion_state) {
            persona.current_emotion_state = {};
        }
        
        // 値の範囲チェック
        const clampedValue = Math.max(0, Math.min(100, newValue));
        
        persona.current_emotion_state[emotionId] = clampedValue;
        
        window.UPPS_LOG.debug('Current emotion state updated', { emotionId, newValue: clampedValue });
        
        return true;
    }
    
    /**
     * 感情システムのバリデーション
     * @param {Object} persona ペルソナデータ
     * @returns {Array} エラーリスト
     */
    validateEmotionSystem(persona) {
        const errors = [];
        
        if (!persona.emotion_system) {
            errors.push('感情システムが定義されていません');
            return errors;
        }
        
        if (!persona.emotion_system.model) {
            errors.push('感情モデルが指定されていません');
        }
        
        if (!this.supportedModels.includes(persona.emotion_system.model)) {
            errors.push(`サポートされていない感情モデルです: ${persona.emotion_system.model}`);
        }
        
        // Ekmanモデルの場合の詳細バリデーション
        if (persona.emotion_system.model === 'Ekman') {
            const requiredEmotions = ['joy', 'sadness', 'anger', 'fear', 'disgust', 'surprise'];
            
            if (!persona.emotion_system.emotions) {
                errors.push('感情データが定義されていません');
            } else {
                for (const emotion of requiredEmotions) {
                    if (!persona.emotion_system.emotions[emotion]) {
                        errors.push(`必須感情が不足しています: ${window.UPPS_HELPERS.getEmotionLabel(emotion)}`);
                    } else {
                        const baseline = persona.emotion_system.emotions[emotion].baseline;
                        if (baseline === undefined || baseline === null || 
                            isNaN(baseline) || baseline < 0 || baseline > 100) {
                            errors.push(`${window.UPPS_HELPERS.getEmotionLabel(emotion)}のベースライン値が不正です`);
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
     * 現在のモデルを取得
     * @returns {string} 現在のモデル名
     */
    getCurrentModel() {
        return this.currentModel;
    }
}

// グローバルインスタンスを作成
window.EmotionSystem = new EmotionSystemManager();

// UPPSEditorプロトタイプに関数を追加
if (typeof UPPSEditor !== 'undefined') {
    UPPSEditor.prototype.handleEmotionModelChange = function() {
        window.EmotionSystem.initializeEmotionModel(this.persona);
    };
    
    UPPSEditor.prototype.syncEmotionState = function() {
        window.EmotionSystem.syncEmotionState(this.persona);
    };
    
    UPPSEditor.prototype.updateVisualizerFromEmotionState = function() {
        window.EmotionSystem.updateVisualizerFromEmotionState(this.persona);
    };
    
    UPPSEditor.prototype.updateEmotionBaseline = function(emotionId, newBaseline) {
        return window.EmotionSystem.updateEmotionBaseline(this.persona, emotionId, newBaseline);
    };
    
    UPPSEditor.prototype.updateCurrentEmotionState = function(emotionId, newValue) {
        return window.EmotionSystem.updateCurrentEmotionState(this.persona, emotionId, newValue);
    };
}

window.UPPS_LOG.info('Emotion system module initialized');

        