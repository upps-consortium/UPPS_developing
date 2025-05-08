// main.js
// アプリケーションのメインエントリーポイント

function UPPSEditor() {
    return {
        // 状態管理
        profile: {}, // プロファイルデータ
        activeTab: 'basic', // アクティブなタブ
        darkMode: true, // ダークモード設定
        tabs: [], // タブ定義
        externalItems: {}, // 外部アイテム一時保存用
        errors: {}, // バリデーションエラー

        // 初期化
        init() {
            console.log('UPPS Editor initializing...');
            
            // タブの定義
            this.tabs = [
                { id: 'basic', icon: 'user', label: '基本情報' },
                { id: 'current-state', icon: 'activity', label: '現在の感情' },
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
            fetch(`templates/${tabId}.html`)
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
        
        // テンプレートとマージして不足フィールドを補完
        mergeWithTemplate(data) {
            const template = getDefaultProfile();
            return deepMerge(template, data);
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

// オブジェクトの深いマージを行うユーティリティ関数
function deepMerge(target, source) {
    const output = Object.assign({}, target);
    
    if (isObject(target) && isObject(source)) {
        Object.keys(source).forEach(key => {
            if (isObject(source[key])) {
                if (!(key in target)) {
                    Object.assign(output, { [key]: source[key] });
                } else {
                    output[key] = deepMerge(target[key], source[key]);
                }
            } else {
                Object.assign(output, { [key]: source[key] });
            }
        });
    }
    
    return output;
}

// オブジェクト判定
function isObject(item) {
    return (item && typeof item === 'object' && !Array.isArray(item));
}