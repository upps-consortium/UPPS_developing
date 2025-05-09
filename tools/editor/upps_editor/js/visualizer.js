// visualizer.js - 関連性ネットワークの可視化と編集機能

// ネットワーク可視化の初期化
function initializeVisualizer() {
    if (!this.visualEditorOpen) return;
    
    // 既存のSVGをクリア
    d3.select("#network-visualizer svg").remove();
    
    // コンテナの寸法を取得
    const container = document.getElementById('network-visualizer');
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    // SVGの作成
    const svg = d3.select("#network-visualizer")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .call(d3.zoom().on("zoom", (event) => {
            g.attr("transform", event.transform);
        }));
    
    // メインのグループ要素
    const g = svg.append("g");
    
    // ネットワークデータの準備
    const { nodes, links } = prepareNetworkData(this.profile);
    
    // リンク用のグループ
    const linkGroup = g.append("g").attr("class", "links");
    
    // リンクの描画
    const link = linkGroup.selectAll(".link")
        .data(links)
        .enter()
        .append("line")
        .attr("class", "link")
        .attr("data-id", d => d.id)
        .attr("stroke", d => getLinkColor(d))
        .attr("stroke-width", d => Math.max(1, d.strength / 20))
        .attr("stroke-opacity", 0.6)
        .on("click", (event, d) => this.selectNode('link', d, event));
    
    // ノード用のグループ
    const nodeGroup = g.append("g").attr("class", "nodes");
    
    // ノードの描画
    const node = nodeGroup.selectAll(".node")
        .data(nodes)
        .enter()
        .append("circle")
        .attr("class", "node")
        .attr("data-id", d => d.id)
        .attr("r", d => this.getNodeRadius(d))
        .attr("fill", d => this.getNodeColor(d))
        .attr("stroke", "#000")
        .attr("stroke-width", 1.5)
        .attr("stroke-opacity", 0.3)
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended))
        .on("click", (event, d) => this.selectNode(d.type, d, event));
    
    // ノードラベルの追加
    const label = g.selectAll(".label")
        .data(nodes)
        .enter()
        .append("text")
        .attr("class", "label")
        .attr("text-anchor", "middle")
        .attr("dy", ".35em")
        .attr("fill", "#ffffff")
        .attr("font-size", "10px")
        .attr("pointer-events", "none")
        .text(d => d.name);
    
    // シミュレーションの作成
    const simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links).id(d => d.id).distance(120))
        .force("charge", d3.forceManyBody().strength(-300))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("collide", d3.forceCollide().radius(d => this.getNodeRadius(d) + 15));
    
    // シミュレーション更新時の処理
    simulation.on("tick", () => {
        link
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);
        
        node
            .attr("cx", d => d.x)
            .attr("cy", d => d.y);
        
        label
            .attr("x", d => d.x)
            .attr("y", d => d.y);
    });
    
    // ドラッグイベントの処理
    function dragstarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }
    
    function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
    }
    
    function dragended(event, d) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }
    
    // 新規リンク作成のためのドラッグラインを追加
    const dragLine = g.append("path")
        .attr("class", "drag-line")
        .attr("d", "M0,0L0,0")
        .style("stroke", "#4299E1")
        .style("stroke-width", 2)
        .style("stroke-dasharray", "5,5")
        .style("opacity", 0)
        .style("pointer-events", "none");
    
    // 新規リンク作成機能
    enableLinkCreation(node, dragLine, svg, g);
    
    // グローバル変数に保存
    this.networkVisualization = {
        svg,
        g,
        simulation,
        nodes,
        links,
        dragLine
    };
}

// 新規リンク作成を有効化
function enableLinkCreation(nodes, dragLine, svg, g) {
    let sourceNode = null;
    
    nodes.on("mousedown", function(event, d) {
        if (event.button !== 0) return; // 左クリックのみ
        if (event.altKey) { // Altキーを押しながらクリック
            sourceNode = d;
            dragLine
                .style("opacity", 1)
                .attr("d", `M${sourceNode.x},${sourceNode.y}L${sourceNode.x},${sourceNode.y}`);
            
            event.preventDefault();
        }
    });
    
    svg.on("mousemove", function(event) {
        if (!sourceNode) return;
        
        const pointer = d3.pointer(event, g.node());
        dragLine.attr("d", `M${sourceNode.x},${sourceNode.y}L${pointer[0]},${pointer[1]}`);
    });
    
    nodes.on("mouseup", function(event, d) {
        if (!sourceNode || sourceNode === d) {
            dragLine.style("opacity", 0);
            sourceNode = null;
            return;
        }
        
        if (event.altKey) {
            // ターゲットノードを設定
            const targetNode = d;
            
            // リンク作成ダイアログを表示
            openCreateLinkDialog(sourceNode, targetNode);
            
            // リセット
            dragLine.style("opacity", 0);
            sourceNode = null;
        }
    });
    
    svg.on("mouseup", function() {
        dragLine.style("opacity", 0);
        sourceNode = null;
    });
}

// リンク作成ダイアログを表示
function openCreateLinkDialog(sourceNode, targetNode) {
    // 関連性タイプに基づいてダイアログ表示を管理するコードはここに実装
    // 現時点ではシンプルにコンソールログとデフォルト値での作成
    console.log('Creating link from', sourceNode.id, 'to', targetNode.id);
    
    // 関連性の追加
    const sourceType = sourceNode.type;
    const sourceId = sourceNode.emotionId || sourceNode.memoryId;
    const targetType = targetNode.type;
    const targetId = targetNode.emotionId || targetNode.memoryId;
    
    // 関連性をプロファイルに追加
    addAssociationToProfile(sourceType, sourceId, targetType, targetId);
    
    // ビジュアライザを更新
    this.refreshVisualizer();
}

// プロファイルに関連性を追加
function addAssociationToProfile(sourceType, sourceId, targetType, targetId, strength = 50) {
    if (!this.profile.association_system) {
        this.profile.association_system = { associations: [] };
    }
    
    if (!this.profile.association_system.associations) {
        this.profile.association_system.associations = [];
    }
    
    // 新しい関連性を作成
    const newId = `assoc_${this.profile.association_system.associations.length + 1}`;
    
    this.profile.association_system.associations.push({
        id: newId,
        trigger: {
            type: sourceType,
            id: sourceId
        },
        response: {
            type: targetType,
            id: targetId,
            association_strength: strength
        }
    });
    
    console.log('Added new association:', newId);
}

// ビジュアライザを更新
function refreshVisualizer() {
    if (this.visualEditorOpen) {
        this.initializeVisualizer();
    }
}

// プロファイルからネットワークデータを作成
function prepareNetworkData(profile) {
    const nodes = [];
    const links = [];
    const nodeMap = {};
    
    // 感情ノードの追加
    if (profile.emotion_system && profile.emotion_system.emotions) {
        const emotions = profile.emotion_system.emotions;
        for (const [id, data] of Object.entries(emotions)) {
            const node = {
                id: `emotion:${id}`,
                name: getEmotionLabel(id),
                type: 'emotion',
                emotionId: id,
                value: profile.current_emotion_state?.[id] || data.baseline || 50
            };
            nodes.push(node);
            nodeMap[node.id] = node;
        }
    }
    
    // 記憶ノードの追加
    if (profile.memory_system && profile.memory_system.memories) {
        for (const memory of profile.memory_system.memories) {
            const node = {
                id: `memory:${memory.id}`,
                name: memory.id,
                type: 'memory',
                memoryId: memory.id,
                memoryType: memory.type,
                content: memory.content
            };
            nodes.push(node);
            nodeMap[node.id] = node;
        }
    }
    
    // 関連性の追加
    if (profile.association_system && profile.association_system.associations) {
        for (const assoc of profile.association_system.associations) {
            if (!assoc.trigger || !assoc.response) continue;
            
            // 単純トリガーの処理
            if (assoc.trigger.type && assoc.trigger.id) {
                const sourceId = `${assoc.trigger.type}:${assoc.trigger.id}`;
                const targetId = `${assoc.response.type}:${assoc.response.id}`;
                
                if (nodeMap[sourceId] && nodeMap[targetId]) {
                    links.push({
                        id: `${sourceId}-${targetId}`,
                        source: sourceId,
                        target: targetId,
                        type: `${assoc.trigger.type}-${assoc.response.type}`,
                        strength: assoc.response.association_strength || 50,
                        associationId: assoc.id || null
                    });
                }
            }
            
            // 複合トリガーの処理
            if (assoc.trigger.type === 'complex' && assoc.trigger.conditions) {
                const targetId = `${assoc.response.type}:${assoc.response.id}`;
                if (!nodeMap[targetId]) continue;
                
                // 各条件からターゲットへのリンクを作成
                assoc.trigger.conditions.forEach((condition, index) => {
                    if (condition.type && condition.id) {
                        const sourceId = `${condition.type}:${condition.id}`;
                        if (nodeMap[sourceId]) {
                            links.push({
                                id: `${sourceId}-${targetId}-${index}`,
                                source: sourceId,
                                target: targetId,
                                type: `complex-${assoc.trigger.operator || 'AND'}`,
                                strength: assoc.response.association_strength || 50,
                                isComplex: true,
                                operator: assoc.trigger.operator || 'AND',
                                associationId: assoc.id || null
                            });
                        }
                    }
                });
            }
        }
    }
    
    return { nodes, links };
}

// リンクの色を取得
function getLinkColor(link) {
    if (link.isComplex) {
        return link.operator === 'AND' ? 'rgba(159, 122, 234, 0.6)' : 'rgba(246, 173, 85, 0.6)';
    }
    
    if (link.type === 'memory-emotion') {
        return 'rgba(79, 70, 229, 0.6)'; // インディゴ
    } else if (link.type === 'emotion-memory') {
        return 'rgba(6, 182, 212, 0.6)'; // シアン
    } else if (link.type === 'emotion-emotion') {
        return 'rgba(245, 101, 101, 0.6)'; // 赤
    } else if (link.type === 'memory-memory') {
        return 'rgba(104, 211, 145, 0.6)'; // 緑
    }
    
    return 'rgba(160, 174, 192, 0.6)'; // グレー
}

// ノード選択時の処理
function selectNode(type, data, event) {
    event.stopPropagation(); // バブリングを防止
    
    this.selectedNodeType = type;
    this.selectedNode = data.id || null;
    this.selectedNodeData = data;
    
    // ノードの選択状態を視覚的に表示
    d3.selectAll("#network-visualizer .node")
        .attr("stroke-opacity", 0.3)
        .attr("stroke-width", 1.5);
    
    if (type !== 'link') {
        d3.select(`#network-visualizer circle[data-id="${data.id}"]`)
            .attr("stroke-opacity", 1)
            .attr("stroke-width", 3);
    } else {
        d3.select(`#network-visualizer line[data-id="${data.id}"]`)
            .attr("stroke-opacity", 1)
            .attr("stroke-width", Math.max(2, data.strength / 15));
    }
    
    console.log('Selected node:', type, data);
}

// 選択されたノードのタイトルを取得
function getSelectedNodeTitle() {
    if (!this.selectedNode) return '';
    
    if (this.selectedNodeType === 'emotion') {
        return `感情: ${this.selectedNodeData.name}`;
    } else if (this.selectedNodeType === 'memory') {
        return `記憶: ${this.selectedNodeData.name}`;
    } else if (this.selectedNodeType === 'link') {
        return '関連性';
    }
    
    return 'ノード';
}

// ノードエディタを閉じる
function closeNodeEditor() {
    // 選択状態のリセット
    d3.selectAll("#network-visualizer .node")
        .attr("stroke-opacity", 0.3)
        .attr("stroke-width", 1.5);
    
    d3.selectAll("#network-visualizer .link")
        .attr("stroke-opacity", 0.6)
        .attr("stroke-width", d => Math.max(1, d.strength / 20));
    
    this.selectedNode = null;
    this.selectedNodeType = null;
    this.selectedNodeData = null;
}

// リンク強度の更新
function updateLinkStrength() {
    if (!this.selectedNode || this.selectedNodeType !== 'link') return;
    
    // 可視化の更新
    d3.select(`#network-visualizer line[data-id="${this.selectedNodeData.id}"]`)
        .attr("stroke-width", Math.max(1, this.selectedNodeData.strength / 20));
    
    // プロファイルデータの更新
    const [sourceType, sourceId] = this.selectedNodeData.source.id.split(':');
    const [targetType, targetId] = this.selectedNodeData.target.id.split(':');
    
    // 関連性を検索して更新
    const associations = this.profile.association_system?.associations || [];
    for (const assoc of associations) {
        if (assoc.trigger?.type === sourceType && 
            assoc.trigger?.id === sourceId &&
            assoc.response?.type === targetType &&
            assoc.response?.id === targetId) {
            
            assoc.response.association_strength = this.selectedNodeData.strength;
            console.log('Updated association strength:', this.selectedNodeData.strength);
            break;
        }
    }
}

// ズーム操作
function zoomIn() {
    if (!this.networkVisualization) return;
    
    const svg = this.networkVisualization.svg;
    const zoom = d3.zoom().on("zoom", (event) => {
        svg.select("g").attr("transform", event.transform);
    });
    
    svg.transition().call(zoom.scaleBy, 1.3);
}

function zoomOut() {
    if (!this.networkVisualization) return;
    
    const svg = this.networkVisualization.svg;
    const zoom = d3.zoom().on("zoom", (event) => {
        svg.select("g").attr("transform", event.transform);
    });
    
    svg.transition().call(zoom.scaleBy, 0.7);
}

function resetZoom() {
    if (!this.networkVisualization) return;
    
    const svg = this.networkVisualization.svg;
    const zoom = d3.zoom().on("zoom", (event) => {
        svg.select("g").attr("transform", event.transform);
    });
    
    svg.transition().call(zoom.transform, d3.zoomIdentity);
}

// ビジュアルエディタの表示切替
function toggleVisualEditor() {
    this.visualEditorOpen = !this.visualEditorOpen;
    
    if (this.visualEditorOpen) {
        // 表示時に初期化
        setTimeout(() => {
            this.initializeVisualizer();
        }, 100);
    } else {
        // 非表示時は選択状態をクリア
        this.closeNodeEditor();
    }
}
