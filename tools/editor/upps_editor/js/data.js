// data.js
// プロファイルデータの管理と初期化

// デフォルトプロファイルテンプレートを取得
function getDefaultProfile() {
    return {
        version: '2025.2',
        personal_info: {
            name: '',
            age: null,
            gender: '',
            occupation: ''
        },
        background: '',
        current_emotion_state: {
            joy: 50,
            sadness: 20,
            anger: 10,
            fear: 15,
            disgust: 5,
            surprise: 35
        },
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

// UPPSEditor オブジェクト上の初期化メソッド
function initializeProfile() {
    // デフォルトプロファイルをクローン
    this.profile = JSON.parse(JSON.stringify(getDefaultProfile()));
    
    // 感情モデルの初期化とトリガー
    this.handleEmotionModelChange();
    
    // 認知モデルの初期化
    this.handleCognitiveModelChange();
    
    console.log('Profile initialized with default values');
}

// 感情モデルに応じた初期化
function handleEmotionModelChange() {
    const model = this.profile.emotion_system.model;
    
    // Ekmanモデルの場合
    if (model === 'Ekman') {
        // すでに初期化されていれば何もしない
        if (this.profile.emotion_system.emotions && 
            this.profile.emotion_system.emotions.joy &&
            this.profile.emotion_system.emotions.sadness) {
            return;
        }
        
        // 基本6感情の初期化
        this.profile.emotion_system.emotions = {
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
        
        // 現在の感情状態も初期化
        this.profile.current_emotion_state = {
            joy: 50,
            sadness: 20,
            anger: 10,
            fear: 15,
            disgust: 5,
            surprise: 35
        };
    }
    
    // 他のモデル（Plutchik、PAD、カスタム）はまだ実装されていない
}

// 認知モデルに応じた初期化
function handleCognitiveModelChange() {
    const model = this.profile.cognitive_system.model;
    
    // WAIS-IVモデルの場合
    if (model === 'WAIS-IV') {
        // すでに初期化されていれば何もしない
        if (this.profile.cognitive_system.abilities && 
            this.profile.cognitive_system.abilities.verbal_comprehension) {
            return;
        }
        
        // 4つの主要能力の初期化
        this.profile.cognitive_system.abilities = {
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
        };
    }
    
    // 他のモデル（CHC、カスタム）はまだ実装されていない
}

// 感情状態をベースラインから同期
function syncEmotionState() {
    if (!this.profile.emotion_system || !this.profile.emotion_system.emotions) {
        return;
    }
    
    // ベースラインから現在の感情状態を設定
    const emotions = this.profile.emotion_system.emotions;
    this.profile.current_emotion_state = {};
    
    for (const [emotion, data] of Object.entries(emotions)) {
        // ベースラインを基準に、±20%の範囲でランダムな値を生成
        const min = Math.max(0, data.baseline - 20);
        const max = Math.min(100, data.baseline + 20);
        this.profile.current_emotion_state[emotion] = Math.floor(Math.random() * (max - min + 1)) + min;
    }
    
    console.log('Emotion state synchronized from baseline values');
}