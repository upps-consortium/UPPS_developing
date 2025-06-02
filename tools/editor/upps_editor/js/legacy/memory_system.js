// js/modules/memory_system.js
// 記憶システムの管理と操作

/**
 * 記憶システム管理クラス
 */
class MemorySystemManager {
    constructor() {
        this.supportedTypes = ['episodic', 'semantic', 'procedural', 'autobiographical'];
        this.idPattern = /^[a-zA-Z0-9_]+$/;
    }
    
    /**
     * 記憶システムの初期化
     * @param {Object} persona ペルソナデータ
     */
    initializeMemorySystem(persona) {
        if (!persona.memory_system) {
            persona.memory_system = { memories: [] };
        }
        
        if (!Array.isArray(persona.memory_system.memories)) {
            persona.memory_system.memories = [];
        }
        
        // 既存の記憶のIDチェックと修正
        this.validateAndFixMemoryIds(persona);
        
        window.UPPS_LOG.info('Memory system initialized', { 
            memoryCount: persona.memory_system.memories.length 
        });
    }
    
    /**
     * 新しい記憶を追加
     * @param {Object} persona ペルソナデータ
     * @param {Object} memoryData 記憶データ（オプション）
     * @returns {string} 追加された記憶のID
     */
    addMemory(persona, memoryData = null) {
        if (!persona.memory_system) {
            this.initializeMemorySystem(persona);
        }
        
        // 新しい記憶IDの生成
        const memoryId = this.generateUniqueMemoryId(persona);
        
        // デフォルトの記憶データ
        const defaultMemory = {
            id: memoryId,
            type: 'episodic',
            content: '',
            period: '',
            emotional_valence: 0.5
        };
        
        // カスタムデータがあればマージ
        const newMemory = memoryData ? { ...defaultMemory, ...memoryData, id: memoryId } : defaultMemory;
        
        // 記憶を追加
        persona.memory_system.memories.push(newMemory);
        
        window.UPPS_LOG.info('Memory added', { memoryId, type: newMemory.type });
        
        return memoryId;
    }
    
    /**
     * 記憶を削除
     * @param {Object} persona ペルソナデータ
     * @param {number} index 削除する記憶のインデックス
     * @returns {boolean} 削除成功の可否
     */
    removeMemory(persona, index) {
        if (!persona.memory_system?.memories || index < 0 || index >= persona.memory_system.memories.length) {
            window.UPPS_LOG.warn('Cannot remove memory: invalid index', { index });
            return false;
        }
        
        const memoryId = persona.memory_system.memories[index].id;
        
        // 関連する関連性を削除
        this.removeMemoryAssociations(persona, memoryId);
        
        // 記憶を削除
        persona.memory_system.memories.splice(index, 1);
        
        window.UPPS_LOG.info('Memory removed', { memoryId, index });
        
        // ビジュアライザの更新が必要ならフラグを設定
        if (window.uppsEditor?.visualEditorOpen) {
            window.uppsEditor.needsVisualizerRefresh = true;
        }
        
        return true;
    }
    
    /**
     * 記憶の内容を更新
     * @param {Object} persona ペルソナデータ
     * @param {string} memoryId 記憶ID
     * @param {Object} updates 更新内容
     * @returns {boolean} 更新成功の可否
     */
    updateMemory(persona, memoryId, updates) {
        const memory = this.getMemoryById(persona, memoryId);
        if (!memory) {
            window.UPPS_LOG.warn('Cannot update memory: not found', { memoryId });
            return false;
        }
        
        // 更新内容を適用
        Object.assign(memory, updates);
        
        // IDが変更された場合は関連性も更新
        if (updates.id && updates.id !== memoryId) {
            this.updateMemoryIdReferences(persona, memoryId, updates.id);
        }
        
        window.UPPS_LOG.info('Memory updated', { memoryId, updates });
        
        return true;
    }
    
    /**
     * IDで記憶を取得
     * @param {Object} persona ペルソナデータ
     * @param {string} memoryId 記憶ID
     * @returns {Object|null} 記憶データまたはnull
     */
    getMemoryById(persona, memoryId) {
        if (!persona.memory_system?.memories) {
            return null;
        }
        
        return persona.memory_system.memories.find(memory => memory.id === memoryId) || null;
    }
    
    /**
     * 記憶IDの更新と参照の修正
     * @param {Object} persona ペルソナデータ
     * @param {string} oldId 古いID
     * @param {string} newId 新しいID
     */
    updateMemoryIdReferences(persona, oldId, newId) {
        if (!oldId || !newId || oldId === newId) {
            return;
        }
        
        // IDの妥当性チェック
        if (!this.isValidMemoryId(newId)) {
            window.UPPS_LOG.warn('Invalid memory ID format', { newId });
            return;
        }
        
        // ID重複チェック
        if (this.getMemoryById(persona, newId)) {
            window.UPPS_LOG.warn('Memory ID already exists', { newId });
            return;
        }
        
        // 関連性ネットワーク内の参照を更新
        this.updateAssociationReferences(persona, oldId, newId);
        
        // ビジュアライザーの更新
        this.updateVisualizerReferences(oldId, newId);
        
        window.UPPS_LOG.info('Memory ID references updated', { oldId, newId });
    }
    
    /**
     * 記憶に関連する関連性を削除
     * @param {Object} persona ペルソナデータ
     * @param {string} memoryId 記憶ID
     */
    removeMemoryAssociations(persona, memoryId) {
        if (!persona.association_system?.associations) {
            return;
        }
        
        // 削除対象の関連性を特定
        const toRemove = [];
        
        persona.association_system.associations.forEach((assoc, index) => {
            // トリガーまたはレスポンスが記憶の場合
            const triggerIsMemory = assoc.trigger.type === 'memory' && assoc.trigger.id === memoryId;
            const responseIsMemory = assoc.response.type === 'memory' && assoc.response.id === memoryId;
            
            // 複合条件内の記憶も確認
            let complexTriggerContainsMemory = false;
            if (assoc.trigger.type === 'complex' && assoc.trigger.conditions) {
                complexTriggerContainsMemory = assoc.trigger.conditions.some(cond => 
                    cond.type === 'memory' && cond.id === memoryId
                );
            }
            
            // いずれかに該当する場合は削除対象
            if (triggerIsMemory || responseIsMemory || complexTriggerContainsMemory) {
                toRemove.push(index);
            }
        });
        
        // インデックスの大きい順に削除（配列の要素シフトを防ぐため）
        toRemove.reverse().forEach(index => {
            persona.association_system.associations.splice(index, 1);
        });
        
        if (toRemove.length > 0) {
            window.UPPS_LOG.info('Memory associations removed', { memoryId, count: toRemove.length });
        }
    }
    
    /**
     * 関連性システム内の記憶ID参照を更新
     * @param {Object} persona ペルソナデータ
     * @param {string} oldId 古いID
     * @param {string} newId 新しいID
     */
    updateAssociationReferences(persona, oldId, newId) {
        if (!persona.association_system?.associations) {
            return;
        }
        
        let updateCount = 0;
        
        persona.association_system.associations.forEach(assoc => {
            // トリガー側の更新
            if (assoc.trigger.type === 'memory' && assoc.trigger.id === oldId) {
                assoc.trigger.id = newId;
                updateCount++;
            }
            
            // 複合トリガー内の更新
            if (assoc.trigger.type === 'complex' && assoc.trigger.conditions) {
                assoc.trigger.conditions.forEach(cond => {
                    if (cond.type === 'memory' && cond.id === oldId) {
                        cond.id = newId;
                        updateCount++;
                    }
                });
            }
            
            // レスポンス側の更新
            if (assoc.response.type === 'memory' && assoc.response.id === oldId) {
                assoc.response.id = newId;
                updateCount++;
            }
        });
        
        if (updateCount > 0) {
            window.UPPS_LOG.info('Association references updated', { oldId, newId, updateCount });
        }
    }
    
    /**
     * ビジュアライザ内の記憶ID参照を更新
     * @param {string} oldId 古いID
     * @param {string} newId 新しいID
     */
    updateVisualizerReferences(oldId, newId) {
        const editor = window.uppsEditor;
        if (!editor?.networkVisualization) {
            return;
        }
        
        // ノードIDの更新
        editor.networkVisualization.nodes?.forEach(node => {
            if (node.type === 'memory' && node.memoryId === oldId) {
                node.memoryId = newId;
                node.id = `memory:${newId}`;
                node.name = newId;
            }
        });
        
        // リンクIDの更新
        editor.networkVisualization.links?.forEach(link => {
            const oldSourceId = `memory:${oldId}`;
            const newSourceId = `memory:${newId}`;
            const oldTargetId = `memory:${oldId}`;
            const newTargetId = `memory:${newId}`;
            
            if (link.source.id === oldSourceId) {
                link.source.id = newSourceId;
                link.id = link.id.replace(oldSourceId, newSourceId);
            }
            
            if (link.target.id === oldTargetId) {
                link.target.id = newTargetId;
                link.id = link.id.replace(oldTargetId, newTargetId);
            }
        });
        
        // DOM要素の更新
        try {
            d3.select(`#network-visualizer circle[data-id="memory:${oldId}"]`)
                .attr("data-id", `memory:${newId}`);
                
            d3.select(`#network-visualizer .label[data-id="memory:${oldId}"]`)
                .attr("data-id", `memory:${newId}`)
                .text(newId);
        } catch (error) {
            window.UPPS_LOG.debug('Error updating visualizer DOM elements', error);
        }
        
        window.UPPS_LOG.debug('Visualizer references updated', { oldId, newId });
    }
    
    /**
     * 一意な記憶IDを生成
     * @param {Object} persona ペルソナデータ
     * @returns {string} 一意なID
     */
    generateUniqueMemoryId(persona) {
        const existingIds = new Set();
        
        if (persona.memory_system?.memories) {
            persona.memory_system.memories.forEach(memory => {
                existingIds.add(memory.id);
            });
        }
        
        let counter = 1;
        let candidateId;
        
        do {
            candidateId = `memory_${counter}`;
            counter++;
        } while (existingIds.has(candidateId));
        
        return candidateId;
    }
    
    /**
     * 記憶IDの妥当性チェック
     * @param {string} id 記憶ID
     * @returns {boolean} 妥当かどうか
     */
    isValidMemoryId(id) {
        return typeof id === 'string' && 
               id.length > 0 && 
               id.length <= 50 && 
               this.idPattern.test(id);
    }
    
    /**
     * 記憶IDの重複チェックと修正
     * @param {Object} persona ペルソナデータ
     */
    validateAndFixMemoryIds(persona) {
        if (!persona.memory_system?.memories) {
            return;
        }
        
        const seenIds = new Set();
        const toFix = [];
        
        persona.memory_system.memories.forEach((memory, index) => {
            // IDが無効または重複している場合
            if (!this.isValidMemoryId(memory.id) || seenIds.has(memory.id)) {
                toFix.push(index);
            } else {
                seenIds.add(memory.id);
            }
        });
        
        // 問題のあるIDを修正
        toFix.forEach(index => {
            const oldId = persona.memory_system.memories[index].id;
            const newId = this.generateUniqueMemoryId(persona);
            
            persona.memory_system.memories[index].id = newId;
            seenIds.add(newId);
            
            // 関連性の参照も更新
            if (oldId && oldId !== newId) {
                this.updateAssociationReferences(persona, oldId, newId);
            }
            
            window.UPPS_LOG.warn('Memory ID fixed', { index, oldId, newId });
        });
        
        if (toFix.length > 0) {
            window.UPPS_LOG.info('Memory ID validation completed', { fixedCount: toFix.length });
        }
    }
    
    /**
     * 記憶システムのバリデーション
     * @param {Object} persona ペルソナデータ
     * @returns {Array} エラーリスト
     */
    validateMemorySystem(persona) {
        const errors = [];
        
        if (!persona.memory_system) {
            errors.push('記憶システムが定義されていません');
            return errors;
        }
        
        if (!Array.isArray(persona.memory_system.memories)) {
            errors.push('記憶データが配列ではありません');
            return errors;
        }
        
        const seenIds = new Set();
        
        persona.memory_system.memories.forEach((memory, index) => {
            const prefix = `記憶${index + 1}`;
            
            // ID チェック
            if (!memory.id) {
                errors.push(`${prefix}: IDが設定されていません`);
            } else if (!this.isValidMemoryId(memory.id)) {
                errors.push(`${prefix}: IDの形式が不正です (${memory.id})`);
            } else if (seenIds.has(memory.id)) {
                errors.push(`${prefix}: IDが重複しています (${memory.id})`);
            } else {
                seenIds.add(memory.id);
            }
            
            // タイプチェック
            if (!memory.type) {
                errors.push(`${prefix}: タイプが設定されていません`);
            } else if (!this.supportedTypes.includes(memory.type)) {
                errors.push(`${prefix}: サポートされていないタイプです (${memory.type})`);
            }
            
            // 内容チェック
            if (!memory.content || memory.content.trim() === '') {
                errors.push(`${prefix}: 内容が設定されていません`);
            } else if (memory.content.length > window.UPPS_CONFIG.VALIDATION.MAX_CONTENT_LENGTH) {
                errors.push(`${prefix}: 内容が長すぎます (${memory.content.length}文字)`);
            }
            
            // 感情的価値チェック
            if (memory.emotional_valence !== undefined) {
                const valence = parseFloat(memory.emotional_valence);
                if (isNaN(valence) || valence < 0 || valence > 1) {
                    errors.push(`${prefix}: 感情的価値は0〜1の範囲で設定してください`);
                }
            }
        });
        
        return errors;
    }
    
    /**
     * 記憶タイプの統計を取得
     * @param {Object} persona ペルソナデータ
     * @returns {Object} タイプ別統計
     */
    getMemoryTypeStats(persona) {
        const stats = {};
        this.supportedTypes.forEach(type => stats[type] = 0);
        
        if (persona.memory_system?.memories) {
            persona.memory_system.memories.forEach(memory => {
                if (stats.hasOwnProperty(memory.type)) {
                    stats[memory.type]++;
                }
            });
        }
        
        return stats;
    }
    
    /**
     * サポートされている記憶タイプを取得
     * @returns {Array} タイプリスト
     */
    getSupportedTypes() {
        return [...this.supportedTypes];
    }
}

// グローバルインスタンスを作成
window.MemorySystem = new MemorySystemManager();

// UPPSEditorプロトタイプに関数を追加
if (typeof UPPSEditor !== 'undefined') {
    UPPSEditor.prototype.addMemory = function() {
        const memoryId = window.MemorySystem.addMemory(this.persona);
        
        // 通知を表示
        this.showNotification('記憶を追加しました', 'success');
        
        return memoryId;
    };
    
    UPPSEditor.prototype.removeMemory = function(index) {
        // 削除前の確認
        if (confirm('この記憶を削除しますか？関連する関連性も削除されます。')) {
            const success = window.MemorySystem.removeMemory(this.persona, index);
            
            if (success) {
                this.showNotification('記憶を削除しました', 'success');
                
                // ビジュアライザの更新
                if (this.visualEditorOpen && typeof this.refreshVisualizer === 'function') {
                    this.refreshVisualizer();
                }
            } else {
                this.showNotification('記憶の削除に失敗しました', 'error');
            }
            
            return success;
        }
        
        return false;
    };
    
    UPPSEditor.prototype.updateMemoryId = function(oldId, newId) {
        window.MemorySystem.updateMemoryIdReferences(this.persona, oldId, newId);
        
        // ビジュアライザーの更新
        if (this.visualEditorOpen && typeof this.refreshVisualizer === 'function') {
            this.refreshVisualizer();
        }
    };
    
    UPPSEditor.prototype.getMemoryById = function(memoryId) {
        return window.MemorySystem.getMemoryById(this.persona, memoryId);
    };
}

window.UPPS_LOG.info('Memory system module initialized');
