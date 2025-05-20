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
            const jsonString = JSON.stringify(this.persona, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const fileName = `${this.persona.personal_info.name || 'persona'}_${new Date().toISOString().slice(0, 10)}.json`;
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = fileName;
            link.click();
            
            URL.revokeObjectURL(link.href);
            
            this.showNotification('JSONファイルをエクスポートしました', 'success');
        },
        
        // YAMLエクスポート
        exportYAML() {
            const yamlString = jsyaml.dump(this.persona, {
                indent: 2,
                lineWidth: -1,
                noRefs: true,
                sortKeys: true
            });
            
            const blob = new Blob([yamlString], { type: 'text/yaml' });
            const fileName = `${this.persona.personal_info.name || 'persona'}_${new Date().toISOString().slice(0, 10)}.yaml`;
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = fileName;
            link.click();
            
            URL.revokeObjectURL(link.href);
            
            this.showNotification('YAMLファイルをエクスポートしました', 'success');
        },
        
        // ヘルプドキュメントの表示
        showHelpDocumentation() {
            // ヘルプドキュメントの内容
            const helpDocContent = `
                <h1 class="text-2xl font-bold text-white mb-6">UPPSペルソナエディター ヘルプドキュメント</h1>
                
                <h2 class="text-xl font-semibold text-white mt-8 mb-4">はじめに</h2>
                <p class="text-white/80 mb-4">
                    このエディターは、Unified Personality Profile Standard (UPPS) に基づいたペルソナプロファイルを
                    作成・編集するためのツールです。UPPS規格に準拠した豊かな人格表現が可能になります。
                </p>
                
                <h2 class="text-xl font-semibold text-white mt-8 mb-4">メインコンセプト</h2>
                <p class="text-white/80 mb-4">
                    UPPSは以下の重要な構成要素からなります：
                </p>
                <ul class="list-disc pl-6 text-white/80 space-y-2 mb-4">
                    <li>基本情報：名前、年齢、性別などの基本プロフィール</li>
                    <li>性格特性：BigFiveモデルに基づく性格特性</li>
                    <li>感情システム：基本感情とそのベースライン値の定義</li>
                    <li>記憶システム：異なるタイプの記憶の構造化表現</li>
                    <li>関連性ネットワーク：感情と記憶の相互作用の定義</li>
                    <li>認知能力：WAIS-IVモデルに基づく能力表現</li>
                </ul>
                
                <h2 class="text-xl font-semibold text-white mt-8 mb-4">使い方ガイド</h2>
                <h3 class="text-lg font-medium text-white mt-6 mb-2">基本的な操作</h3>
                <ul class="list-disc pl-6 text-white/80 space-y-2 mb-4">
                    <li>上部のタブを使って各セクションを切り替えます。</li>
                    <li>必須項目はすべて入力してください。</li>
                    <li>定期的に保存することをお勧めします（自動保存も30秒ごとに行われます）。</li>
                    <li>エクスポートはJSONまたはYAML形式で行えます。</li>
                </ul>
                
                <h3 class="text-lg font-medium text-white mt-6 mb-2">ビジュアルエディタの使い方</h3>
                <ul class="list-disc pl-6 text-white/80 space-y-2 mb-4">
                    <li>ノードをドラッグして移動できます。</li>
                    <li>ノードをクリックして選択すると、詳細情報を編集できます。</li>
                    <li>Alt+ドラッグで新しい関連性を作成できます。</li>
                    <li>右クリックで追加のコンテキストメニューを表示します。</li>
                    <li>ミニマップを使って全体を把握できます。</li>
                </ul>
                
                <h2 class="text-xl font-semibold text-white mt-8 mb-4">トラブルシューティング</h2>
                <h3 class="text-lg font-medium text-white mt-6 mb-2">一般的な問題</h3>
                <ul class="list-disc pl-6 text-white/80 space-y-2 mb-4">
                    <li>変更が保存されない場合は、ブラウザのストレージ容量を確認してください。</li>
                    <li>ビジュアライザが表示されない場合は、ブラウザを更新してみてください。</li>
                    <li>IDの重複エラーが表示された場合は、一意のIDを設定してください。</li>
                </ul>
            `;
            
            // モーダルの作成
            const modal = document.createElement('div');
            modal.className = 'fixed inset-0 bg-black/80 z-50 flex items-center justify-center overflow-auto';
            modal.innerHTML = `
                <div class="bg-slate-800 rounded-xl max-w-4xl w-full mx-4 my-8 p-6">
                    <div class="flex justify-between items-center mb-4">
                        <h2 class="text-xl font-bold text-white">ヘルプドキュメント</h2>
                        <button id="close-help-doc" class="text-white/60 hover:text-white">
                            <i data-lucide="x" class="w-5 h-5"></i>
                        </button>
                    </div>
                    <div class="text-white/80 max-h-[70vh] overflow-y-auto pr-2">
                        ${helpDocContent}
                    </div>
                    <div class="mt-6 flex justify-end">
                        <button id="close-help-doc-button" class="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg transition">
                            閉じる
                        </button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            // Lucideアイコンの初期化
            if (window.lucide) window.lucide.createIcons();
            
            // イベントリスナーの設定
            document.getElementById('close-help-doc').addEventListener('click', () => {
                modal.remove();
            });
            
            document.getElementById('close-help-doc-button').addEventListener('click', () => {
                modal.remove();
            });
        }
    };
}

// メモリIDの更新関数
function updateMemoryId(oldId, newId) {
    if (!oldId || !newId || oldId === newId) return;
    
    // 1. 記憶オブジェクトのID更新（念のため）
    const memories = this.persona.memory_system?.memories || [];
    const memoryIndex = memories.findIndex(m => m.id === oldId);
    if (memoryIndex >= 0) {
        memories[memoryIndex].id = newId;
    }
    
    // 2. 関連性ネットワーク内の参照を更新
    if (this.persona.association_system && this.persona.association_system.associations) {
        this.persona.association_system.associations.forEach(assoc => {
            // トリガー側の更新
            if (assoc.trigger.type === 'memory' && assoc.trigger.id === oldId) {
                assoc.trigger.id = newId;
            }
            
            // 複合トリガー内の更新
            if (assoc.trigger.type === 'complex' && assoc.trigger.conditions) {
                assoc.trigger.conditions.forEach(cond => {
                    if (cond.type === 'memory' && cond.id === oldId) {
                        cond.id = newId;
                    }
                });
            }
            
            // レスポンス側の更新
            if (assoc.response.type === 'memory' && assoc.response.id === oldId) {
                assoc.response.id = newId;
            }
        });
    }
    
    // 3. ビジュアライザー内のノードIDの更新
    if (this.networkVisualization && this.networkVisualization.nodes) {
        this.networkVisualization.nodes.forEach(node => {
            if (node.type === 'memory' && node.memoryId === oldId) {
                node.memoryId = newId;
                node.id = `memory:${newId}`;
                node.name = newId;
            }
        });
        
        // リンクのIDも更新
        if (this.networkVisualization.links) {
            this.networkVisualization.links.forEach(link => {
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
        }
    }
    
    // 4. D3.js要素の更新
    d3.select(`#network-visualizer circle[data-id="memory:${oldId}"]`)
        .attr("data-id", `memory:${newId}`);
        
    d3.select(`#network-visualizer .label[data-id="memory:${oldId}"]`)
        .attr("data-id", `memory:${newId}`)
        .text(newId);
    
    console.log(`Memory ID updated from "${oldId}" to "${newId}"`);
    
    // 5. ビジュアライザー更新
    this.refreshVisualizer();
}

// 関連性作成ダイアログを開く関数
function openCreateLinkDialog(sourceNode, targetNode) {
    // ソースとターゲットノードの情報を取得
    const sourceType = sourceNode.type;
    const sourceId = sourceNode.emotionId || sourceNode.memoryId;
    const sourceName = sourceNode.name;
    
    const targetType = targetNode.type;
    const targetId = targetNode.emotionId || targetNode.memoryId;
    const targetName = targetNode.name;
    
    // ダイアログのコンテンツを作成
    const dialogContent = `
        <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4 mb-2">
                <div>
                    <label class="block text-white/60 text-sm mb-1">トリガー</label>
                    <div class="glass rounded p-2 text-white">${sourceName} (${sourceType})</div>
                </div>
                <div>
                    <label class="block text-white/60 text-sm mb-1">レスポンス</label>
                    <div class="glass rounded p-2 text-white">${targetName} (${targetType})</div>
                </div>
            </div>
            
            <div>
                <label class="block text-white/60 text-sm mb-1">関連強度</label>
                <input type="range" id="link-strength" min="0" max="100" value="50" 
                    class="slider w-full" style="--value: 50">
                <div class="flex justify-between">
                    <span class="text-white/60 text-xs">弱</span>
                    <span class="text-white font-medium" id="strength-value">50%</span>
                    <span class="text-white/60 text-xs">強</span>
                </div>
            </div>
        </div>
    `;
    
    // ダイアログを表示
    const dialog = document.createElement('div');
    dialog.className = 'fixed inset-0 bg-black/80 z-50 flex items-center justify-center';
    dialog.innerHTML = `
        <div class="bg-slate-800 rounded-xl max-w-md w-full mx-4 p-6">
            <div class="flex justify-between items-center mb-4">
                <h2 class="text-xl font-bold text-white">関連性を作成</h2>
                <button id="close-link-dialog" class="text-white/60 hover:text-white">
                    <i data-lucide="x" class="w-5 h-5"></i>
                </button>
            </div>
            <div class="text-white/80 mb-6">
                ${dialogContent}
            </div>
            <div class="flex justify-end space-x-3">
                <button id="cancel-link" class="glass px-4 py-2 rounded text-white/80 hover:text-white">
                    キャンセル
                </button>
                <button id="create-link" class="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg transition">
                    作成
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(dialog);
    
    // Lucideアイコンの初期化
    if (window.lucide) window.lucide.createIcons();
    
    // 強度スライダーの設定
    const strengthSlider = document.getElementById('link-strength');
    const strengthValue = document.getElementById('strength-value');
    
    strengthSlider.addEventListener('input', () => {
        const value = strengthSlider.value;
        strengthSlider.style.setProperty('--value', value);
        strengthValue.textContent = `${value}%`;
    });
    
    // キャンセルボタンのイベント
    document.getElementById('close-link-dialog').addEventListener('click', () => {
        dialog.remove();
    });
    
    document.getElementById('cancel-link').addEventListener('click', () => {
        dialog.remove();
    });
    
    // 作成ボタンのイベント
    document.getElementById('create-link').addEventListener('click', () => {
        // 関連強度を取得
        const strength = parseInt(strengthSlider.value, 10);
        
        // 関連性をペルソナに追加
        this.addAssociationToPersona(sourceType, sourceId, targetType, targetId, strength);
        
        // ビジュアライザを更新
        this.refreshVisualizer();
        
        // ダイアログを閉じる
        dialog.remove();
        
        // 成功通知を表示（通知機能があれば）
        if (typeof this.showNotification === 'function') {
            this.showNotification('関連性を作成しました', 'success');
        }
    });
}

// 関連性をペルソナに追加する関数
function addAssociationToPersona(sourceType, sourceId, targetType, targetId, strength) {
    if (!this.persona.association_system) {
        this.persona.association_system = { associations: [] };
    }
    
    // 関連性IDの生成
    const id = `assoc_${this.persona.association_system.associations.length + 1}`;
    
    // 関連性の追加
    this.persona.association_system.associations.push({
        id,
        trigger: {
            type: sourceType,
            id: sourceId,
            threshold: sourceType === 'emotion' ? 70 : undefined
        },
        response: {
            type: targetType,
            id: targetId,
            association_strength: strength
        }
    });
    
    console.log(`Association added: ${sourceType}:${sourceId} -> ${targetType}:${targetId} (${strength}%)`);
}

// UPPSEditor オブジェクトに追加関数を割り当て
UPPSEditor.prototype.updateMemoryId = updateMemoryId;
UPPSEditor.prototype.openCreateLinkDialog = openCreateLinkDialog;
UPPSEditor.prototype.addAssociationToPersona = addAssociationToPersona;

// 自動保存セットアップ関数
function setupAutoSave() {
    // 既存のタイマーをクリア
    if (this.autoSaveTimer) {
        clearInterval(this.autoSaveTimer);
    }
    
    // 30秒ごとに自動保存
    this.autoSaveTimer = setInterval(() => {
        this.saveToLocalStorage();
    }, 30000);
    
    // 自動保存ステータス表示の更新関数
    if (!this.updateAutoSaveStatus) {
        this.updateAutoSaveStatus = function(saveTime) {
            const statusElement = document.getElementById('auto-save-status');
            if (statusElement) {
                statusElement.textContent = `最終保存: ${saveTime}`;
            }
        };
    }
    
    // 初期ステータス表示
    this.updateAutoSaveStatus('初回保存前');
    
    console.log('Auto save setup completed');
}

// 追加関数をプロトタイプに割り当て
UPPSEditor.prototype.setupAutoSave = setupAutoSave;

// UPPSEditor を外部で利用できるようにグローバル変数に設定
window.UPPSEditor = UPPSEditor;// main.js
// UPPSペルソナエディターのメイン機能

// UPPSEditor の定義
function UPPSEditor() {
    return {
        // 状態変数
        persona: null,
        activeTab: 'basic',
        tabs: [
            { id: 'basic', icon: 'user', label: '基本情報' },
            { id: 'emotion', icon: 'heart', label: '感情システム' },
            { id: 'personality', icon: 'brain', label: '性格特性' },
            { id: 'memory', icon: 'database', label: '記憶システム' },
            { id: 'association', icon: 'network', label: '関連性' },
            { id: 'cognitive', icon: 'activity', label: '認知能力' }
        ],
        darkMode: true,
        errors: {},
        externalItems: {}, // 外部トリガー用のフォームデータ
        showHelp: false,
        visualEditorOpen: false,
        networkVisualization: null,
        selectedNode: null,
        selectedNodeType: null,
        selectedNodeData: null,
        
        // 初期化
        init() {
            // タブコンテンツの読み込み
            this.loadTabContent(this.activeTab);
            
            // ペルソナデータの初期化
            this.errors = {};
            
            // ローカルストレージからデータを読み込む
            const loaded = this.loadFromLocalStorage();
            if (!loaded) {
                // データがなければデフォルトで初期化
                this.initializePersona();
            }
            
            // 自動保存をセットアップ
            this.setupAutoSave();
            
            // グローバル変数の設定 (Window に参照を設定)
            window.uppsEditor = this;
            
            console.log('UPPS Persona Editor initialized');
        },
        
        // タブコンテンツの読み込み
        async loadTabContent(tabId) {
            // タブコンテンツの取得
            try {
                const response = await fetch(`js/tabs/${tabId}.html`);
                if (!response.ok) {
                    throw new Error(`Failed to load tab content: ${response.status}`);
                }
                
                const content = await response.text();
                document.getElementById('tab-content').innerHTML = content;
                
                // Lucideアイコンの初期化
                if (window.lucide) {
                    lucide.createIcons();
                }
                
                // タブ読み込み完了イベントの発火
                document.dispatchEvent(new CustomEvent('tabLoaded', { detail: { tabId } }));
                
                // 特定のタブの場合、追加の初期化
                if (tabId === 'cognitive' && this.initializeCognitiveRadarChart) {
                    setTimeout(() => {
                        this.initializeCognitiveRadarChart();
                    }, 100);
                }
                
                if (tabId === 'association' && this.visualEditorOpen) {
                    setTimeout(() => {
                        this.refreshVisualizer();
                    }, 100);
                }
            } catch (error) {
                console.error('Error loading tab content:', error);
                document.getElementById('tab-content').innerHTML = `
                    <div class="p-4 text-red-500">
                        <p>タブコンテンツの読み込みに失敗しました。</p>
                        <p>${error.message}</p>
                    </div>
                `;
            }
        },
        
        // テーマの切り替え
        toggleTheme() {
            this.darkMode = !this.darkMode;
            // テーマの適用処理（実装は省略）
        },
        
        // ヘルプモーダルの表示
        showHelpModal() {
            this.showHelp = true;
        },
        
        // ヘルプモーダルを閉じる
        closeHelpModal() {
            this.showHelp = false;
        },
        
        // ファイル読み込みダイアログの表示
        async loadFile() {
            try {
                const data = await importPersonaFromFile();
                
                // データの検証・マージ
                this.persona = this.mergeWithTemplate(data);
                
                // 通知
                this.showNotification('ファイルを読み込みました', 'success');
            } catch (error) {
                console.error('Error loading file:', error);
                this.showNotification('ファイルの読み込みに失敗しました: ' + error.message, 'error');
            }
        },
        
        // 感情ラベルの取得
        getEmotionLabel(emotionId) {
            const emotionLabels = {
                joy: '喜び',
                sadness: '悲しみ',
                anger: '怒り',
                fear: '恐怖',
                disgust: '嫌悪',
                surprise: '驚き'
            };
            
            return emotionLabels[emotionId] || emotionId;
        },
        
        // 感情アイコンの取得
        getEmotionIcon(emotionId) {
            const emotionIcons = {
                joy: 'smile',
                sadness: 'frown',
                anger: 'flame',
                fear: 'alert-circle',
                disgust: 'x-circle',
                surprise: 'zap'
            };
            
            return emotionIcons[emotionId] || 'circle';
        },
        
        // 性格特性ラベルの取得
        getTraitLabel(traitId) {
            const traitLabels = {
                openness: '開放性',
                conscientiousness: '誠実性',
                extraversion: '外向性',
                agreeableness: '協調性',
                neuroticism: '神経症的傾向'
            };
            
            return traitLabels[traitId] || traitId;
        },
        
        // 性格特性の説明を取得
        getTraitDescription(traitId) {
            const traitDescriptions = {
                openness: '新しい経験や概念に対する好奇心や興味の度合い。芸術性、想像力、創造性に関連。',
                conscientiousness: '計画性、責任感、自己制御の度合い。組織化能力、几帳面さ、勤勉さに関連。',
                extraversion: '他者との交流を好む度合い。社交性、活動性、自己主張に関連。',
                agreeableness: '他者との協力や調和を好む度合い。共感性、信頼性、利他性に関連。',
                neuroticism: '情緒不安定性の度合い。不安、怒り、抑うつなどのネガティブ感情の経験しやすさに関連。'
            };
            
            return traitDescriptions[traitId] || '';
        },
        
        // 認知能力ラベルの取得
        getAbilityLabel(abilityId) {
            const abilityLabels = {
                verbal_comprehension: '言語理解',
                perceptual_reasoning: '知覚推理',
                working_memory: 'ワーキングメモリ',
                processing_speed: '処理速度'
            };
            
            return abilityLabels[abilityId] || abilityId;
        },
        
        // 記憶の追加
        addMemory() {
            // 新しい記憶IDの生成
            const memoryId = `memory_${this.persona.memory_system.memories.length + 1}`;
            
            // 新しい記憶の追加
            this.persona.memory_system.memories.push({
                id: memoryId,
                type: 'episodic',
                content: '',
                period: '',
                emotional_valence: 0.5
            });
            
            // 通知
            this.showNotification('記憶を追加しました', 'success');
        },
        
        // 記憶の削除
        removeMemory(index) {
            // 削除前の確認
            if (confirm('この記憶を削除しますか？関連する関連性も削除されます。')) {
                const memoryId = this.persona.memory_system.memories[index].id;
                
                // 関連性の削除
                if (this.persona.association_system && this.persona.association_system.associations) {
                    this.persona.association_system.associations = this.persona.association_system.associations.filter(assoc => {
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
                        return !(triggerIsMemory || responseIsMemory || complexTriggerContainsMemory);
                    });
                }
                
                // 記憶の削除
                this.persona.memory_system.memories.splice(index, 1);
                
                // 通知
                this.showNotification('記憶を削除しました', 'success');
                
                // ビジュアライザの更新
                if (this.visualEditorOpen) {
                    this.refreshVisualizer();
                }
            }
        },

        // 関連性の追加
        addAssociation() {
            if (!this.persona.association_system) {
                this.persona.association_system = { associations: [] };
            }
            
            // 関連性IDの生成
            const id = `assoc_${this.persona.association_system.associations.length + 1}`;
            
            // 初期値の設定
            const triggerType = this.persona.memory_system.memories.length > 0 ? 'memory' : 'emotion';
            const triggerId = triggerType === 'memory' 
                ? this.persona.memory_system.memories[0]?.id || ''
                : Object.keys(this.persona.emotion_system.emotions)[0] || '';
            
            const responseType = 'emotion';
            const responseId = Object.keys(this.persona.emotion_system.emotions)[0] || '';
            
            // 関連性の追加
            this.persona.association_system.associations.push({
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
            });
            
            // 外部トリガー用のフォームデータを初期化
            this.externalItems[this.persona.association_system.associations.length - 1] = '';
            
            // 通知
            this.showNotification('関連性を追加しました', 'success');
            
            // ビジュアライザの更新
            if (this.visualEditorOpen) {
                this.refreshVisualizer();
            }
        },
        
        // 関連性の削除
        removeAssociation(index) {
            if (confirm('この関連性を削除しますか？')) {
                this.persona.association_system.associations.splice(index, 1);
                
                // 外部トリガー用のフォームデータも削除
                delete this.externalItems[index];
                
                // 通知
                this.showNotification('関連性を削除しました', 'success');
                
                // ビジュアライザの更新
                if (this.visualEditorOpen) {
                    this.refreshVisualizer();
                }
            }
        },
        
        // 複合条件の追加
        addComplexCondition(index) {
            const association = this.persona.association_system.associations[index];
            
            if (!association.trigger.conditions) {
                association.trigger.conditions = [];
            }
            
            // 記憶がある場合は記憶条件、なければ感情条件をデフォルトで追加
            const newCondition = {
                type: this.persona.memory_system?.memories?.length > 0 ? 'memory' : 'emotion'
            };
            
            if (newCondition.type === 'memory') {
                newCondition.id = this.persona.memory_system.memories[0]?.id || '';
            } else {
                newCondition.id = Object.keys(this.persona.emotion_system.emotions)[0] || '';
                newCondition.threshold = 70;
            }
            
            association.trigger.conditions.push(newCondition);
        },
        
        // 複合条件の削除
        removeComplexCondition(associationIndex, conditionIndex) {
            const association = this.persona.association_system.associations[associationIndex];
            
            if (association.trigger.conditions) {
                association.trigger.conditions.splice(conditionIndex, 1);
                
                // 条件が0になったら、デフォルトの条件を追加
                if (association.trigger.conditions.length === 0) {
                    this.addComplexCondition(associationIndex);
                }
            }
        },
        
        // ビジュアルエディタの表示切替
        toggleVisualEditor() {
            this.visualEditorOpen = !this.visualEditorOpen;
            
            if (this.visualEditorOpen) {
                // ビジュアライザの初期化
                setTimeout(() => {
                    this.initializeVisualizer();
                }, 100);
            } else {
                // 選択ノードをクリア
                this.closeNodeEditor();
            }
        },
        
        // 選択したノードのタイトル取得
        getSelectedNodeTitle() {
            if (!this.selectedNode) return '';
            
            if (this.selectedNodeType === 'emotion') {
                return `感情: ${this.getEmotionLabel(this.selectedNodeData.emotionId)}`;
            } else if (this.selectedNodeType === 'memory') {
                return `記憶: ${this.selectedNodeData.memoryId}`;
            } else if (this.selectedNodeType === 'complex') {
                return `複合条件: ${this.selectedNodeData.operator}`;
            } else if (this.selectedNodeType === 'link') {
                return '関連性';
            }
            
            return '';
        },
        
        // ノードエディタを閉じる
        closeNodeEditor() {
            this.selectedNode = null;
            this.selectedNodeType = null;
            this.selectedNodeData = null;
        },
        
        // IDで記憶を取得
        getMemoryById(memoryId) {
            return this.persona.memory_system.memories.find(memory => memory.id === memoryId) || null;
        },
        
        // リンクの強度を更新
        updateLinkStrength() {
            if (!this.selectedNodeType === 'link' || !this.selectedNodeData) return;
            
            // リンクの強度を更新
            d3.select(`#network-visualizer line[data-id="${this.selectedNodeData.id}"]`)
                .attr("stroke-width", Math.max(1, this.selectedNodeData.strength / 20));
            
            // 関連性データも更新
            const assocIndex = this.persona.association_system.associations.findIndex(assoc => {
                // トリガーとレスポンスのタイプとIDが一致するか確認
                return (
                    (assoc.trigger.type === this.selectedNodeData.source.type && 
                     (assoc.trigger.type === 'memory' ? assoc.trigger.id === this.selectedNodeData.source.memoryId :
                      assoc.trigger.type === 'emotion' ? assoc.trigger.id === this.selectedNodeData.source.emotionId : 
                      assoc.trigger.type === 'complex')) &&
                    (assoc.response.type === this.selectedNodeData.target.type &&
                     (assoc.response.type === 'memory' ? assoc.response.id === this.selectedNodeData.target.memoryId :
                      assoc.response.type === 'emotion' ? assoc.response.id === this.selectedNodeData.target.emotionId : false))
                );
            });
            
            if (assocIndex >= 0) {
                this.persona.association_system.associations[assocIndex].response.association_strength = this.selectedNodeData.strength;
            }
        },
        
        // 感情ベースラインの更新
        updateEmotionBaseline() {
            if (!this.selectedNodeType === 'emotion' || !this.selectedNodeData) return;
            
            // ノードの視覚的な更新
            d3.select(`#network-visualizer circle[data-id="${this.selectedNodeData.id}"]`)
                .attr("r", this.getNodeRadius(this.selectedNodeData));
        },
        
        // IDで関連性を検索
        findAssociationById(id) {
            return this.persona.association_system.associations.find(assoc => assoc.id === id) || null;
        },
        
        // 通知を表示する関数
        showNotification(message, type = 'info') {
            // 既存の通知を削除
            const existingNotifications = document.querySelectorAll('.notification');
            existingNotifications.forEach(notification => {
                notification.remove();
            });
            
            // 通知要素の作成
            const notification = document.createElement('div');
            notification.className = `notification notification-${type}`;
            notification.innerHTML = `
                <div class="flex items-center space-x-2">
                    <i data-lucide="${type === 'success' ? 'check-circle' : type === 'error' ? 'alert-triangle' : 'info'}" class="w-5 h-5"></i>
                    <span>${message}</span>
                </div>
            `;
            
            // ドキュメントに追加
            document.body.appendChild(notification);
            
            // Lucideアイコンの初期化
            if (window.lucide) window.lucide.createIcons();
            
            // アニメーション
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(20px)';
            notification.style.transition = 'opacity 0.3s, transform 0.3s';
            
            setTimeout(() => {
                notification.style.opacity = '1';
                notification.style.transform = 'translateX(0)';
            }, 10);
            
            // 数秒後に自動的に消す
            setTimeout(() => {
                notification.style.opacity = '0';
                notification.style.transform = 'translateX(20px)';
                
                setTimeout(() => {
                    notification.remove();
                }, 300);
            }, 4000);
        },
        
        // 自動保存タイマーの変数
        autoSaveTimer: null,
        
        // ローカルストレージに保存する関数
        saveToLocalStorage() {
            try {
                const personaData = JSON.stringify(this.persona);
                localStorage.setItem('upps_persona_data', personaData);
                
                // 保存日時を記録
                const saveTime = new Date().toLocaleTimeString();
                localStorage.setItem('upps_persona_last_saved', saveTime);
                
                // 自動保存ステータス表示を更新
                this.updateAutoSaveStatus(saveTime);
                
                console.log('Persona saved to local storage at', saveTime);
                return true;
            } catch (error) {
                console.error('Error saving to local storage:', error);
                return false;
            }
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
        
        // テンプレートとマージして不足フィールドを補完
        mergeWithTemplate(data) {
            const template = getDefaultPersona();
            return this.deepMerge(template, data);
        },
        
        // ペルソナ全体のバリデーション
        validatePersona() {
            this.errors = {};
            
            // 基本情報の検証
            if (!this.persona.personal_info.name) {
                this.errors.name = '名前は必須です';
            }
            
            // 他の検証ルールを追加...
            
            // エラーがあればfalseを返す
            return Object.keys(this.errors).length === 0;
        },
        
        // YAMLプレビューの生成
        generateYAML() {
            return jsyaml.dump(this.persona, {
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