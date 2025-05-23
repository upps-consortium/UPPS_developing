// js/modules/association_system.js
// 関連性ネットワークシステムの管理

/**
 * 関連性システム管理クラス
 */
class AssociationSystemManager {
    constructor() {
        this.supportedTriggerTypes = ['memory', 'emotion', 'external', 'complex'];
        this.supportedResponseTypes = ['memory', 'emotion'];
        this.supportedOperators = ['AND', 'OR'];
        this.supportedExternalCategories = ['topics', 'environment', 'keywords'];
    }
    
    /**
     * 関連性システムの初期化
     * @param {Object} persona ペルソナデータ
     */
    initializeAssociationSystem(persona) {
        if (!persona.association_system) {
            persona.association_system = { associations: [] };
        }
        
        if (!Array.isArray(persona.association_system.associations)) {
            persona.association_system.associations = [];
        }
        
        // 既存の関連性のバリデーションと修正
        this.validateAndFixAssociations(persona);
        
        window.UPPS_LOG.info('Association system initialized', { 
            associationCount: persona.association_system.associations.length 
        });
    }
    
    /**
     * 新しい関連性を追加
     * @param {Object} persona ペルソナデータ
     * @param {Object} externalItems 外部トリガー用のフォームデータ
     * @returns {string} 追加された関連性のID
     */
    addAssociation(persona, externalItems = {}) {
        if (!persona.association_system) {
            this.initializeAssociationSystem(persona);
        }
        
        // 関連性IDの生成
        const id = this.generateUniqueAssociationId(persona);
        
        // 初期値の設定
        const triggerType = persona.memory_system?.memories?.length > 0 ? 'memory' : 'emotion';
        const triggerId = triggerType === 'memory' 
            ? persona.memory_system.memories[0]?.id || ''
            : Object.keys(persona.emotion_system?.emotions || {})[0] || '';
        
        const responseType = 'emotion';
        const responseId = Object.keys(persona.emotion_system?.emotions || {})[0] || '';
        
        // 新しい関連性を作成
        const newAssociation = {
            id,
            trigger: {
                type: triggerType,
                id: triggerId,
                threshold: triggerType === 'emotion' ? 70 : undefined
            },
            response: {
                type: responseType,
                id: responseId,
                association_strength: 50
            }
        };
        
        // 関連性を追加
        persona.association_system.associations.push(newAssociation);
        
        // 外部トリガー用のフォームデータを初期化
        const index = persona.association_system.associations.length - 1;
        externalItems[index] = '';
        
        window.UPPS_LOG.info('Association added', { id, triggerType, responseType });
        
        return id;
    }
    
    /**
     * 関連性を削除
     * @param {Object} persona ペルソナデータ
     * @param {number} index 削除する関連性のインデックス
     * @param {Object} externalItems 外部トリガー用のフォームデータ
     * @returns {boolean} 削除成功の可否
     */
    removeAssociation(persona, index, externalItems = {}) {
        if (!persona.association_system?.associations || 
            index < 0 || index >= persona.association_system.associations.length) {
            window.UPPS_LOG.warn('Cannot remove association: invalid index', { index });
            return false;
        }
        
        const associationId = persona.association_system.associations[index].id;
        
        // 関連性を削除
        persona.association_system.associations.splice(index, 1);
        
        // 外部トリガー用のフォームデータも削除
        delete externalItems[index];
        
        window.UPPS_LOG.info('Association removed', { associationId, index });
        
        return true;
    }
    
    /**
     * 複合条件を追加
     * @param {Object} persona ペルソナデータ
     * @param {number} index 関連性のインデックス
     */
    addComplexCondition(persona, index) {
        const association = persona.association_system.associations[index];
        if (!association) {
            window.UPPS_LOG.warn('Cannot add complex condition: association not found', { index });
            return;
        }
        
        if (!association.trigger.conditions) {
            association.trigger.conditions = [];
        }
        
        // 記憶がある場合は記憶条件、なければ感情条件をデフォルトで追加
        const newCondition = {
            type: persona.memory_system?.memories?.length > 0 ? 'memory' : 'emotion'
        };
        
        if (newCondition.type === 'memory') {
            newCondition.id = persona.memory_system.memories[0]?.id || '';
        } else {
            newCondition.id = Object.keys(persona.emotion_system?.emotions || {})[0] || '';
            newCondition.threshold = 70;
        }
        
        association.trigger.conditions.push(newCondition);
        
        window.UPPS_LOG.info('Complex condition added', { 
            associationIndex: index, 
            conditionType: newCondition.type 
        });
    }
    
    /**
     * 複合条件を削除
     * @param {Object} persona ペルソナデータ
     * @param {number} associationIndex 関連性のインデックス
     * @param {number} conditionIndex 条件のインデックス
     */
    removeComplexCondition(persona, associationIndex, conditionIndex) {
        const association = persona.association_system.associations[associationIndex];
        if (!association?.trigger?.conditions) {
            window.UPPS_LOG.warn('Cannot remove complex condition: not found', { associationIndex, conditionIndex });
            return;
        }
        
        if (conditionIndex < 0 || conditionIndex >= association.trigger.conditions.length) {
            window.UPPS_LOG.warn('Cannot remove complex condition: invalid index', { conditionIndex });
            return;
        }
        
        association.trigger.conditions.splice(conditionIndex, 1);
        
        // 条件が0になったら、デフォルトの条件を追加
        if (association.trigger.conditions.length === 0) {
            this.addComplexCondition(persona, associationIndex);
        }
        
        window.UPPS_LOG.info('Complex condition removed', { associationIndex, conditionIndex });
    }
    
    /**
     * 関連性オプションの更新
     * @param {Object} persona ペルソナデータ
     * @param {number} index 関連性のインデックス
     * @param {Object} externalItems 外部トリガー用のフォームデータ
     */
    updateAssociationOptions(persona, index, externalItems = {}) {
        const association = persona.association_system.associations[index];
        if (!association) {
            window.UPPS_LOG.warn('Cannot update association options: not found', { index });
            return;
        }
        
        // トリガータイプが変わった場合、デフォルト値を設定
        switch (association.trigger.type) {
            case 'memory':
                association.trigger.id = persona.memory_system?.memories?.[0]?.id || '';
                delete association.trigger.threshold;
                delete association.trigger.category;
                delete association.trigger.items;
                delete association.trigger.operator;
                delete association.trigger.conditions;
                break;
                
            case 'emotion':
                association.trigger.id = Object.keys(persona.emotion_system?.emotions || {})[0] || '';
                association.trigger.threshold = 50;
                delete association.trigger.category;
                delete association.trigger.items;
                delete association.trigger.operator;
                delete association.trigger.conditions;
                break;
                
            case 'external':
                association.trigger.category = 'topics';
                association.trigger.items = [];
                delete association.trigger.id;
                delete association.trigger.threshold;
                delete association.trigger.operator;
                delete association.trigger.conditions;
                externalItems[index] = '';
                break;
                
            case 'complex':
                association.trigger.operator = 'AND';
                association.trigger.conditions = [{
                    type: 'memory',
                    id: persona.memory_system?.memories?.[0]?.id || ''
                }];
                delete association.trigger.id;
                delete association.trigger.threshold;
                delete association.trigger.category;
                delete association.trigger.items;
                break;
        }
        
        window.UPPS_LOG.info('Association options updated', { 
            index, 
            triggerType: association.trigger.type 
        });
    }
    
    /**
     * 複合条件のタイプ変更時の更新
     * @param {Object} persona ペルソナデータ
     * @param {number} associationIndex 関連性のインデックス
     * @param {number} conditionIndex 条件のインデックス
     */
    updateComplexConditionType(persona, associationIndex, conditionIndex) {
        const association = persona.association_system.associations[associationIndex];
        const condition = association?.trigger?.conditions?.[conditionIndex];
        
        if (!condition) {
            window.UPPS_LOG.warn('Cannot update complex condition type: not found', { 
                associationIndex, 
                conditionIndex 
            });
            return;
        }
        
        // タイプに応じて必要なプロパティを設定
        switch (condition.type) {
            case 'emotion':
                condition.id = Object.keys(persona.emotion_system?.emotions || {})[0] || '';
                condition.threshold = 50;
                delete condition.category;
                delete condition.items;
                break;
                
            case 'memory':
                condition.id = persona.memory_system?.memories?.[0]?.id || '';
                delete condition.threshold;
                delete condition.category;
                delete condition.items;
                break;
                
            case 'external':
                condition.category = 'topics';
                condition.items = [];
                delete condition.id;
                delete condition.threshold;
                break;
        }
        
        window.UPPS_LOG.info('Complex condition type updated', { 
            associationIndex, 
            conditionIndex, 
            type: condition.type 
        });
    }
    
    /**
     * 外部トリガーのアイテム更新
     * @param {Object} persona ペルソナデータ
     * @param {number} index 関連性のインデックス
     * @param {Object} externalItems 外部トリガー用のフォームデータ
     */
    updateExternalItems(persona, index, externalItems) {
        const association = persona.association_system.associations[index];
        
        if (!association || association.trigger.type !== 'external') {
            return;
        }
        
        // カンマ区切りテキストを配列に変換
        const items = (externalItems[index] || '').split(',').map(item => item.trim()).filter(item => item);
        association.trigger.items = items;
        
        window.UPPS_LOG.debug('External trigger items updated', { index, items });
    }
    
    /**
     * 複合条件内の外部トリガーアイテム取得
     * @param {Object} persona ペルソナデータ
     * @param {number} associationIndex 関連性のインデックス
     * @param {number} conditionIndex 条件のインデックス
     * @returns {string} カンマ区切りのアイテム文字列
     */
    getExternalConditionItems(persona, associationIndex, conditionIndex) {
        const association = persona.association_system.associations[associationIndex];
        const condition = association?.trigger?.conditions?.[conditionIndex];
        
        if (!condition || condition.type !== 'external' || !condition.items) {
            return '';
        }
        
        return condition.items.join(', ');
    }
    
    /**
     * 複合条件内の外部トリガーアイテム更新
     * @param {Object} persona ペルソナデータ
     * @param {number} associationIndex 関連性のインデックス
     * @param {number} conditionIndex 条件のインデックス
     * @param {string} itemsText カンマ区切りのアイテム文字列
     */
    updateExternalConditionItems(persona, associationIndex, conditionIndex, itemsText) {
        const association = persona.association_system.associations[associationIndex];
        const condition = association?.trigger?.conditions?.[conditionIndex];
        
        if (!condition || condition.type !== 'external') {
            return;
        }
        
        // カンマ区切りテキストを配列に変換
        const items = itemsText.split(',').map(item => item.trim()).filter(item => item);
        condition.items = items;
        
        window.UPPS_LOG.debug('External condition items updated', { 
            associationIndex, 
            conditionIndex, 
            items 
        });
    }
    
    /**
     * 一意な関連性IDを生成
     * @param {Object} persona ペルソナデータ
     * @returns {string} 一意なID
     */
    generateUniqueAssociationId(persona) {
        const existingIds = new Set();
        
        if (persona.association_system?.associations) {
            persona.association_system.associations.forEach(assoc => {
                if (assoc.id) existingIds.add(assoc.id);
            });
        }
        
        let counter = 1;
        let candidateId;
        
        do {
            candidateId = `assoc_${counter}`;
            counter++;
        } while (existingIds.has(candidateId));
        
        return candidateId;
    }
    
    /**
     * 既存の関連性のバリデーションと修正
     * @param {Object} persona ペルソナデータ
     */
    validateAndFixAssociations(persona) {
        if (!persona.association_system?.associations) {
            return;
        }
        
        const seenIds = new Set();
        let fixedCount = 0;
        
        persona.association_system.associations.forEach((assoc, index) => {
            // IDの修正
            if (!assoc.id || seenIds.has(assoc.id)) {
                assoc.id = this.generateUniqueAssociationId(persona);
                fixedCount++;
            }
            seenIds.add(assoc.id);
            
            // トリガーの修正
            if (!assoc.trigger) {
                assoc.trigger = { type: 'emotion' };
                fixedCount++;
            }
            
            // レスポンスの修正
            if (!assoc.response) {
                assoc.response = { type: 'emotion', association_strength: 50 };
                fixedCount++;
            }
        });
        
        if (fixedCount > 0) {
            window.UPPS_LOG.info('Associations validated and fixed', { fixedCount });
        }
    }
    
    /**
     * IDで関連性を検索
     * @param {Object} persona ペルソナデータ
     * @param {string} associationId 関連性ID
     * @returns {Object|null} 関連性データまたはnull
     */
    findAssociationById(persona, associationId) {
        if (!persona.association_system?.associations) {
            return null;
        }
        
        return persona.association_system.associations.find(assoc => assoc.id === associationId) || null;
    }
    
    /**
     * 関連性システムのバリデーション
     * @param {Object} persona ペルソナデータ
     * @returns {Array} エラーリスト
     */
    validateAssociationSystem(persona) {
        const errors = [];
        
        if (!persona.association_system) {
            return errors; // 関連性システムはオプション
        }
        
        if (!Array.isArray(persona.association_system.associations)) {
            errors.push('関連性データが配列ではありません');
            return errors;
        }
        
        // 存在する記憶IDと感情IDを収集
        const memoryIds = new Set();
        const emotionIds = new Set();
        
        if (persona.memory_system?.memories) {
            persona.memory_system.memories.forEach(memory => memoryIds.add(memory.id));
        }
        
        if (persona.emotion_system?.emotions) {
            Object.keys(persona.emotion_system.emotions).forEach(id => emotionIds.add(id));
        }
        
        // 各関連性の検証
        persona.association_system.associations.forEach((assoc, index) => {
            const prefix = `関連性${index + 1}`;
            
            // ID チェック
            if (!assoc.id) {
                errors.push(`${prefix}: IDが設定されていません`);
            }
            
            // トリガーの検証
            if (!assoc.trigger) {
                errors.push(`${prefix}: トリガーが設定されていません`);
            } else {
                this.validateTrigger(assoc.trigger, memoryIds, emotionIds, errors, prefix);
            }
            
            // レスポンスの検証
            if (!assoc.response) {
                errors.push(`${prefix}: レスポンスが設定されていません`);
            } else {
                this.validateResponse(assoc.response, memoryIds, emotionIds, errors, prefix);
            }
        });
        
        return errors;
    }
    
    /**
     * トリガーのバリデーション
     * @param {Object} trigger トリガーデータ
     * @param {Set} memoryIds 有効な記憶ID
     * @param {Set} emotionIds 有効な感情ID
     * @param {Array} errors エラーリスト
     * @param {string} prefix エラーメッセージのプレフィックス
     */
    validateTrigger(trigger, memoryIds, emotionIds, errors, prefix) {
        if (!trigger.type) {
            errors.push(`${prefix}: トリガータイプが設定されていません`);
            return;
        }
        
        switch (trigger.type) {
            case 'memory':
                if (!trigger.id) {
                    errors.push(`${prefix}: トリガー記憶IDが設定されていません`);
                } else if (!memoryIds.has(trigger.id)) {
                    errors.push(`${prefix}: トリガー記憶ID "${trigger.id}" が存在しません`);
                }
                break;
                
            case 'emotion':
                if (!trigger.id) {
                    errors.push(`${prefix}: トリガー感情IDが設定されていません`);
                } else if (!emotionIds.has(trigger.id)) {
                    errors.push(`${prefix}: トリガー感情ID "${trigger.id}" が存在しません`);
                }
                
                if (trigger.threshold === undefined || trigger.threshold === null || 
                    isNaN(trigger.threshold) || trigger.threshold < 0 || trigger.threshold > 100) {
                    errors.push(`${prefix}: トリガー閾値は0〜100の範囲で設定してください`);
                }
                break;
                
            case 'external':
                if (!trigger.category) {
                    errors.push(`${prefix}: 外部トリガーカテゴリが設定されていません`);
                }
                break;
                
            case 'complex':
                if (!trigger.operator) {
                    errors.push(`${prefix}: 複合条件演算子が設定されていません`);
                }
                
                if (!trigger.conditions || !Array.isArray(trigger.conditions) || trigger.conditions.length === 0) {
                    errors.push(`${prefix}: 複合条件は少なくとも1つ必要です`);
                } else {
                    trigger.conditions.forEach((condition, condIndex) => {
                        this.validateComplexCondition(condition, memoryIds, emotionIds, errors, 
                                                    `${prefix}条件${condIndex + 1}`);
                    });
                }
                break;
        }
    }
    
    /**
     * レスポンスのバリデーション
     * @param {Object} response レスポンスデータ
     * @param {Set} memoryIds 有効な記憶ID
     * @param {Set} emotionIds 有効な感情ID
     * @param {Array} errors エラーリスト
     * @param {string} prefix エラーメッセージのプレフィックス
     */
    validateResponse(response, memoryIds, emotionIds, errors, prefix) {
        if (!response.type) {
            errors.push(`${prefix}: レスポンスタイプが設定されていません`);
            return;
        }
        
        switch (response.type) {
            case 'memory':
                if (!response.id) {
                    errors.push(`${prefix}: レスポンス記憶IDが設定されていません`);
                } else if (!memoryIds.has(response.id)) {
                    errors.push(`${prefix}: レスポンス記憶ID "${response.id}" が存在しません`);
                }
                break;
                
            case 'emotion':
                if (!response.id) {
                    errors.push(`${prefix}: レスポンス感情IDが設定されていません`);
                } else if (!emotionIds.has(response.id)) {
                    errors.push(`${prefix}: レスポンス感情ID "${response.id}" が存在しません`);
                }
                break;
        }
        
        if (response.association_strength === undefined || response.association_strength === null || 
            isNaN(response.association_strength) || 
            response.association_strength < 0 || response.association_strength > 100) {
            errors.push(`${prefix}: 関連強度は0〜100の範囲で設定してください`);
        }
    }
    
    /**
     * 複合条件のバリデーション
     * @param {Object} condition 条件データ
     * @param {Set} memoryIds 有効な記憶ID
     * @param {Set} emotionIds 有効な感情ID
     * @param {Array} errors エラーリスト
     * @param {string} prefix エラーメッセージのプレフィックス
     */
    validateComplexCondition(condition, memoryIds, emotionIds, errors, prefix) {
        if (!condition.type) {
            errors.push(`${prefix}: タイプが設定されていません`);
            return;
        }
        
        switch (condition.type) {
            case 'memory':
                if (!condition.id) {
                    errors.push(`${prefix}: 記憶IDが設定されていません`);
                } else if (!memoryIds.has(condition.id)) {
                    errors.push(`${prefix}: 記憶ID "${condition.id}" が存在しません`);
                }
                break;
                
            case 'emotion':
                if (!condition.id) {
                    errors.push(`${prefix}: 感情IDが設定されていません`);
                } else if (!emotionIds.has(condition.id)) {
                    errors.push(`${prefix}: 感情ID "${condition.id}" が存在しません`);
                }
                
                if (condition.threshold === undefined || condition.threshold === null || 
                    isNaN(condition.threshold) || condition.threshold < 0 || condition.threshold > 100) {
                    errors.push(`${prefix}: 閾値は0〜100の範囲で設定してください`);
                }
                break;
                
            case 'external':
                if (!condition.category) {
                    errors.push(`${prefix}: 外部カテゴリが設定されていません`);
                }
                break;
        }
    }
}

// グローバルインスタンスを作成
window.AssociationSystem = new AssociationSystemManager();

// UPPSEditorプロトタイプに関数を追加
if (typeof UPPSEditor !== 'undefined') {
    UPPSEditor.prototype.addAssociation = function() {
        const id = window.AssociationSystem.addAssociation(this.persona, this.externalItems);
        
        this.showNotification('関連性を追加しました', 'success');
        
        // ビジュアライザの更新
        if (this.visualEditorOpen && typeof this.refreshVisualizer === 'function') {
            this.refreshVisualizer();
        }
        
        return id;
    };
    
    UPPSEditor.prototype.removeAssociation = function(index) {
        if (confirm('この関連性を削除しますか？')) {
            const success = window.AssociationSystem.removeAssociation(this.persona, index, this.externalItems);
            
            if (success) {
                this.showNotification('関連性を削除しました', 'success');
                
                // ビジュアライザの更新
                if (this.visualEditorOpen && typeof this.refreshVisualizer === 'function') {
                    this.refreshVisualizer();
                }
            }
            
            return success;
        }
        
        return false;
    };
    
    UPPSEditor.prototype.addComplexCondition = function(index) {
        window.AssociationSystem.addComplexCondition(this.persona, index);
    };
    
    UPPSEditor.prototype.removeComplexCondition = function(associationIndex, conditionIndex) {
        window.AssociationSystem.removeComplexCondition(this.persona, associationIndex, conditionIndex);
    };
    
    UPPSEditor.prototype.updateAssociationOptions = function(index) {
        window.AssociationSystem.updateAssociationOptions(this.persona, index, this.externalItems);
    };
    
    UPPSEditor.prototype.updateComplexConditionType = function(associationIndex, conditionIndex) {
        window.AssociationSystem.updateComplexConditionType(this.persona, associationIndex, conditionIndex);
    };
    
    UPPSEditor.prototype.updateExternalItems = function(index) {
        window.AssociationSystem.updateExternalItems(this.persona, index, this.externalItems);
    };
    
    UPPSEditor.prototype.getExternalConditionItems = function(associationIndex, conditionIndex) {
        return window.AssociationSystem.getExternalConditionItems(this.persona, associationIndex, conditionIndex);
    };
    
    UPPSEditor.prototype.updateExternalConditionItems = function(associationIndex, conditionIndex, itemsText) {
        window.AssociationSystem.updateExternalConditionItems(this.persona, associationIndex, conditionIndex, itemsText);
    };
    
    UPPSEditor.prototype.findAssociationById = function(id) {
        return window.AssociationSystem.findAssociationById(this.persona, id);
    };
}

window.UPPS_LOG.info('Association system module initialized');
