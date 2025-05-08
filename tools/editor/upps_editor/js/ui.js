// ui.js
// UIコンポーネントとインタラクションの管理

// 感情名のラベル取得
function getEmotionLabel(emotion) {
    const labels = {
        joy: '喜び',
        sadness: '悲しみ',
        anger: '怒り',
        fear: '恐怖',
        disgust: '嫌悪',
        surprise: '驚き',
        // Plutchikモデル用
        trust: '信頼',
        anticipation: '期待',
        // PADモデル用
        pleasure: '快-不快',
        arousal: '覚醒-睡眠',
        dominance: '支配-服従'
    };
    
    return labels[emotion] || emotion;
}

// 感情に対応するアイコン取得
function getEmotionIcon(emotion) {
    const icons = {
        joy: 'smile',
        sadness: 'frown',
        anger: 'flame',
        fear: 'alert-triangle',
        disgust: 'x-octagon',
        surprise: 'zap',
        // Plutchikモデル用
        trust: 'shield',
        anticipation: 'eye'
    };
    
    return icons[emotion] || 'circle';
}

// 性格特性のラベル取得
function getTraitLabel(trait) {
    const labels = {
        openness: '開放性',
        conscientiousness: '誠実性',
        extraversion: '外向性',
        agreeableness: '協調性',
        neuroticism: '神経症的傾向'
    };
    
    return labels[trait] || trait;
}

// 性格特性の説明取得
function getTraitDescription(trait) {
    const descriptions = {
        openness: '新しい経験や概念に対する受容性と好奇心の高さを示します。',
        conscientiousness: '計画性、責任感、目標達成への取り組み方を示します。',
        extraversion: '社交性、エネルギー、外部刺激への志向性を示します。',
        agreeableness: '協力性、思いやり、他者との調和を重視する傾向を示します。',
        neuroticism: '感情的な不安定さ、ストレスへの敏感さを示します。'
    };
    
    return descriptions[trait] || '';
}

// 認知能力のラベル取得
function getAbilityLabel(ability) {
    const labels = {
        verbal_comprehension: '言語理解',
        perceptual_reasoning: '知覚推理',
        working_memory: 'ワーキングメモリ',
        processing_speed: '処理速度'
    };
    
    return labels[ability] || ability;
}

// 記憶を追加
function addMemory() {
    if (!this.profile.memory_system) {
        this.profile.memory_system = { memories: [] };
    }
    
    if (!this.profile.memory_system.memories) {
        this.profile.memory_system.memories = [];
    }
    
    // 新しい記憶を作成して追加
    const newId = `memory_${this.profile.memory_system.memories.length + 1}`;
    
    this.profile.memory_system.memories.push({
        id: newId,
        type: 'episodic',
        content: '',
        period: '',
        emotional_valence: 0.5
    });
    
    console.log('New memory added:', newId);
}

// 記憶を削除
function removeMemory(index) {
    if (!this.profile.memory_system || !this.profile.memory_system.memories) {
        return;
    }
    
    // 関連性に参照されているか確認
    const memoryId = this.profile.memory_system.memories[index].id;
    
    if (this.profile.association_system && this.profile.association_system.associations) {
        const isReferenced = this.profile.association_system.associations.some(assoc => 
            (assoc.trigger.type === 'memory' && assoc.trigger.id === memoryId) || 
            (assoc.response.type === 'memory' && assoc.response.id === memoryId)
        );
        
        if (isReferenced) {
            if (!confirm('この記憶は関連性ネットワークで参照されています。削除してもよろしいですか？')) {
                return;
            }
            
            // 関連する関連性も削除
            this.profile.association_system.associations = this.profile.association_system.associations.filter(assoc => 
                !(assoc.trigger.type === 'memory' && assoc.trigger.id === memoryId) && 
                !(assoc.response.type === 'memory' && assoc.response.id === memoryId)
            );
        }
    }
    
    // 記憶を削除
    this.profile.memory_system.memories.splice(index, 1);
    
    console.log('Memory removed:', memoryId);
}

// 関連性を追加
function addAssociation() {
    if (!this.profile.association_system) {
        this.profile.association_system = { associations: [] };
    }
    
    if (!this.profile.association_system.associations) {
        this.profile.association_system.associations = [];
    }
    
    // 新しい関連性を作成して追加
    const newIndex = this.profile.association_system.associations.length;
    const newId = `assoc_${newIndex + 1}`;
    
    this.profile.association_system.associations.push({
        id: newId,
        trigger: {
            type: 'memory',
            id: ''
        },
        response: {
            type: 'emotion',
            id: '',
            association_strength: 50
        }
    });
    
    // 外部アイテム保存用の配列を初期化
    if (!this.externalItems) {
        this.externalItems = {};
    }
    this.externalItems[newIndex] = '';
    
    console.log('New association added:', newId);
}

// 関連性を削除
function removeAssociation(index) {
    if (!this.profile.association_system || !this.profile.association_system.associations) {
        return;
    }
    
    // 関連性を削除
    this.profile.association_system.associations.splice(index, 1);
    
    // 外部アイテム配列も更新
    const newExternalItems = {};
    for (let i = 0; i < this.profile.association_system.associations.length; i++) {
        if (i >= index) {
            newExternalItems[i] = this.externalItems[i + 1] || '';
        } else {
            newExternalItems[i] = this.externalItems[i] || '';
        }
    }
    this.externalItems = newExternalItems;
    
    console.log('Association removed at index:', index);
}

// 複合条件を追加
function addComplexCondition(index) {
    const association = this.profile.association_system.associations[index];
    
    if (!association.trigger.conditions) {
        association.trigger.conditions = [];
    }
    
    // 新しい条件を追加
    association.trigger.conditions.push({
        type: 'memory',
        id: ''
    });
    
    console.log('Complex condition added to association:', association.id);
}

// 複合条件を削除
function removeComplexCondition(associationIndex, conditionIndex) {
    const association = this.profile.association_system.associations[associationIndex];
    
    if (!association.trigger.conditions) {
        return;
    }
    
    // 条件を削除
    association.trigger.conditions.splice(conditionIndex, 1);
    
    console.log('Complex condition removed from association:', association.id);
}

// 複合条件のタイプ変更時の更新
function updateComplexConditionType(associationIndex, conditionIndex) {
    const association = this.profile.association_system.associations[associationIndex];
    const condition = association.trigger.conditions[conditionIndex];
    
    // タイプに応じて必要なプロパティを設定
    if (condition.type === 'emotion') {
        condition.id = Object.keys(this.profile.emotion_system.emotions)[0] || '';
        condition.threshold = 50;
    } else if (condition.type === 'memory') {
        condition.id = this.profile.memory_system.memories[0]?.id || '';
        delete condition.threshold;
    } else if (condition.type === 'external') {
        condition.category = 'topics';
        condition.items = [];
    }
    
    console.log('Complex condition type updated:', condition.type);
}

// 外部トリガーのアイテム更新（カンマ区切りテキストから配列へ）
function updateExternalItems(index) {
    const association = this.profile.association_system.associations[index];
    
    if (association.trigger.type !== 'external') {
        return;
    }
    
    // カンマ区切りテキストを配列に変換
    const items = this.externalItems[index].split(',').map(item => item.trim()).filter(item => item);
    association.trigger.items = items;
    
    console.log('External trigger items updated:', items);
}

// 複合条件内の外部トリガーアイテム取得
function getExternalConditionItems(associationIndex, conditionIndex) {
    const association = this.profile.association_system.associations[associationIndex];
    const condition = association.trigger.conditions[conditionIndex];
    
    if (condition.type !== 'external' || !condition.items) {
        return '';
    }
    
    return condition.items.join(', ');
}

// 複合条件内の外部トリガーアイテム更新
function updateExternalConditionItems(associationIndex, conditionIndex, event) {
    const association = this.profile.association_system.associations[associationIndex];
    const condition = association.trigger.conditions[conditionIndex];
    
    if (condition.type !== 'external') {
        return;
    }
    
    // カンマ区切りテキストを配列に変換
    const items = event.target.value.split(',').map(item => item.trim()).filter(item => item);
    condition.items = items;
    
    console.log('External condition items updated:', items);
}

// 関連性オプションの更新
function updateAssociationOptions(index) {
    const association = this.profile.association_system.associations[index];
    
    // トリガータイプが変わった場合、デフォルト値を設定
    if (association.trigger.type === 'memory') {
        association.trigger.id = this.profile.memory_system.memories[0]?.id || '';
        delete association.trigger.threshold;
        delete association.trigger.category;
        delete association.trigger.items;
    } else if (association.trigger.type === 'emotion') {
        association.trigger.id = Object.keys(this.profile.emotion_system.emotions)[0] || '';
        association.trigger.threshold = 50;
        delete association.trigger.category;
        delete association.trigger.items;
    } else if (association.trigger.type === 'external') {
        association.trigger.category = 'topics';
        association.trigger.items = [];
        delete association.trigger.id;
        delete association.trigger.threshold;
        this.externalItems[index] = '';
    } else if (association.trigger.type === 'complex') {
        association.trigger.operator = 'AND';
        association.trigger.conditions = [{
            type: 'memory',
            id: this.profile.memory_system.memories[0]?.id || ''
        }];
        delete association.trigger.id;
        delete association.trigger.threshold;
        delete association.trigger.category;
        delete association.trigger.items;
    }
    
    console.log('Association options updated for trigger type:', association.trigger.type);
}