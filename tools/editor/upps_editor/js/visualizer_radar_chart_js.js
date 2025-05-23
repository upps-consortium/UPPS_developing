// js/visualizer/radar_chart.js
// 認知能力レーダーチャートの実装

/**
 * レーダーチャート管理クラス
 */
class RadarChartManager {
    constructor() {
        this.chartContainer = null;
        this.chartData = null;
        this.svg = null;
        this.config = {
            margin: { top: 10, right: 10, bottom: 10, left: 10 },
            levels: window.UPPS_CONFIG.RADAR_CHART.LEVELS,
            maxValue: window.UPPS_CONFIG.RADAR_CHART.MAX_VALUE,
            labelFactor: 1.25,
            wrapWidth: 60,
            opacityArea: window.UPPS_CONFIG.RADAR_CHART.OPACITY_AREA,
            dotRadius: window.UPPS_CONFIG.RADAR_CHART.DOT_RADIUS,
            opacityCircles: window.UPPS_CONFIG.RADAR_CHART.OPACITY_CIRCLES,
            strokeWidth: 2,
            roundStrokes: false,
            color: d3.scaleOrdinal().range(["#4F46E5"])
        };
    }
    
    /**
     * 認知能力レーダーチャートを初期化
     * @param {string} containerId コンテナ要素のID
     */
    initializeCognitiveRadarChart(containerId = 'cognitive-radar-chart') {
        this.chartContainer = document.getElementById(containerId);
        if (!this.chartContainer) {
            window.UPPS_LOG.warn('Radar chart container not found', { containerId });
            return;
        }
        
        // データを準備
        const editor = window.uppsEditor;
        if (!editor?.persona?.cognitive_system?.abilities) {
            window.UPPS_LOG.warn('Cognitive abilities data not found');
            return;
        }
        
        this.chartData = this.prepareCognitiveData(editor.persona);
        
        // チャートのサイズ設定
        const width = this.chartContainer.clientWidth;
        const height = this.chartContainer.clientHeight;
        const radius = Math.min(width, height) / 2 * 0.8;
        
        // 既存のSVG要素をクリア
        d3.select(`#${containerId} svg`).remove();
        
        // SVG要素を作成
        this.svg = d3.select(`#${containerId}`)
            .append("svg")
            .attr("width", width)
            .attr("height", height)
            .append("g")
            .attr("transform", `translate(${width/2}, ${height/2})`);
        
        // レーダーチャートを描画
        this.drawRadarChart(this.svg, [this.chartData], radius);
        
        // ドラッグ可能なハンドルを追加
        this.addDragHandlers(this.svg, this.chartData, radius);
        
        window.UPPS_LOG.info('Cognitive radar chart initialized');
    }
    
    /**
     * 認知能力データを準備
     * @param {Object} persona ペルソナデータ
     * @returns {Array} レーダーチャート用データ
     */
    prepareCognitiveData(persona) {
        const abilities = persona.cognitive_system.abilities;
        return [
            { axis: "言語理解", value: abilities.verbal_comprehension.level / 100, abilityId: "verbal_comprehension" },
            { axis: "知覚推理", value: abilities.perceptual_reasoning.level / 100, abilityId: "perceptual_reasoning" },
            { axis: "ワーキングメモリ", value: abilities.working_memory.level / 100, abilityId: "working_memory" },
            { axis: "処理速度", value: abilities.processing_speed.level / 100, abilityId: "processing_speed" }
        ];
    }
    
    /**
     * レーダーチャートを描画
     * @param {Object} svg D3 SVG要素
     * @param {Array} data データ配列
     * @param {number} radius 半径
     */
    drawRadarChart(svg, data, radius) {
        const cfg = this.config;
        const allAxis = data[0].map(d => d.axis);
        const total = allAxis.length;
        const angleSlice = Math.PI * 2 / total;
        
        // スケール設定
        const rScale = d3.scaleLinear()
            .range([0, radius])
            .domain([0, cfg.maxValue]);
        
        // フィルタ定義（グロー効果用）
        const filter = svg.append("defs")
            .append("filter")
            .attr("id", "glow");
            
        filter.append("feGaussianBlur")
            .attr("stdDeviation", "3")
            .attr("result", "coloredBlur");
            
        const feMerge = filter.append("feMerge");
        feMerge.append("feMergeNode").attr("in", "coloredBlur");
        feMerge.append("feMergeNode").attr("in", "SourceGraphic");
        
        // グリッド線の描画
        const axisGrid = svg.append("g").attr("class", "axis-grid");
        
        // 背景の同心円を描画
        axisGrid.selectAll(".level")
            .data(d3.range(1, cfg.levels + 1).reverse())
            .enter()
            .append("circle")
            .attr("class", "level")
            .attr("r", d => radius / cfg.levels * d)
            .style("fill", "rgba(255, 255, 255, 0.05)")
            .style("stroke", "rgba(255, 255, 255, 0.2)")
            .style("fill-opacity", cfg.opacityCircles)
            .style("filter", "url(#glow)");
        
        // 軸の描画
        const axis = axisGrid.selectAll(".axis")
            .data(allAxis)
            .enter()
            .append("g")
            .attr("class", "axis");
        
        // 軸の線を描画
        axis.append("line")
            .attr("x1", 0)
            .attr("y1", 0)
            .attr("x2", (d, i) => rScale(cfg.maxValue * 1.1) * Math.cos(angleSlice * i - Math.PI / 2))
            .attr("y2", (d, i) => rScale(cfg.maxValue * 1.1) * Math.sin(angleSlice * i - Math.PI / 2))
            .attr("class", "axis-line")
            .style("stroke", "rgba(255, 255, 255, 0.2)")
            .style("stroke-width", "2px");
        
        // 軸のラベルを描画
        axis.append("text")
            .attr("class", "legend")
            .attr("text-anchor", "middle")
            .attr("dy", "0.35em")
            .attr("x", (d, i) => rScale(cfg.maxValue * cfg.labelFactor) * Math.cos(angleSlice * i - Math.PI / 2))
            .attr("y", (d, i) => rScale(cfg.maxValue * cfg.labelFactor) * Math.sin(angleSlice * i - Math.PI / 2))
            .text(d => d)
            .style("font-size", "12px")
            .style("fill", "rgba(255, 255, 255, 0.8)");
        
        // データのプロット
        const radarWrapper = svg.selectAll(".radar-wrapper")
            .data(data)
            .enter()
            .append("g")
            .attr("class", "radar-wrapper");
        
        // 塗りつぶし領域の描画
        const radarArea = d3.areaRadial()
            .curve(d3.curveCardinalClosed)
            .radius(d => rScale(d.value))
            .angle((d, i) => i * angleSlice);
        
        radarWrapper.append("path")
            .attr("class", "radar-area")
            .attr("d", d => radarArea(d))
            .style("fill", (d, i) => cfg.color(i))
            .style("fill-opacity", cfg.opacityArea)
            .style("stroke-width", 0);
        
        // 外枠の描画
        const radarStroke = d3.lineRadial()
            .curve(d3.curveCardinalClosed)
            .radius(d => rScale(d.value))
            .angle((d, i) => i * angleSlice);
        
        radarWrapper.append("path")
            .attr("class", "radar-stroke")
            .attr("d", d => radarStroke(d))
            .style("stroke-width", cfg.strokeWidth)
            .style("stroke", (d, i) => cfg.color(i))
            .style("fill", "none");
        
        // ポイントの描画
        radarWrapper.selectAll(".radar-circle")
            .data(d => d)
            .enter()
            .append("circle")
            .attr("class", "radar-circle")
            .attr("r", cfg.dotRadius)
            .attr("cx", (d, i) => rScale(d.value) * Math.cos(angleSlice * i - Math.PI / 2))
            .attr("cy", (d, i) => rScale(d.value) * Math.sin(angleSlice * i - Math.PI / 2))
            .style("fill", (d, i, j) => cfg.color(j))
            .style("fill-opacity", 0.8)
            .style("cursor", "pointer");
        
        // 保存用に設定を記録
        this.currentAngleSlice = angleSlice;
        this.currentRScale = rScale;
        this.currentRadius = radius;
    }
    
    /**
     * ドラッグハンドラを追加
     * @param {Object} svg D3 SVG要素
     * @param {Array} data データ配列
     * @param {number} radius 半径
     */
    addDragHandlers(svg, data, radius) {
        const total = data.length;
        const angleSlice = Math.PI * 2 / total;
        const rScale = d3.scaleLinear().range([0, radius]).domain([0, 1]);
        
        // 各軸ごとにドラッグハンドラを作成
        for (let i = 0; i < data.length; i++) {
            const drag = d3.drag()
                .on("start", (event) => {
                    // ドラッグ開始時の処理
                    d3.select(event.sourceEvent.target).style("cursor", "grabbing");
                })
                .on("drag", (event) => {
                    // マウス位置から値を計算
                    const mouseX = event.x;
                    const mouseY = event.y;
                    
                    // 中心からの距離を計算
                    const dist = Math.sqrt(mouseX * mouseX + mouseY * mouseY);
                    
                    // 値を更新（0-1の範囲にクリップ）
                    let newValue = Math.min(1, Math.max(0, dist / radius));
                    
                    // データを更新
                    data[i].value = newValue;
                    
                    // レーダーチャートの表示を更新
                    this.updateRadarChart(svg, data, angleSlice, rScale);
                    
                    // ペルソナデータも更新
                    const editor = window.uppsEditor;
                    if (editor && window.CognitiveSystem) {
                        window.CognitiveSystem.updateCognitiveAbility(
                            editor.persona, 
                            data[i].axis, 
                            newValue * 100
                        );
                    }
                })
                .on("end", (event) => {
                    // ドラッグ終了時の処理
                    d3.select(event.sourceEvent.target).style("cursor", "pointer");
                });
            
            // ドラッグハンドルを適用
            svg.selectAll(".radar-circle")
                .filter((d, index) => index === i)
                .call(drag);
        }
        
        window.UPPS_LOG.debug('Drag handlers added to radar chart');
    }
    
    /**
     * レーダーチャートの表示を更新
     * @param {Object} svg D3 SVG要素
     * @param {Array} data データ配列
     * @param {number} angleSlice 角度スライス
     * @param {Function} rScale 半径スケール
     */
    updateRadarChart(svg, data, angleSlice, rScale) {
        // ポイント位置の更新
        svg.selectAll(".radar-circle")
            .data(data)
            .attr("cx", (d, i) => rScale(d.value) * Math.cos(angleSlice * i - Math.PI / 2))
            .attr("cy", (d, i) => rScale(d.value) * Math.sin(angleSlice * i - Math.PI / 2));
        
        // エリアの更新
        const radarArea = d3.areaRadial()
            .curve(d3.curveCardinalClosed)
            .radius(d => rScale(d.value))
            .angle((d, i) => i * angleSlice);
        
        svg.select(".radar-area")
            .datum(data)
            .attr("d", radarArea);
        
        // ストロークの更新
        const radarStroke = d3.lineRadial()
            .curve(d3.curveCardinalClosed)
            .radius(d => rScale(d.value))
            .angle((d, i) => i * angleSlice);
        
        svg.select(".radar-stroke")
            .datum(data)
            .attr("d", radarStroke);
    }
    
    /**
     * チャートデータを更新
     * @param {Object} persona ペルソナデータ
     */
    updateChartData(persona) {
        if (!this.svg || !persona?.cognitive_system?.abilities) {
            return;
        }
        
        // 新しいデータを準備
        this.chartData = this.prepareCognitiveData(persona);
        
        // チャートを更新
        this.updateRadarChart(
            this.svg, 
            this.chartData, 
            this.currentAngleSlice, 
            this.currentRScale
        );
        
        window.UPPS_LOG.debug('Radar chart data updated');
    }
    
    /**
     * チャートをリサイズ
     */
    resizeChart() {
        if (!this.chartContainer) {
            return;
        }
        
        // 新しいサイズを取得
        const width = this.chartContainer.clientWidth;
        const height = this.chartContainer.clientHeight;
        
        if (width === 0 || height === 0) {
            return;
        }
        
        // チャートを再初期化
        this.initializeCognitiveRadarChart(this.chartContainer.id);
        
        window.UPPS_LOG.debug('Radar chart resized', { width, height });
    }
    
    /**
     * チャートをクリア
     */
    clearChart() {
        if (this.chartContainer) {
            d3.select(`#${this.chartContainer.id} svg`).remove();
            this.svg = null;
            this.chartData = null;
        }
    }
    
    /**
     * チャート設定を更新
     * @param {Object} newConfig 新しい設定
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        
        // チャートを再描画
        if (this.svg && this.chartData) {
            this.clearChart();
            this.initializeCognitiveRadarChart(this.chartContainer.id);
        }
    }
    
    /**
     * エクスポート用のSVGデータを取得
     * @returns {string} SVG文字列
     */
    exportSVG() {
        if (!this.svg) {
            return null;
        }
        
        try {
            const svgElement = this.chartContainer.querySelector('svg');
            return new XMLSerializer().serializeToString(svgElement);
        } catch (error) {
            window.UPPS_LOG.error('Error exporting radar chart SVG', error);
            return null;
        }
    }
    
    /**
     * PNG画像としてエクスポート
     * @param {string} filename ファイル名
     */
    exportPNG(filename = 'cognitive-radar-chart.png') {
        const svgData = this.exportSVG();
        if (!svgData) {
            return;
        }
        
        // SVGをキャンバスに描画してPNGとしてダウンロード
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            
            // ダウンロード
            const link = document.createElement('a');
            link.download = filename;
            link.href = canvas.toDataURL('image/png');
            link.click();
        };
        
        img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    }
}

// グローバルインスタンスを作成
window.RadarChart = new RadarChartManager();

// UPPSEditorプロトタイプに関数を追加
if (typeof UPPSEditor !== 'undefined') {
    UPPSEditor.prototype.initializeCognitiveRadarChart = function() {
        window.RadarChart.initializeCognitiveRadarChart();
    };
    
    UPPSEditor.prototype.updateRadarChart = function() {
        window.RadarChart.updateChartData(this.persona);
    };
    
    UPPSEditor.prototype.resizeRadarChart = function() {
        window.RadarChart.resizeChart();
    };
}

// ウインドウリサイズ時の処理
let resizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        const editor = window.uppsEditor;
        if (editor?.activeTab === 'cognitive') {
            window.RadarChart.resizeChart();
        }
    }, 250);
});

window.UPPS_LOG.info('Radar chart module initialized');
