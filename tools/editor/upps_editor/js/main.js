function UPPSEditor() {
    return {
        // 状態管理
        profile: {}, // プロファイルデータ
        activeTab: 'basic', // アクティブなタブ
        darkMode: true, // ダークモード設定
        tabs: [], // タブ定義
        externalItems: {}, // 外部アイテム一時保存用
        errors: {}, // バリデーションエラー
        
        // ビジュアルエディタ関連の状態
        visualEditorOpen: false,
        selectedNode: null,
        selectedNodeType: null,
        selectedNodeData: null,
        networkVisualization: null,

        // 初期化
        init() {
            console.log('UPPS Editor initializing...');
            
            // タブの定義 - 「current」タブを削除
            this.tabs = [
                { id: 'basic', icon: 'user', label: '基本情報' },
                { id: 'emotion', icon: 'heart', label: '感情システム' },
                { id: 'personality', icon: 'sparkles', label: '性格特性' },
                { id: 'memory', icon: 'book', label: '記憶システム' },
                { id: 'association', icon: 'network', label: '関連性' },
                { id: 'cognitive', icon: 'brain', label: '認知能力' }
            ];
            
            // プロファイルの初期化
            this.initializeProfile();
            
            // タブコンテンツをロード
            this.loadTabContent(this.activeTab);
            
            // イベントリスナーの設定
            this.$watch('activeTab', (value) => {
                this.loadTabContent(value);
            });
            
            // Lucideアイコンの初期化
            setTimeout(() => {
                if (window.lucide) {
                    window.lucide.createIcons();
                }
            }, 100);
        },
        
        // タブコンテンツを動的にロード
        loadTabContent(tabId) {
            const tabContent = document.getElementById('tab-content');
            
            // ファイルからHTMLをフェッチ
            fetch(`js/tabs/${tabId}.html`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`Failed to load tab content: ${response.status}`);
                    }
                    return response.text();
                })
                .then(html => {
                    tabContent.innerHTML = html;
                    
                    // Lucideアイコンの再初期化
                    if (window.lucide) {
                        window.lucide.createIcons();
                    }
                })
                .catch(error => {
                    console.error('Error loading tab content:', error);
                    tabContent.innerHTML = `<div class="text-center p-6 text-white/60">
                        <i data-lucide="alert-triangle" class="w-12 h-12 mx-auto mb-4"></i>
                        <p>タブコンテンツの読み込みに失敗しました</p>
                    </div>`;
                    
                    if (window.lucide) {
                        window.lucide.createIcons();
                    }
                });
        },
        
        // テーマ切り替え
        toggleTheme() {
            this.darkMode = !this.darkMode;
            
            // テーマに応じたスタイルの適用
            if (this.darkMode) {
                document.body.classList.add('dark-theme');
                document.body.classList.remove('light-theme');
            } else {
                document.body.classList.add('light-theme');
                document.body.classList.remove('dark-theme');
            }
        },
        
        // 追加: メモリオブジェクト取得ヘルパー関数
        getMemoryById(id) {
            if (!id) return null;
            const memories = this.profile.memory_system?.memories || [];
            return memories.find(m => m.id === id) || null;
        },
        
        // 追加: 感情ベースライン更新関数
        updateEmotionBaseline() {
            // ビジュアライザが開かれている場合、対応するノードを更新
            if (this.visualEditorOpen && this.selectedNodeType === 'emotion' && this.selectedNodeData) {
                const emotionId = this.selectedNodeData.emotionId;
                const baseline = this.profile.emotion_system.emotions[emotionId].baseline;
                
                // 選択中のノードデータを更新
                this.selectedNodeData.value = baseline;
                
                // ノードの視覚的な更新
                this.updateNodeInVisualizer(this.selectedNodeData);
            }
        },
        
        // 追加: ノードの視覚的更新
        updateNodeInVisualizer(nodeData) {
            if (!this.networkVisualization) return;
            
            // D3.jsを使用してノードの視覚的な属性を更新
            d3.select(`#network-visualizer circle[data-id="${nodeData.id}"]`)
                .attr("r", this.getNodeRadius(nodeData))
                .attr("fill", this.getNodeColor(nodeData));
                
            // リンクの再計算が必要な場合は行う
            this.updateAffectedLinks(nodeData);
        },
        
        // 追加: 関連するリンクの更新
        updateAffectedLinks(nodeData) {
            if (!this.networkVisualization) return;
            
            // このノードに関連するリンクを更新
            const links = this.networkVisualization.links.filter(link => 
                link.source.id === nodeData.id || link.target.id === nodeData.id
            );
            
            links.forEach(link => {
                d3.select(`#network-visualizer line[data-id="${link.id}"]`)
                    .attr("stroke-width", Math.max(1, link.strength / 20));
            });
        },
        
        // 追加: ノードの半径を取得
        getNodeRadius(node) {
            if (node.type === 'emotion') {
                return 20 + (node.value / 5); // 感情の強さに比例
            } else {
                return 25; // 記憶ノードは固定サイズ
            }
        },
        
        // 追加: ノードの色を取得
        getNodeColor(node) {
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
        },
        
        // プロファイルの保存
        saveProfile() {
            // バリデーション
            if (!this.validateProfile()) {
                console.error('Profile validation failed');
                return;
            }
            
            // JSON文字列に変換
            const jsonString = JSON.stringify(this.profile, null, 2);
            
            // Blobの作成
            const blob = new Blob([jsonString], { type: 'application/json' });
            
            // ファイル名の設定
            const fileName = `${this.profile.personal_info.name || 'profile'}_${new Date().toISOString().slice(0, 10)}.json`;
            
            // ダウンロードリンクの作成と実行
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = fileName;
            link.click();
            
            // 使用後にオブジェクトURLを解放
            URL.revokeObjectURL(link.href);
            
            console.log('Profile saved successfully');
        },
        
        // ファイルを読み込む
        loadFile() {
            // ファイル選択ダイアログを表示
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json,.yaml,.yml';
            
            input.onchange = (event) => {
                const file = event.target.files[0];
                if (!file) return;
                
                const reader = new FileReader();
                
                reader.onload = (e) => {
                    try {
                        let data;
                        
                        // ファイル形式に応じて解析
                        if (file.name.endsWith('.json')) {
                            data = JSON.parse(e.target.result);
                        } else if (file.name.endsWith('.yaml') || file.name.endsWith('.yml')) {
                            data = jsyaml.load(e.target.result);
                        } else {
                            throw new Error('Unsupported file format');
                        }
                        
                        // プロファイルデータの更新
                        this.profile = this.mergeWithTemplate(data);
                        console.log('Profile loaded successfully', this.profile);
                    } catch (error) {
                        console.error('Error loading file:', error);
                        alert('ファイルの読み込みに失敗しました: ' + error.message);
                    }
                };
                
                reader.readAsText(file);
            };
            
            input.click();
        },
        
        // data.js からの関数参照
        initializeProfile,
        handleEmotionModelChange,
        handleCognitiveModelChange,
        syncEmotionState,
        
        // UI.js からの関数参照
        getEmotionLabel,
        getEmotionIcon,
        getTraitLabel,
        getTraitDescription,
        getAbilityLabel,
        addMemory,
        removeMemory,
        addAssociation,
        removeAssociation,
        addComplexCondition,
        removeComplexCondition,
        updateComplexConditionType,
        updateExternalItems,
        getExternalConditionItems,
        updateExternalConditionItems,
        updateAssociationOptions,
        
        // ビジュアルエディタ関連メソッド
        initializeVisualizer,
        toggleVisualEditor,
        selectNode,
        getSelectedNodeTitle,
        closeNodeEditor,
        updateLinkStrength,
        zoomIn,
        zoomOut,
        resetZoom,

        // テンプレートとマージして不足フィールドを補完
        mergeWithTemplate(data) {
            const template = getDefaultProfile();
            return this.deepMerge(template, data);
        },
        
        // プロファイル全体のバリデーション
        validateProfile() {
            this.errors = {};
            
            // 基本情報の検証
            if (!this.profile.personal_info.name) {
                this.errors.name = '名前は必須です';
            }
            
            // 他の検証ルールを追加...
            
            // エラーがあればfalseを返す
            return Object.keys(this.errors).length === 0;
        },
        
        // YAMLプレビューの生成
        generateYAML() {
            return jsyaml.dump(this.profile, {
                indent: 2,
                lineWidth: -1,
                noRefs: true,
                sortKeys: true
            });
        },
        
        // 深いマージを行うヘルパー関数
        deepMerge(target, source) {
            const isObject = obj => obj && typeof obj === 'object' && !Array.isArray(obj);
            
            if (!isObject(target) || !isObject(source)) {
                return source;
            }
            
            const output = Object.assign({}, target);
            
            Object.keys(source).forEach(key => {
                if (isObject(source[key])) {
                    if (!(key in target)) {
                        Object.assign(output, { [key]: source[key] });
                    } else {
                        output[key] = this.deepMerge(target[key], source[key]);
                    }
                } else {
                    Object.assign(output, { [key]: source[key] });
                }
            });
            
            return output;
        },
        
        // JSONエクスポート
        exportJSON() {
            const jsonString = JSON.stringify(this.profile, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const fileName = `${this.profile.personal_info.name || 'profile'}_${new Date().toISOString().slice(0, 10)}.json`;
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = fileName;
            link.click();
            
            URL.revokeObjectURL(link.href);
        },
        
        // YAMLエクスポート
        exportYAML() {
            const yamlString = jsyaml.dump(this.profile, {
                indent: 2,
                lineWidth: -1,
                noRefs: true,
                sortKeys: true
            });
            
            const blob = new Blob([yamlString], { type: 'text/yaml' });
            const fileName = `${this.profile.personal_info.name || 'profile'}_${new Date().toISOString().slice(0, 10)}.yaml`;
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = fileName;
            link.click();
            
            URL.revokeObjectURL(link.href);
        }
    };
}
