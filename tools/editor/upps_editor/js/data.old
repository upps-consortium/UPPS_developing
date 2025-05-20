// data.js
// ペルソナデータの管理と初期化

// デフォルトペルソナテンプレートを取得
function getDefaultPersona() {
    return {
        version: '2025.2',
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

// UPPSEditor オブジェクト上の初期化メソッド
function initializePersona() {
    // デフォルトペルソナをクローン
    this.persona = JSON.parse(JSON.stringify(getDefaultPersona()));
    
    // 感情モデルの初期化とトリガー
    this.handleEmotionModelChange();
    
    // 認知モデルの初期化
    this.handleCognitiveModelChange();
    
    // 現在の感情状態をベースラインから初期化
    this.syncEmotionState();
    
    console.log('Persona initialized with default values');
}

// 感情モデルに応じた初期化
function handleEmotionModelChange() {
    const model = this.persona.emotion_system.model;
    
    // Ekmanモデルの場合
    if (model === 'Ekman') {
        // すでに初期化されていれば何もしない
        if (this.persona.emotion_system.emotions && 
            this.persona.emotion_system.emotions.joy &&
            this.persona.emotion_system.emotions.sadness) {
            return;
        }
        
        // 基本6感情の初期化
        this.persona.emotion_system.emotions = {
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
        
        // 感情状態を初期化
        this.syncEmotionState();
    }
    
    // 他のモデル（Plutchik、PAD、カスタム）はまだ実装されていない
}

// 認知モデルに応じた初期化
function handleCognitiveModelChange() {
    const model = this.persona.cognitive_system.model;
    
    // WAIS-IVモデルの場合
    if (model === 'WAIS-IV') {
        // すでに初期化されていれば何もしない
        if (this.persona.cognitive_system.abilities && 
            this.persona.cognitive_system.abilities.verbal_comprehension) {
            return;
        }
        
        // 4つの主要能力の初期化
        this.persona.cognitive_system.abilities = {
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
    if (!this.persona.emotion_system || !this.persona.emotion_system.emotions) {
        return;
    }
    
    // ベースラインから現在の感情状態を設定
    const emotions = this.persona.emotion_system.emotions;
    this.persona.current_emotion_state = {};
    
    for (const [emotion, data] of Object.entries(emotions)) {
        // ベースラインを基準に、±20%の範囲でランダムな値を生成
        const min = Math.max(0, data.baseline - 20);
        const max = Math.min(100, data.baseline + 20);
        this.persona.current_emotion_state[emotion] = Math.floor(Math.random() * (max - min + 1)) + min;
    }
    
    console.log('Emotion state synchronized from baseline values');
    
    // ビジュアライザが開かれている場合、ノードを更新
    if (this.visualEditorOpen && this.networkVisualization) {
        this.updateVisualizerFromEmotionState();
    }
}

// ビジュアライザの感情ノードを更新する
function updateVisualizerFromEmotionState() {
    if (!this.networkVisualization) return;
    
    // 感情ノードを見つけて更新
    this.networkVisualization.nodes.forEach(node => {
        if (node.type === 'emotion' && this.persona.current_emotion_state[node.emotionId]) {
            // 現在の感情値で更新
            node.value = this.persona.current_emotion_state[node.emotionId];
            
            // ノードの視覚的な更新
            d3.select(`#network-visualizer circle[data-id="${node.id}"]`)
                .attr("r", this.getNodeRadius(node))
                .attr("fill", this.getNodeColor(node));
        }
    });
}

// 認知能力表示を更新
function updateCognitiveAbilityDisplay(abilityId) {
    // レンジスライダーの更新
    const slider = document.querySelector(`[data-validation="ability_${abilityId}_level"]`);
    if (slider) {
        slider.value = this.persona.cognitive_system.abilities[abilityId].level;
        slider.style.setProperty('--value', slider.value);
    }
    
    // テキスト表示の更新
    const valueDisplay = document.querySelector(`[data-ability-value="${abilityId}"]`);
    if (valueDisplay) {
        valueDisplay.textContent = this.persona.cognitive_system.abilities[abilityId].level + '%';
    }
}

// ペルソナデータの認知能力値を更新
function updateCognitiveAbility(axisName, value) {
    // 軸名から能力IDを取得
    const abilityMap = {
        "言語理解": "verbal_comprehension",
        "知覚推理": "perceptual_reasoning",
        "ワーキングメモリ": "working_memory",
        "処理速度": "processing_speed"
    };
    
    const abilityId = abilityMap[axisName];
    if (!abilityId) return;
    
    // ペルソナデータを更新
    this.persona.cognitive_system.abilities[abilityId].level = Math.round(value);
    
    // UI表示も更新
    this.updateCognitiveAbilityDisplay(abilityId);
}
