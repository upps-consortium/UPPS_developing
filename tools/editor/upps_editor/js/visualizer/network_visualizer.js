// js/visualizer/network_visualizer.js
// D3.jsを使った関連性ネットワークの可視化

/**
 * ネットワーク可視化管理クラス
 */
class NetworkVisualizerManager {
    constructor() {
        this.svg = null;
        this.simulation = null;
        this.container = null;
        this.zoomBehavior = null;
        this.currentZoom = 1;
        this.visualization = null;
        this.isDragging = false;
        this.dragLine = null;
        this.selectedSourceNode = null;
        
        // 設定
        this.config = {
            width: window.UPPS_CONFIG.VISUALIZER.DEFAULT_WIDTH,
            height: window.UPPS_CONFIG.VISUALIZER.DEFAULT_HEIGHT,
            nodeRadius: window.UPPS_CONFIG.VISUALIZER.NODE_RADIUS,
            linkStrength: window.UPPS_CONFIG.VISUALIZER.LINK_STRENGTH,
            chargeStrength: -300,
            linkDistance: 100,
            alphaMin: 0.001,
            velocityDecay: 0.4
        };
    }
    
    /**
     * ビジュアライザを初期化
     * @param {string} containerId コンテナ要素のID
     */
    initializeVisualizer(containerId = 'network-visualizer') {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            window.UPPS_LOG.warn('Network visualizer container not found', { containerId });
            return;
        }
        
        // 既存のSVGをクリア
        d3.select(`#${containerId} svg`).remove();
        
        // SVGを作成
        this.svg = d3.select(`#${containerId}`)
            .append("svg")
            .attr("width", "100%")
            .attr("height", "100%")
            .attr("viewBox", `0 0 ${this.config.width} ${this.config.height}`);
        
        // ズーム機能を設定
        this.setupZoom();
        
        // メイングループを作成
        this.mainGroup = this.svg.append("g").attr("class", "main-group");
        
        // ネットワークデータを生成
        this.generateNetworkData();
        
        // D3シミュレーションを初期化
        this.setupSimulation();
        
        // ネットワークを描画
        this.drawNetwork();
        
        // ミニマップを初期化
        this.initializeMinimap();
        
        window.UPPS_LOG.info('Network visualizer initialized');
    }
    
    /**
     * ズーム機能を設定
     */
    setupZoom() {
        this.zoomBehavior = d3.zoom()
            .scaleExtent([0.1, 4])
            .on("zoom", (event) => {
                this.currentZoom = event.transform.k;
                this.mainGroup.attr("transform", event.transform);
                this.updateMinimap();
            });
        
        this.svg.call(this.zoomBehavior);
    }
    
    /**
     * ネットワークデータを生成
     */
    generateNetworkData() {
        const editor = window.uppsEditor;
        if (!editor?.persona) {
            window.UPPS_LOG.warn('Cannot generate network data: persona not found');
            return;
        }
        
        const nodes = [];
        const links = [];
        
        // 感情ノードを追加
        if (editor.persona.emotion_system?.emotions) {
            Object.entries(editor.persona.emotion_system.emotions).forEach(([emotionId, emotionData]) => {
                nodes.push({
                    id: `emotion:${emotionId}`,
                    type: 'emotion',
                    emotionId: emotionId,
                    name: window.UPPS_HELPERS.getEmotionLabel(emotionId),
                    value: editor.persona.current_emotion_state?.[emotionId] || emotionData.baseline,
                    baseline: emotionData.baseline,
                    x: Math.random() * this.config.width,
                    y: Math.random() * this.config.height
                });
            });
        }
        
        // 記憶ノードを追加
        if (editor.persona.memory_system?.memories) {
            editor.persona.memory_system.memories.forEach(memory => {
                nodes.push({
                    id: `memory:${memory.id}`,
                    type: 'memory',
                    memoryId: memory.id,
                    name: memory.id,
                    memoryType: memory.type,
                    content: memory.content,
                    x: Math.random() * this.config.width,
                    y: Math.random() * this.config.height
                });
            });
        }
        
        // 関連性リンクを追加
        if (editor.persona.association_system?.associations) {
            editor.persona.association_system.associations.forEach(assoc => {
                const sourceNode = this.findNodeByAssociationData(nodes, assoc.trigger);
                const targetNode = this.findNodeByAssociationData(nodes, assoc.response);
                
                if (sourceNode && targetNode) {
                    links.push({
                        id: `link:${assoc.id}`,
                        source: sourceNode,
                        target: targetNode,
                        strength: assoc.response.association_strength || 50,
                        associationId: assoc.id,
                        type: assoc.trigger.type === 'complex' ? 'complex' : 'simple'
                    });
                }
            });
        }
        
        this.visualization = { nodes, links };
        
        // UPPSEditorにも設定
        if (editor) {
            editor.networkVisualization = this.visualization;
        }
        
        window.UPPS_LOG.debug('Network data generated', { 
            nodeCount: nodes.length, 
            linkCount: links.length 
        });
    }
    
    /**
     * 関連性データからノードを検索
     * @param {Array} nodes ノード配列
     * @param {Object} associationData 関連性データ（trigger または response）
     * @returns {Object|null} 見つかったノードまたはnull
     */
    findNodeByAssociationData(nodes, associationData) {
        if (associationData.type === 'emotion') {
            return nodes.find(node => node.type === 'emotion' && node.emotionId === associationData.id);
        } else if (associationData.type === 'memory') {
            return nodes.find(node => node.type === 'memory' && node.memoryId === associationData.id);
        } else if (associationData.type === 'complex') {
            // 複合条件の場合は専用ノードを作成（実装は省略）
            return null;
        }
        
        return null;
    }
    
    /**
     * D3シミュレーションを設定
     */
    setupSimulation() {
        if (!this.visualization) {
            return;
        }
        
        this.simulation = d3.forceSimulation(this.visualization.nodes)
            .force("link", d3.forceLink(this.visualization.links)
                .id(d => d.id)
                .distance(this.config.linkDistance)
                .strength(d => d.strength / 100))
            .force("charge", d3.forceManyBody()
                .strength(this.config.chargeStrength))
            .force("center", d3.forceCenter(this.config.width / 2, this.config.height / 2))
            .force("collision", d3.forceCollide().radius(d => this.getNodeRadius(d) + 5))
            .alphaMin(this.config.alphaMin)
            .velocityDecay(this.config.velocityDecay);
        
        // シミュレーション更新時のコールバック
        this.simulation.on("tick", () => {
            this.updatePositions();
        });
    }
    
    /**
     * ネットワークを描画
     */
    drawNetwork() {
        if (!this.visualization) {
            return;
        }
        
        // リンクを描画
        this.drawLinks();
        
        // ノードを描画
        this.drawNodes();
        
        // ドラッグライン用の要素を準備
        this.dragLine = this.mainGroup.append("line")
            .attr("class", "drag-line")
            .style("stroke", "#4299E1")
            .style("stroke-width", 2)
            .style("stroke-dasharray", "5,5")
            .style("pointer-events", "none")
            .style("opacity", 0);
    }
    
    /**
     * リンクを描画
     */
    drawLinks() {
        const linkElements = this.mainGroup.selectAll(".link")
            .data(this.visualization.links)
            .enter()
            .append("line")
            .attr("class", "link")
            .attr("data-id", d => d.id)
            .style("stroke", "#6B7280")
            .style("stroke-width", d => Math.max(1, d.strength / 20))
            .style("stroke-opacity", 0.6)
            .style("cursor", "pointer")
            .on("click", (event, d) => {
                this.selectLink(d);
            });
        
        // 複合条件のリンクは点線で表示
        linkElements.filter(d => d.type === 'complex')
            .style("stroke-dasharray", "5,3");
    }
    
    /**
     * ノードを描画
     */
    drawNodes() {
        const nodeGroups = this.mainGroup.selectAll(".node-group")
            .data(this.visualization.nodes)
            .enter()
            .append("g")
            .attr("class", "node-group")
            .style("cursor", "pointer");
        
        // ノード円を追加
        nodeGroups.append("circle")
            .attr("class", "node")
            .attr("data-id", d => d.id)
            .attr("r", d => this.getNodeRadius(d))
            .style("fill", d => this.getNodeColor(d))
            .style("stroke", "#000")
            .style("stroke-width", 1.5)
            .style("stroke-opacity", 0.3);
        
        // ノードラベルを追加
        nodeGroups.append("text")
            .attr("class", "label")
            .attr("data-id", d => d.id)
            .attr("text-anchor", "middle")
            .attr("dy", "0.3em")
            .style("font-size", "10px")
            .style("fill", "white")
            .style("pointer-events", "none")
            .style("user-select", "none")
            .style("text-shadow", "0 1px 2px rgba(0, 0, 0, 0.8)")
            .text(d => this.getNodeLabel(d));
        
        // ドラッグ機能を設定
        this.setupNodeDrag(nodeGroups);
        
        // ノードクリックイベント
        nodeGroups.on("click", (event, d) => {
            if (!this.isDragging) {
                this.selectNode(d);
            }
        });
        
        // 右クリックでコンテキストメニュー
        nodeGroups.on("contextmenu", (event, d) => {
            if (window.NodeEditor) {
                window.NodeEditor.showContextMenu(event, d);
            }
        });
    }
    
    /**
     * ノードドラッグ機能を設定
     * @param {Object} nodeGroups D3ノードグループ
     */
    setupNodeDrag(nodeGroups) {
        const drag = d3.drag()
            .on("start", (event, d) => {
                this.isDragging = false;
                
                // Alt+ドラッグで関連性作成モード
                if (event.sourceEvent.altKey) {
                    this.startLinkCreation(d, event);
                } else {
                    // 通常のドラッグ
                    if (!event.active) {
                        this.simulation.alphaTarget(0.3).restart();
                    }
                    d.fx = d.x;
                    d.fy = d.y;
                }
            })
            .on("drag", (event, d) => {
                this.isDragging = true;
                
                if (event.sourceEvent.altKey && this.selectedSourceNode) {
                    // 関連性作成中のドラッグライン更新
                    this.updateDragLine(event);
                } else {
                    // 通常のノードドラッグ
                    d.fx = event.x;
                    d.fy = event.y;
                }
            })
            .on("end", (event, d) => {
                if (event.sourceEvent.altKey && this.selectedSourceNode) {
                    // 関連性作成の終了
                    this.endLinkCreation(d, event);
                } else {
                    // 通常のドラッグ終了
                    if (!event.active) {
                        this.simulation.alphaTarget(0);
                    }
                    d.fx = null;
                    d.fy = null;
                }
                
                // ドラッグフラグをリセット
                setTimeout(() => {
                    this.isDragging = false;
                }, 100);
            });
        
        nodeGroups.call(drag);
    }
    
    /**
     * 関連性作成を開始
     * @param {Object} sourceNode ソースノード
     * @param {Object} event ドラッグイベント
     */
    startLinkCreation(sourceNode, event) {
        this.selectedSourceNode = sourceNode;
        
        // ドラッグラインを表示
        this.dragLine
            .attr("x1", sourceNode.x)
            .attr("y1", sourceNode.y)
            .attr("x2", sourceNode.x)
            .attr("y2", sourceNode.y)
            .style("opacity", 1);
        
        window.UPPS_LOG.debug('Link creation started', { sourceNode: sourceNode.id });
    }
    
    /**
     * ドラッグライン更新
     * @param {Object} event ドラッグイベント
     */
    updateDragLine(event) {
        if (!this.selectedSourceNode) return;
        
        this.dragLine
            .attr("x2", event.x)
            .attr("y2", event.y);
    }
    
    /**
     * 関連性作成を終了
     * @param {Object} targetNode ターゲットノード
     * @param {Object} event ドラッグイベント
     */
    endLinkCreation(targetNode, event) {
        // ドラッグラインを非表示
        this.dragLine.style("opacity", 0);
        
        if (this.selectedSourceNode && targetNode && this.selectedSourceNode.id !== targetNode.id) {
            // 関連性作成ダイアログを開く
            if (window.uppsEditor && typeof window.uppsEditor.openCreateLinkDialog === 'function') {
                window.uppsEditor.openCreateLinkDialog(this.selectedSourceNode, targetNode);
            } else {
                // フォールバック: 直接関連性を作成
                this.createDirectLink(this.selectedSourceNode, targetNode);
            }
        }
        
        this.selectedSourceNode = null;
        
        window.UPPS_LOG.debug('Link creation ended');
    }
    
    /**
     * 直接関連性を作成
     * @param {Object} sourceNode ソースノード
     * @param {Object} targetNode ターゲットノード
     */
    createDirectLink(sourceNode, targetNode) {
        const editor = window.uppsEditor;
        if (!editor || !window.AssociationSystem) {
            return;
        }
        
        // 新しい関連性を追加
        const associationId = window.AssociationSystem.addAssociation(editor.persona, editor.externalItems);
        
        // 作成された関連性を更新
        const newAssociation = editor.persona.association_system.associations.find(assoc => assoc.id === associationId);
        if (newAssociation) {
            // ソースノードに応じてトリガーを設定
            if (sourceNode.type === 'emotion') {
                newAssociation.trigger.type = 'emotion';
                newAssociation.trigger.id = sourceNode.emotionId;
                newAssociation.trigger.threshold = 70;
            } else if (sourceNode.type === 'memory') {
                newAssociation.trigger.type = 'memory';
                newAssociation.trigger.id = sourceNode.memoryId;
                delete newAssociation.trigger.threshold;
            }
            
            // ターゲットノードに応じてレスポンスを設定
            if (targetNode.type === 'emotion') {
                newAssociation.response.type = 'emotion';
                newAssociation.response.id = targetNode.emotionId;
            } else if (targetNode.type === 'memory') {
                newAssociation.response.type = 'memory';
                newAssociation.response.id = targetNode.memoryId;
            }
        }
        
        // ビジュアライザを更新
        this.refreshVisualizer();
        
        editor.showNotification('関連性を作成しました', 'success');
    }
    
    /**
     * 位置を更新
     */
    updatePositions() {
        // ノード位置を更新
        this.mainGroup.selectAll(".node-group")
            .attr("transform", d => `translate(${d.x}, ${d.y})`);
        
        // リンク位置を更新
        this.mainGroup.selectAll(".link")
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);
    }
    
    /**
     * ノードを選択
     * @param {Object} node ノード
     */
    selectNode(node) {
        // 以前の選択を解除
        this.mainGroup.selectAll(".node").classed("selected", false);
        
        // 新しい選択を設定
        this.mainGroup.select(`circle[data-id="${node.id}"]`).classed("selected", true);
        
        // ノードエディタを開く
        if (window.NodeEditor) {
            window.NodeEditor.openNodeEditor(node, node.type, node);
        }
        
        window.UPPS_LOG.debug('Node selected', { nodeId: node.id, nodeType: node.type });
    }
    
    /**
     * リンクを選択
     * @param {Object} link リンク
     */
    selectLink(link) {
        // 以前の選択を解除
        this.mainGroup.selectAll(".link").classed("selected", false);
        
        // 新しい選択を設定
        this.mainGroup.select(`line[data-id="${link.id}"]`).classed("selected", true);
        
        // ノードエディタを開く
        if (window.NodeEditor) {
            window.NodeEditor.openNodeEditor(link, 'link', link);
        }
        
        window.UPPS_LOG.debug('Link selected', { linkId: link.id });
    }
    
    /**
     * ノードの半径を取得
     * @param {Object} node ノード
     * @returns {number} 半径
     */
    getNodeRadius(node) {
        const config = this.config.nodeRadius;
        
        if (node.type === 'emotion') {
            const value = node.value || 50;
            return config.MIN + (config.MAX - config.MIN) * (value / 100);
        }
        
        return config.DEFAULT;
    }
    
    /**
     * ノードの色を取得
     * @param {Object} node ノード
     * @returns {string} 色コード
     */
    getNodeColor(node) {
        switch (node.type) {
            case 'emotion':
                return '#4F46E5'; // インディゴ
            case 'memory':
                return '#06B6D4'; // シアン
            case 'complex':
                return '#F59E0B'; // オレンジ
            default:
                return '#6B7280'; // グレー
        }
    }
    
    /**
     * ノードのラベルを取得
     * @param {Object} node ノード
     * @returns {string} ラベル
     */
    getNodeLabel(node) {
        const maxLength = 10;
        let label = node.name || node.id;
        
        if (label.length > maxLength) {
            label = label.substring(0, maxLength - 3) + '...';
        }
        
        return label;
    }
    
    /**
     * ビジュアライザを更新
     */
    refreshVisualizer() {
        if (!this.container) {
            window.UPPS_LOG.warn('Cannot refresh visualizer: container not found');
            return;
        }
        
        // データを再生成
        this.generateNetworkData();
        
        // 既存のSVGをクリアして再描画
        d3.select(this.container).select('svg').remove();
        this.initializeVisualizer(this.container.id);
        
        window.UPPS_LOG.debug('Visualizer refreshed');
    }
    
    /**
     * ズームイン
     */
    zoomIn() {
        if (!this.svg || !this.zoomBehavior) return;
        
        this.svg.transition().duration(300)
            .call(this.zoomBehavior.scaleBy, 1.5);
    }
    
    /**
     * ズームアウト
     */
    zoomOut() {
        if (!this.svg || !this.zoomBehavior) return;
        
        this.svg.transition().duration(300)
            .call(this.zoomBehavior.scaleBy, 1 / 1.5);
    }
    
    /**
     * ズームリセット
     */
    resetZoom() {
        if (!this.svg || !this.zoomBehavior) return;
        
        this.svg.transition().duration(500)
            .call(this.zoomBehavior.transform, d3.zoomIdentity);
    }
    
    /**
     * ミニマップを初期化
     */
    initializeMinimap() {
        // ミニマップの実装は省略（複雑なため）
        window.UPPS_LOG.debug('Minimap initialized (placeholder)');
    }
    
    /**
     * ミニマップを更新
     */
    updateMinimap() {
        // ミニマップの更新は省略
        window.UPPS_LOG.debug('Minimap updated (placeholder)');
    }
    
    /**
     * ビジュアライザのクリーンアップ
     */
    cleanup() {
        if (this.simulation) {
            this.simulation.stop();
        }
        
        if (this.container) {
            d3.select(this.container).select('svg').remove();
        }
        
        this.svg = null;
        this.simulation = null;
        this.visualization = null;
        
        window.UPPS_LOG.info('Network visualizer cleaned up');
    }
}

// グローバルインスタンスを作成
window.NetworkVisualizer = new NetworkVisualizerManager();

// UPPSEditorプロトタイプに関数を追加
if (typeof UPPSEditor !== 'undefined') {
    UPPSEditor.prototype.initializeVisualizer = function() {
        window.NetworkVisualizer.initializeVisualizer();
    };
    
    UPPSEditor.prototype.refreshVisualizer = function() {
        window.NetworkVisualizer.refreshVisualizer();
    };
    
    UPPSEditor.prototype.zoomIn = function() {
        window.NetworkVisualizer.zoomIn();
    };
    
    UPPSEditor.prototype.zoomOut = function() {
        window.NetworkVisualizer.zoomOut();
    };
    
    UPPSEditor.prototype.resetZoom = function() {
        window.NetworkVisualizer.resetZoom();
    };
    
    UPPSEditor.prototype.toggleVisualEditor = function() {
        this.visualEditorOpen = !this.visualEditorOpen;
        
        if (this.visualEditorOpen) {
            // ビジュアライザの初期化
            setTimeout(() => {
                this.initializeVisualizer();
            }, 100);
        } else {
            // 選択ノードをクリア
            if (window.NodeEditor) {
                window.NodeEditor.closeNodeEditor();
            }
        }
    };
}

window.UPPS_LOG.info('Network visualizer module initialized');
