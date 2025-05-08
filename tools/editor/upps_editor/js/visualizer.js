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
    
    // リンクの描画
    const link = g.selectAll(".link")
        .data(links)
        .enter()
        .append("line")
        .attr("class", "link")
        .attr("stroke", d => getLinkColor(d))
        .attr("stroke-width", d => Math.max(1, d.strength / 20))
        .attr("stroke-opacity", 0.6)
        .on("click", (event, d) => this.selectNode('link', d, event));
    
    // ノードの描画
    const node = g.selectAll(".node")
        .data(nodes)
        .enter()
        .append("circle")
        .attr("class", "node")
        .attr("r", d => getNodeRadius(d))
        .attr("fill", d => getNodeColor(d))
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
        .text(d => d.name);
    
    // シミュレーションの作成
    const simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links).id(d => d.id).distance(100))
        .force("charge", d3.forceManyBody().strength(-300))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("collide", d3.forceCollide().radius(d => getNodeRadius(d) + 10));
    
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
    
    // グローバル変数に保存
    this.networkVisualization = {
        svg,
        simulation,
        nodes,
        links
    };
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
                        strength: assoc.response.association_strength || 50
                    });
                }
            }
            
            // 複合トリガーはこの単純な可視化では省略
        }
    }
    
    return { nodes, links };
}

// ノードの半径を取得
function getNodeRadius(node) {
    if (node.type === 'emotion') {
        return 20 + (node.value / 5); // 感情の強さに比例
    } else {
        return 25; // 記憶ノードは固定サイズ
    }
}

// ノードの色を取得
function getNodeColor(node) {
    if (node.type === 'emotion') {
        // 感情タイプに応じた色
        const colors = {
            joy: '#4FD1C5', // ティール
            sadness: '#4299E1', // 青
            anger: '#F56565', // 赤
            fear: '#9F7AEA', // 紫
            disgust: '#68D391', // 緑
            surprise: '#F6AD55' // オレンジ
        };
        return colors[node.emotionId] || '#A0AEC0'; // デフォルトはグレー
    } else if (node.type === 'memory') {
        // 記憶タイプに応じた色
        const colors = {
            episodic: '#4F46E5', // インディゴ
            semantic: '#06B6D4', // シアン
            procedural: '#F59E0B', // アンバー
            autobiographical: '#8B5CF6' // パープル
        };
        return colors[node.memoryType] || '#A0AEC0';
    }
    return '#A0AEC0';
}

// リンクの色を取得
function getLinkColor(link) {
    if (link.type === 'memory-emotion') {
        return 'rgba(79, 70, 229, 0.6)'; // インディゴ
    } else if (link.type === 'emotion-memory') {
        return 'rgba(6, 182, 212, 0.6)'; // シアン
    }
    return 'rgba(160, 174, 192, 0.6)'; // グレー
}

// ノード選択時の処理
function selectNode(type, data, event) {
    event.stopPropagation(); // バブリングを防止
    
    this.selectedNodeType = type;
    this.selectedNode = data.id || null;
    this.selectedNodeData = data;
    
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
    this.selectedNode = null;
    this.selectedNodeType = null;
    this.selectedNodeData = null;
}

// リンク強度の更新
function updateLinkStrength() {
    if (!this.selectedNode || this.selectedNodeType !== 'link') return;
    
    // 可視化の更新
    d3.select(`#network-visualizer line[id="${this.selectedNode}"]`)
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
    }
}