// visualizer.js (続き - 認知能力レーダーチャート実装)

// 認知能力レーダーチャートの実装
function initializeCognitiveRadarChart() {
    if (!document.getElementById('cognitive-radar-chart')) return;
    
    // データの準備
    const abilities = this.persona.cognitive_system.abilities;
    const data = [
        {axis: "言語理解", value: abilities.verbal_comprehension.level / 100},
        {axis: "知覚推理", value: abilities.perceptual_reasoning.level / 100},
        {axis: "ワーキングメモリ", value: abilities.working_memory.level / 100},
        {axis: "処理速度", value: abilities.processing_speed.level / 100}
    ];
    
    // チャートのサイズ設定
    const width = document.getElementById('cognitive-radar-chart').clientWidth;
    const height = document.getElementById('cognitive-radar-chart').clientHeight;
    const radius = Math.min(width, height) / 2 * 0.8;
    
    // SVG要素のクリアと作成
    d3.select("#cognitive-radar-chart svg").remove();
    const svg = d3.select("#cognitive-radar-chart")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${width/2}, ${height/2})`);
    
    // レーダーチャートの設定
    const radarChart = radarChartFunc()
        .radius(radius)
        .levels(5)
        .maxValue(1)
        .color(d3.scaleOrdinal().range(["#4F46E5"]));
    
    // チャートの描画
    radarChart(svg, [data]);
    
    // ドラッグ可能なハンドルの追加
    addDragHandlers(svg, data, radius);
}

// レーダーチャート関数の実装
function radarChartFunc() {
    // 設定のデフォルト値
    let margin = {top: 10, right: 10, bottom: 10, left: 10},
        width = 600,
        height = 600,
        radius = Math.min(width, height) / 2,
        levels = 3,
        maxValue = 0,
        labelFactor = 1.25,
        wrapWidth = 60,
        opacityArea = 0.35,
        dotRadius = 6,
        opacityCircles = 0.1,
        strokeWidth = 2,
        roundStrokes = false,
        color = d3.scaleOrdinal(d3.schemeCategory10);
    
    // 実際の描画関数
    function chart(selection, data) {
        let allAxis = data[0].map(d => d.axis),
            total = allAxis.length,
            radius = width / 2,
            angleSlice = Math.PI * 2 / total;
        
        // スケール設定
        let rScale = d3.scaleLinear()
            .range([0, radius])
            .domain([0, maxValue]);
        
        // グリッド線の描画
        let axisGrid = selection.append("g").attr("class", "axis-grid");
        
        // 背景の同心円を描画
        axisGrid.selectAll(".level")
            .data(d3.range(1, levels + 1).reverse())
            .enter()
            .append("circle")
            .attr("class", "level")
            .attr("r", d => radius / levels * d)
            .style("fill", "#CDCDCD")
            .style("stroke", "#CDCDCD")
            .style("fill-opacity", opacityCircles)
            .style("filter", "url(#glow)");
        
        // 軸の描画
        let axis = axisGrid.selectAll(".axis")
            .data(allAxis)
            .enter()
            .append("g")
            .attr("class", "axis");
        
        // 軸の線を描画
        axis.append("line")
            .attr("x1", 0)
            .attr("y1", 0)
            .attr("x2", (d, i) => rScale(maxValue * 1.1) * Math.cos(angleSlice * i - Math.PI / 2))
            .attr("y2", (d, i) => rScale(maxValue * 1.1) * Math.sin(angleSlice * i - Math.PI / 2))
            .attr("class", "line")
            .style("stroke", "white")
            .style("stroke-width", "2px");
        
        // 軸のラベルを描画
        axis.append("text")
            .attr("class", "legend")
            .attr("text-anchor", "middle")
            .attr("dy", "0.35em")
            .attr("x", (d, i) => rScale(maxValue * labelFactor) * Math.cos(angleSlice * i - Math.PI / 2))
            .attr("y", (d, i) => rScale(maxValue * labelFactor) * Math.sin(angleSlice * i - Math.PI / 2))
            .text(d => d)
            .style("font-size", "12px")
            .style("fill", "white");
        
        // データのプロット
        let radarWrapper = selection.selectAll(".radar-wrapper")
            .data(data)
            .enter()
            .append("g")
            .attr("class", "radar-wrapper");
        
        // 塗りつぶし領域の描画
        let radarArea = d3.areaRadial()
            .curve(d3.curveCardinalClosed)
            .radius(d => rScale(d.value))
            .angle((d, i) => i * angleSlice);
        
        radarWrapper.append("path")
            .attr("class", "radar-area")
            .attr("d", d => {
                return radarArea(d);
            })
            .style("fill", (d, i) => color(i))
            .style("fill-opacity", opacityArea)
            .style("stroke-width", 0);
        
        // 外枠の描画
        let radarStroke = d3.lineRadial()
            .curve(d3.curveCardinalClosed)
            .radius(d => rScale(d.value))
            .angle((d, i) => i * angleSlice);
        
        radarWrapper.append("path")
            .attr("class", "radar-stroke")
            .attr("d", d => radarStroke(d))
            .style("stroke-width", strokeWidth)
            .style("stroke", (d, i) => color(i))
            .style("fill", "none");
        
        // ポイントの描画
        radarWrapper.selectAll(".radar-circle")
            .data(d => d)
            .enter()
            .append("circle")
            .attr("class", "radar-circle")
            .attr("r", dotRadius)
            .attr("cx", (d, i) => rScale(d.value) * Math.cos(angleSlice * i - Math.PI / 2))
            .attr("cy", (d, i) => rScale(d.value) * Math.sin(angleSlice * i - Math.PI / 2))
            .style("fill", (d, i, j) => color(j))
            .style("fill-opacity", 0.8);
    }
    
    // 設定項目のセッターメソッド
    chart.margin = function(_) {
        if (!arguments.length) return margin;
        margin = _;
        return chart;
    };
    
    chart.width = function(_) {
        if (!arguments.length) return width;
        width = _;
        return chart;
    };
    
    chart.height = function(_) {
        if (!arguments.length) return height;
        height = _;
        return chart;
    };
    
    chart.radius = function(_) {
        if (!arguments.length) return radius;
        radius = _;
        return chart;
    };
    
    chart.levels = function(_) {
        if (!arguments.length) return levels;
        levels = _;
        return chart;
    };
    
    chart.maxValue = function(_) {
        if (!arguments.length) return maxValue;
        maxValue = _;
        return chart;
    };
    
    chart.color = function(_) {
        if (!arguments.length) return color;
        color = _;
        return chart;
    };
    
    return chart;
}

// 認知能力値を更新するドラッグハンドラ
function addDragHandlers(svg, data, radius) {
    const total = data.length;
    const angleSlice = Math.PI * 2 / total;
    
    // スケール設定
    const rScale = d3.scaleLinear()
        .range([0, radius])
        .domain([0, 1]);
    
    // 各軸ごとにドラッグハンドラを作成
    for (let i = 0; i < data.length; i++) {
        // ドラッグ処理
        const drag = d3.drag()
            .on("drag", function(event) {
                // マウス位置から値を計算
                const mouseX = event.x;
                const mouseY = event.y;
                
                // 中心からの距離を計算
                const dist = Math.sqrt(mouseX * mouseX + mouseY * mouseY);
                
                // 値を更新（0-1の範囲にクリップ）
                let newValue = Math.min(1, Math.max(0, dist / radius));
                
                // データを更新
                data[i].value = newValue;
                
                // 表示を更新
                updateRadarChart(svg, data, angleSlice, rScale);
                
                // ペルソナデータも更新
                window.uppsEditor.updateCognitiveAbility(data[i].axis, newValue * 100);
            });
        
        // ドラッグハンドルを適用
        svg.selectAll(".radar-circle")
            .filter((d, index) => index === i)
            .call(drag);
    }
}

// レーダーチャートの表示を更新
function updateRadarChart(svg, data, angleSlice, rScale) {
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

// ウインドウリサイズ時のレーダーチャート再描画
function setupCognitiveChartResize() {
    window.addEventListener('resize', debounce(() => {
        if (this.activeTab === 'cognitive') {
            this.initializeCognitiveRadarChart();
        }
    }, 250));
}

// デバウンス関数
function debounce(func, wait, immediate) {
    let timeout;
    return function() {
        const context = this, args = arguments;
        const later = function() {
            timeout = null;
            if (!immediate) func.apply(context, args);
        };
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(context, args);
    };
}
