// js/visualizer/node_editor.js
// ビジュアライザのノード編集パネル管理

/**
 * ノードエディタ管理クラス
 */
class NodeEditorManager {
    constructor() {
        this.currentNode = null;
        this.currentNodeType = null;
        this.currentNodeData = null;
        this.isOpen = false;
    }
    
    /**
     * ノードエディタを開く
     * @param {Object} node 選択されたノード
     * @param {string} nodeType ノードタイプ ('emotion', 'memory', 'complex', 'link')
     * @param {Object} nodeData ノードの詳細データ
     */
    openNodeEditor(node, nodeType, nodeData) {
        this.currentNode = node;
        this.currentNodeType = nodeType;
        this.currentNodeData = nodeData;
        this.isOpen = true;
        
        // UPPSEditorの状態を更新
        if (window.uppsEditor) {
            window.uppsEditor.selectedNode = node;
            window.uppsEditor.selectedNodeType = nodeType;
            window.uppsEditor.selectedNodeData = nodeData;
        }
        
        window.UPPS_LOG.info('Node editor opened', { nodeType, nodeId: node?.id });
        
        // エディタパネルの表示を更新
        this.updateEditorPanel();
    }
    
    /**
     * ノードエディタを閉じる
     */
    closeNodeEditor() {
        this.currentNode = null;
        this.currentNodeType = null;
        this.currentNodeData = null;
        this.isOpen = false;
        
        // UPPSEditorの状態をクリア
        if (window.uppsEditor) {
            window.uppsEditor.selectedNode = null;
            window.uppsEditor.selectedNodeType = null;
            window.uppsEditor.selectedNodeData = null;
        }
        
        window.UPPS_LOG.debug('Node editor closed');
    }
    
    /**
     * 選択したノードのタイトルを取得
     * @returns {string} ノードタイトル
     */
    getSelectedNodeTitle() {
        if (!this.currentNode) return '';
        
        switch (this.currentNodeType) {
            case 'emotion':
                return `感情: ${window.UPPS_HELPERS.getEmotionLabel(this.currentNodeData.emotionId)}`;
            case 'memory':
                return `記憶: ${this.currentNodeData.memoryId}`;
            case 'complex':
                return `複合条件: ${this.currentNodeData.operator}`;
            case 'link':
                return '関連性';
            default:
                return 'ノード';
        }
    }
    
    /**
     * エディタパネルの表示を更新
     */
    updateEditorPanel() {
        // Alpine.jsの反応性に依存するため、状態変更のみ行う
        // 実際のDOM更新はAlpine.jsテンプレートが処理
        window.UPPS_LOG.debug('Editor panel updated');
    }
    
    /**
     * 感情ノードのベースライン値を更新
     */
    updateEmotionBaseline() {
        if (this.currentNodeType !== 'emotion' || !this.currentNodeData) {
            return;
        }
        
        const emotionId = this.currentNodeData.emotionId;
        const editor = window.uppsEditor;
        
        if (!editor?.persona?.emotion_system?.emotions?.[emotionId]) {
            window.UPPS_LOG.warn('Cannot update emotion baseline: emotion not found', { emotionId });
            return;
        }
        
        // ノードの視覚的な更新
        try {
            const nodeElement = d3.select(`#network-visualizer circle[data-id="${this.currentNodeData.id}"]`);
            if (!nodeElement.empty()) {
                nodeElement.attr("r", this.getNodeRadius(this.currentNodeData));
            }
        } catch (error) {
            window.UPPS_LOG.warn('Error updating emotion baseline visualization', error);
        }
        
        // 関連するリンクも更新
        this.updateAffectedLinks(this.currentNodeData);
        
        window.UPPS_LOG.debug('Emotion baseline updated', { emotionId });
    }
    
    /**
     * リンクの強度を更新
     */
    updateLinkStrength() {
        if (this.currentNodeType !== 'link' || !this.currentNodeData) {
            return;
        }
        
        // リンクの視覚的な更新
        try {
            const linkElement = d3.select(`#network-visualizer line[data-id="${this.currentNodeData.id}"]`);
            if (!linkElement.empty()) {
                linkElement.attr("stroke-width", Math.max(1, this.currentNodeData.strength / 20));
            }
        } catch (error) {
            window.UPPS_LOG.warn('Error updating link strength visualization', error);
        }
        
        // 関連性データも更新
        this.updateAssociationStrength();
        
        window.UPPS_LOG.debug('Link strength updated', { 
            linkId: this.currentNodeData.id, 
            strength: this.currentNodeData.strength 
        });
    }
    
    /**
     * 関連性データの強度を更新
     */
    updateAssociationStrength() {
        const editor = window.uppsEditor;
        if (!editor?.persona?.association_system?.associations) {
            return;
        }
        
        // 対応する関連性を検索して更新
        const assocIndex = editor.persona.association_system.associations.findIndex(assoc => {
            return this.matchesAssociation(assoc, this.currentNodeData);
        });
        
        if (assocIndex >= 0) {
            editor.persona.association_system.associations[assocIndex].response.association_strength = 
                this.currentNodeData.strength;
            
            window.UPPS_LOG.debug('Association strength updated in data', { 
                assocIndex, 
                strength: this.currentNodeData.strength 
            });
        }
    }
    
    /**
     * 関連性がリンクデータと一致するかチェック
     * @param {Object} assoc 関連性データ
     * @param {Object} linkData リンクデータ
     * @returns {boolean} 一致するかどうか
     */
    matchesAssociation(assoc, linkData) {
        // トリガーとレスポンスのタイプとIDが一致するか確認
        const triggerMatches = (
            (assoc.trigger.type === linkData.source.type) &&
            (assoc.trigger.type === 'memory' ? assoc.trigger.id === linkData.source.memoryId :
             assoc.trigger.type === 'emotion' ? assoc.trigger.id === linkData.source.emotionId :
             assoc.trigger.type === 'complex')
        );
        
        const responseMatches = (
            (assoc.response.type === linkData.target.type) &&
            (assoc.response.type === 'memory' ? assoc.response.id === linkData.target.memoryId :
             assoc.response.type === 'emotion' ? assoc.response.id === linkData.target.emotionId : false)
        );
        
        return triggerMatches && responseMatches;
    }
    
    /**
     * 関連するリンクを更新
     * @param {Object} nodeData ノードデータ
     */
    updateAffectedLinks(nodeData) {
        const editor = window.uppsEditor;
        if (!editor?.networkVisualization) {
            return;
        }
        
        // このノードに関連するリンクを検索
        const affectedLinks = editor.networkVisualization.links?.filter(link => 
            link.source.id === nodeData.id || link.target.id === nodeData.id
        ) || [];
        
        // 各リンクの視覚的な更新
        affectedLinks.forEach(link => {
            try {
                d3.select(`#network-visualizer line[data-id="${link.id}"]`)
                    .attr("stroke-width", Math.max(1, link.strength / 20));
            } catch (error) {
                window.UPPS_LOG.debug('Error updating affected link', { linkId: link.id, error });
            }
        });
        
        window.UPPS_LOG.debug('Affected links updated', { count: affectedLinks.length });
    }
    
    /**
     * ノードの半径を計算
     * @param {Object} nodeData ノードデータ
     * @returns {number} 半径
     */
    getNodeRadius(nodeData) {
        if (nodeData.type === 'emotion') {
            const value = nodeData.value || 50;
            const config = window.UPPS_CONFIG.VISUALIZER.NODE_RADIUS;
            return config.MIN + (config.MAX - config.MIN) * (value / 100);
        }
        
        return window.UPPS_CONFIG.VISUALIZER.NODE_RADIUS.DEFAULT;
    }
    
    /**
     * 記憶IDを更新
     * @param {string} newId 新しいID
     */
    updateMemoryId(newId) {
        if (this.currentNodeType !== 'memory' || !this.currentNodeData) {
            return;
        }
        
        const oldId = this.currentNodeData.memoryId;
        const editor = window.uppsEditor;
        
        if (!editor || !oldId || oldId === newId) {
            return;
        }
        
        // メモリシステムを通じてIDを更新
        if (window.MemorySystem) {
            window.MemorySystem.updateMemoryIdReferences(editor.persona, oldId, newId);
        }
        
        // ノードデータも更新
        this.currentNodeData.memoryId = newId;
        this.currentNode.memoryId = newId;
        this.currentNode.id = `memory:${newId}`;
        this.currentNode.name = newId;
        
        window.UPPS_LOG.info('Memory ID updated from node editor', { oldId, newId });
    }
    
    /**
     * コンテキストメニューを表示
     * @param {Event} event マウスイベント
     * @param {Object} node ノード
     */
    showContextMenu(event, node) {
        event.preventDefault();
        
        // 既存のコンテキストメニューを削除
        this.hideContextMenu();
        
        // コンテキストメニューを作成
        const menu = document.createElement('div');
        menu.className = 'node-context-menu fixed bg-slate-800 border border-white/20 rounded-lg shadow-lg z-50';
        menu.style.left = `${event.clientX}px`;
        menu.style.top = `${event.clientY}px`;
        
        // メニューアイテムを追加
        const menuItems = this.getContextMenuItems(node);
        
        menuItems.forEach(item => {
            const menuItem = document.createElement('div');
            menuItem.className = 'px-3 py-2 text-white hover:bg-white/10 cursor-pointer text-sm';

            const icon = document.createElement('i');
            icon.setAttribute('data-lucide', item.icon);
            icon.className = 'w-4 h-4 inline mr-2';
            menuItem.appendChild(icon);

            const labelNode = document.createTextNode(item.label);
            menuItem.appendChild(labelNode);

            menuItem.addEventListener('click', () => {
                item.action(node);
                this.hideContextMenu();
            });

            menu.appendChild(menuItem);
        });
        
        document.body.appendChild(menu);
        menu.id = 'node-context-menu';
        
        // Lucideアイコンの初期化
        if (window.lucide) window.lucide.createIcons();
        
        // クリック外で閉じる
        setTimeout(() => {
            document.addEventListener('click', this.hideContextMenu.bind(this), { once: true });
        }, 100);
    }
    
    /**
     * コンテキストメニューを非表示
     */
    hideContextMenu() {
        const menu = document.getElementById('node-context-menu');
        if (menu) {
            menu.remove();
        }
    }
    
    /**
     * コンテキストメニューアイテムを取得
     * @param {Object} node ノード
     * @returns {Array} メニューアイテムのリスト
     */
    getContextMenuItems(node) {
        const items = [
            {
                icon: 'edit',
                label: '編集',
                action: (node) => this.openNodeEditor(node, node.type, node)
            },
            {
                icon: 'copy',
                label: 'IDをコピー',
                action: (node) => this.copyNodeId(node)
            }
        ];
        
        // ノードタイプ別のアイテム
        if (node.type === 'memory') {
            items.push({
                icon: 'trash-2',
                label: '削除',
                action: (node) => this.deleteMemoryNode(node)
            });
        }
        
        if (node.type === 'emotion') {
            items.push({
                icon: 'refresh-cw',
                label: 'ベースラインにリセット',
                action: (node) => this.resetEmotionToBaseline(node)
            });
        }
        
        return items;
    }
    
    /**
     * ノードIDをクリップボードにコピー
     * @param {Object} node ノード
     */
    async copyNodeId(node) {
        try {
            const id = node.memoryId || node.emotionId || node.id;
            await navigator.clipboard.writeText(id);
            
            if (window.uppsEditor) {
                window.uppsEditor.showNotification(`ID "${id}" をコピーしました`, 'info');
            }
        } catch (error) {
            window.UPPS_LOG.warn('Failed to copy node ID', error);
        }
    }
    
    /**
     * 記憶ノードを削除
     * @param {Object} node ノード
     */
    deleteMemoryNode(node) {
        if (!node.memoryId) return;
        
        const editor = window.uppsEditor;
        if (!editor) return;
        
        // 記憶のインデックスを検索
        const memoryIndex = editor.persona.memory_system?.memories?.findIndex(
            memory => memory.id === node.memoryId
        );
        
        if (memoryIndex >= 0) {
            editor.removeMemory(memoryIndex);
        }
    }
    
    /**
     * 感情をベースラインにリセット
     * @param {Object} node ノード
     */
    resetEmotionToBaseline(node) {
        if (!node.emotionId) return;
        
        const editor = window.uppsEditor;
        if (!editor?.persona?.emotion_system?.emotions?.[node.emotionId]) return;
        
        const baseline = editor.persona.emotion_system.emotions[node.emotionId].baseline;
        
        // 現在の感情状態を更新
        if (window.EmotionSystem) {
            window.EmotionSystem.updateCurrentEmotionState(editor.persona, node.emotionId, baseline);
        }
        
        // ノードの視覚的更新
        node.value = baseline;
        this.updateAffectedLinks(node);
        
        editor.showNotification(`${window.UPPS_HELPERS.getEmotionLabel(node.emotionId)}をベースラインにリセットしました`, 'info');
    }
    
    /**
     * エディタが開いているかチェック
     * @returns {boolean} 開いているかどうか
     */
    isEditorOpen() {
        return this.isOpen;
    }
    
    /**
     * 現在のノードデータを取得
     * @returns {Object|null} ノードデータまたはnull
     */
    getCurrentNodeData() {
        return this.currentNodeData;
    }
    
    /**
     * 現在のノードタイプを取得
     * @returns {string|null} ノードタイプまたはnull
     */
    getCurrentNodeType() {
        return this.currentNodeType;
    }
}

// グローバルインスタンスを作成
window.NodeEditor = new NodeEditorManager();

// UPPSEditorプロトタイプに関数を追加
if (typeof UPPSEditor !== 'undefined') {
    UPPSEditor.prototype.getSelectedNodeTitle = function() {
        return window.NodeEditor.getSelectedNodeTitle();
    };
    
    UPPSEditor.prototype.closeNodeEditor = function() {
        window.NodeEditor.closeNodeEditor();
    };
    
    UPPSEditor.prototype.updateLinkStrength = function() {
        window.NodeEditor.updateLinkStrength();
    };
    
    UPPSEditor.prototype.updateEmotionBaseline = function() {
        window.NodeEditor.updateEmotionBaseline();
    };
    
    UPPSEditor.prototype.updateAffectedLinks = function(nodeData) {
        window.NodeEditor.updateAffectedLinks(nodeData);
    };
}

window.UPPS_LOG.info('Node editor module initialized');
