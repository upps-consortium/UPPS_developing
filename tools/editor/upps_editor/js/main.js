// main.js (続き)

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
                    <li>認知能力：WAIS-IVモデルに基づく認知能力の表現</li>
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
