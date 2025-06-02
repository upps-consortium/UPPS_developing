// js/ui/modal.js
// モーダル・ダイアログシステムの管理

/**
 * モーダル管理クラス
 */
class ModalManager {
    constructor() {
        this.openModals = new Set();
        this.zIndexBase = 1000;
        this.bodyScrollPosition = 0;
    }
    
    /**
     * 汎用モーダルを表示
     * @param {Object} options モーダルオプション
     * @returns {string} モーダルID
     */
    show(options = {}) {
        const modalId = this.generateId();
        const modal = this.createModal(modalId, options);
        
        // ボディのスクロールを無効化
        this.disableBodyScroll();
        
        // DOMに追加
        document.body.appendChild(modal);
        this.openModals.add(modalId);
        
        // アニメーション
        this.animateIn(modal);
        
        // Escキーで閉じる
        this.setupEscapeClose(modalId);
        
        // Lucideアイコンの初期化
        if (window.lucide) {
            window.lucide.createIcons();
        }
        
        window.UPPS_LOG.debug('Modal shown', { id: modalId, title: options.title });
        
        return modalId;
    }
    
    /**
     * モーダル要素を作成
     * @param {string} id モーダルID
     * @param {Object} options オプション
     * @returns {HTMLElement} モーダル要素
     */
    createModal(id, options) {
        const {
            title = '',
            content = '',
            size = 'md',
            closable = true,
            showCloseButton = true,
            buttons = [],
            className = '',
            onClose = null
        } = options;
        
        const modal = document.createElement('div');
        modal.id = `modal-${id}`;
        modal.className = `modal-overlay fixed inset-0 bg-black/70 z-50 flex items-center justify-center overflow-auto`;
        modal.style.zIndex = this.zIndexBase + this.openModals.size;
        
        // サイズクラス
        const sizeClasses = {
            sm: 'max-w-md',
            md: 'max-w-2xl',
            lg: 'max-w-4xl',
            xl: 'max-w-6xl',
            full: 'max-w-full mx-4'
        };
        
        const sizeClass = sizeClasses[size] || sizeClasses.md;
        
        modal.innerHTML = `
            <div class="modal-content bg-slate-800 rounded-xl ${sizeClass} w-full mx-4 my-8 max-h-[90vh] overflow-hidden ${className}">
                ${title || showCloseButton ? `
                    <div class="modal-header flex justify-between items-center p-6 border-b border-white/10">
                        <h2 class="text-xl font-bold text-white">${this.escapeHtml(title)}</h2>
                        ${showCloseButton ? `
                            <button class="modal-close text-white/60 hover:text-white transition-colors" data-modal-id="${id}">
                                <i data-lucide="x" class="w-5 h-5"></i>
                            </button>
                        ` : ''}
                    </div>
                ` : ''}
                <div class="modal-body text-white/80 overflow-y-auto" style="max-height: calc(90vh - ${title || showCloseButton ? '80px' : '0px'} - ${buttons.length > 0 ? '80px' : '0px'});">
                    <div class="p-6">
                        ${content}
                    </div>
                </div>
                ${buttons.length > 0 ? `
                    <div class="modal-footer flex justify-end space-x-3 p-6 border-t border-white/10">
                        ${buttons.map(button => `
                            <button 
                                class="${button.class || 'glass px-4 py-2 rounded text-white hover:bg-white/10'}" 
                                data-action="${button.action || ''}"
                                data-modal-id="${id}"
                            >
                                ${button.text || 'ボタン'}
                            </button>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `;
        
        // イベントリスナーの設定
        this.setupModalEvents(modal, id, options);
        
        // 初期状態（非表示）
        modal.style.opacity = '0';
        
        return modal;
    }
    
    /**
     * モーダルイベントを設定
     * @param {HTMLElement} modal モーダル要素
     * @param {string} id モーダルID
     * @param {Object} options オプション
     */
    setupModalEvents(modal, id, options) {
        // 閉じるボタン
        const closeButton = modal.querySelector('.modal-close');
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                this.hide(id);
            });
        }
        
        // アクションボタン
        const actionButtons = modal.querySelectorAll('[data-action]');
        actionButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const action = e.target.getAttribute('data-action');
                
                if (action === 'close') {
                    this.hide(id);
                } else if (options.buttons) {
                    const buttonConfig = options.buttons.find(b => b.action === action);
                    if (buttonConfig && buttonConfig.callback) {
                        buttonConfig.callback();
                        if (buttonConfig.closeOnClick !== false) {
                            this.hide(id);
                        }
                    }
                }
            });
        });
        
        // オーバーレイクリックで閉じる
        if (options.closable !== false) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hide(id);
                }
            });
        }
    }
    
    /**
     * モーダルをアニメーション表示
     * @param {HTMLElement} modal モーダル要素
     */
    animateIn(modal) {
        const content = modal.querySelector('.modal-content');
        
        // 初期状態
        content.style.transform = 'scale(0.9) translateY(-20px)';
        content.style.opacity = '0';
        content.style.transition = 'all 0.3s ease-out';
        
        requestAnimationFrame(() => {
            modal.style.opacity = '1';
            
            requestAnimationFrame(() => {
                content.style.transform = 'scale(1) translateY(0)';
                content.style.opacity = '1';
            });
        });
    }
    
    /**
     * モーダルをアニメーション非表示
     * @param {HTMLElement} modal モーダル要素
     * @returns {Promise} アニメーション完了のPromise
     */
    animateOut(modal) {
        return new Promise((resolve) => {
            const content = modal.querySelector('.modal-content');
            
            content.style.transform = 'scale(0.9) translateY(-20px)';
            content.style.opacity = '0';
            modal.style.opacity = '0';
            
            setTimeout(() => {
                if (modal.parentNode) {
                    modal.parentNode.removeChild(modal);
                }
                resolve();
            }, 300);
        });
    }
    
    /**
     * モーダルを非表示
     * @param {string} modalId モーダルID
     */
    async hide(modalId) {
        const modal = document.getElementById(`modal-${modalId}`);
        if (!modal) return;
        
        // セットから削除
        this.openModals.delete(modalId);
        
        // アニメーションで非表示
        await this.animateOut(modal);
        
        // スクロールを復元
        if (this.openModals.size === 0) {
            this.enableBodyScroll();
        }
        
        window.UPPS_LOG.debug('Modal hidden', { id: modalId });
    }
    
    /**
     * すべてのモーダルを非表示
     */
    async hideAll() {
        const promises = Array.from(this.openModals).map(id => this.hide(id));
        await Promise.all(promises);
    }
    
    /**
     * 確認ダイアログを表示
     * @param {string} message メッセージ
     * @param {Object} options オプション
     * @returns {Promise<boolean>} ユーザーの選択結果
     */
    confirm(message, options = {}) {
        return new Promise((resolve) => {
            const {
                title = '確認',
                confirmText = 'OK',
                cancelText = 'キャンセル',
                type = 'info'
            } = options;
            
            // アイコンを選択
            const icons = {
                info: 'info',
                warning: 'alert-triangle',
                danger: 'alert-circle',
                success: 'check-circle'
            };
            
            const icon = icons[type] || icons.info;
            
            const modalId = this.show({
                title,
                size: 'sm',
                content: `
                    <div class="text-center">
                        <div class="mx-auto flex items-center justify-center w-12 h-12 rounded-full bg-${type === 'danger' ? 'red' : type === 'warning' ? 'yellow' : 'blue'}-100 mb-4">
                            <i data-lucide="${icon}" class="w-6 h-6 text-${type === 'danger' ? 'red' : type === 'warning' ? 'yellow' : 'blue'}-600"></i>
                        </div>
                        <p class="text-white">${this.escapeHtml(message)}</p>
                    </div>
                `,
                buttons: [
                    {
                        text: cancelText,
                        action: 'cancel',
                        class: 'glass px-4 py-2 rounded text-white hover:bg-white/10',
                        callback: () => resolve(false)
                    },
                    {
                        text: confirmText,
                        action: 'confirm',
                        class: `px-4 py-2 rounded text-white ${type === 'danger' ? 'bg-red-500 hover:bg-red-600' : 'bg-indigo-500 hover:bg-indigo-600'}`,
                        callback: () => resolve(true)
                    }
                ]
            });
        });
    }
    
    /**
     * ヘルプドキュメントを表示（未定義関数解決）
     */
    showHelpDocumentation() {
        const helpContent = `
            <div class="space-y-6">
                <section>
                    <h3 class="text-lg font-semibold text-white mb-3">UPPSペルソナエディターについて</h3>
                    <p class="text-white/80 mb-4">
                        このツールはUnified Personality Profile Standard (UPPS)に基づくペルソナプロファイルを
                        編集するためのものです。感情システム、記憶システム、関連性などを統合的に管理できます。
                    </p>
                </section>
                
                <section>
                    <h3 class="text-lg font-semibold text-white mb-3">主な機能</h3>
                    <div class="space-y-2">
                        <div class="flex items-start space-x-3">
                            <i data-lucide="heart" class="w-5 h-5 text-red-400 mt-0.5"></i>
                            <div>
                                <strong class="text-white">感情システム:</strong>
                                <span class="text-white/80">基本感情のベースライン値と説明を設定</span>
                            </div>
                        </div>
                        <div class="flex items-start space-x-3">
                            <i data-lucide="database" class="w-5 h-5 text-blue-400 mt-0.5"></i>
                            <div>
                                <strong class="text-white">記憶システム:</strong>
                                <span class="text-white/80">異なるタイプの記憶を作成・管理</span>
                            </div>
                        </div>
                        <div class="flex items-start space-x-3">
                            <i data-lucide="network" class="w-5 h-5 text-green-400 mt-0.5"></i>
                            <div>
                                <strong class="text-white">関連性ネットワーク:</strong>
                                <span class="text-white/80">感情と記憶の間の関連性を設定</span>
                            </div>
                        </div>
                        <div class="flex items-start space-x-3">
                            <i data-lucide="activity" class="w-5 h-5 text-purple-400 mt-0.5"></i>
                            <div>
                                <strong class="text-white">認知能力:</strong>
                                <span class="text-white/80">WAIS-IVモデルに基づく認知能力の設定</span>
                            </div>
                        </div>
                        <div class="flex items-start space-x-3">
                            <i data-lucide="eye" class="w-5 h-5 text-cyan-400 mt-0.5"></i>
                            <div>
                                <strong class="text-white">ビジュアライザ:</strong>
                                <span class="text-white/80">関連性を視覚的に表示・編集</span>
                            </div>
                        </div>
                    </div>
                </section>
                
                <section>
                    <h3 class="text-lg font-semibold text-white mb-3">ビジュアライザの使い方</h3>
                    <div class="bg-white/5 rounded-lg p-4 space-y-2">
                        <div class="flex items-center space-x-2">
                            <kbd class="px-2 py-1 text-xs bg-white/10 rounded">ドラッグ</kbd>
                            <span class="text-white/80">ノードの配置を調整</span>
                        </div>
                        <div class="flex items-center space-x-2">
                            <kbd class="px-2 py-1 text-xs bg-white/10 rounded">クリック</kbd>
                            <span class="text-white/80">ノードを選択して詳細表示</span>
                        </div>
                        <div class="flex items-center space-x-2">
                            <kbd class="px-2 py-1 text-xs bg-white/10 rounded">Alt</kbd>
                            <span class="text-white/80">+</span>
                            <kbd class="px-2 py-1 text-xs bg-white/10 rounded">ドラッグ</kbd>
                            <span class="text-white/80">新しい関連性を作成</span>
                        </div>
                        <div class="flex items-center space-x-2">
                            <kbd class="px-2 py-1 text-xs bg-white/10 rounded">右クリック</kbd>
                            <span class="text-white/80">コンテキストメニューを表示</span>
                        </div>
                        <div class="flex items-center space-x-2">
                            <i data-lucide="zoom-in" class="w-4 h-4 text-white/60"></i>
                            <span class="text-white/80">右上のボタンで拡大・縮小</span>
                        </div>
                    </div>
                </section>
                
                <section>
                    <h3 class="text-lg font-semibold text-white mb-3">データの保存と読み込み</h3>
                    <div class="space-y-3">
                        <p class="text-white/80">
                            画面上部の保存ボタンで現在のペルソナをJSONファイルとして保存できます。
                            また、プレビューパネルからは、JSONまたはYAML形式でエクスポートすることも可能です。
                        </p>
                        <div class="bg-blue-500/20 border border-blue-500/30 rounded-lg p-3">
                            <div class="flex items-center space-x-2 mb-2">
                                <i data-lucide="info" class="w-4 h-4 text-blue-400"></i>
                                <strong class="text-blue-400">自動保存</strong>
                            </div>
                            <p class="text-white/80 text-sm">
                                30秒ごとに自動保存されるため、ブラウザを閉じても作業を失うことはありません。
                            </p>
                        </div>
                    </div>
                </section>
                
                <section>
                    <h3 class="text-lg font-semibold text-white mb-3">トラブルシューティング</h3>
                    <div class="space-y-3">
                        <div>
                            <h4 class="text-white font-medium mb-1">変更が保存されない場合</h4>
                            <p class="text-white/70 text-sm">ブラウザのストレージ容量を確認してください。</p>
                        </div>
                        <div>
                            <h4 class="text-white font-medium mb-1">ビジュアライザが表示されない場合</h4>
                            <p class="text-white/70 text-sm">ブラウザを更新してみてください。</p>
                        </div>
                        <div>
                            <h4 class="text-white font-medium mb-1">IDの重複エラーが表示された場合</h4>
                            <p class="text-white/70 text-sm">一意のIDを設定してください。</p>
                        </div>
                    </div>
                </section>
                
                <section>
                    <h3 class="text-lg font-semibold text-white mb-3">キーボードショートカット</h3>
                    <div class="grid grid-cols-2 gap-3 text-sm">
                        <div class="flex items-center justify-between">
                            <span class="text-white/80">保存</span>
                            <kbd class="px-2 py-1 bg-white/10 rounded">Ctrl+S</kbd>
                        </div>
                        <div class="flex items-center justify-between">
                            <span class="text-white/80">ヘルプ</span>
                            <kbd class="px-2 py-1 bg-white/10 rounded">F1</kbd>
                        </div>
                        <div class="flex items-center justify-between">
                            <span class="text-white/80">取り消し</span>
                            <kbd class="px-2 py-1 bg-white/10 rounded">Ctrl+Z</kbd>
                        </div>
                        <div class="flex items-center justify-between">
                            <span class="text-white/80">検索</span>
                            <kbd class="px-2 py-1 bg-white/10 rounded">Ctrl+F</kbd>
                        </div>
                    </div>
                </section>
            </div>
        `;
        
        return this.show({
            title: 'UPPSペルソナエディター ヘルプドキュメント',
            content: helpContent,
            size: 'lg',
            buttons: [
                {
                    text: '閉じる',
                    action: 'close',
                    class: 'bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg'
                }
            ]
        });
    }
    
    /**
     * タブ固有のヘルプを表示（未定義関数解決）
     * @param {string} tabId タブID
     */
    showTabHelp(tabId) {
        const helpData = this.getTabHelpData(tabId);
        
        if (!helpData) {
            window.NotificationManager?.warning('このタブのヘルプは現在準備中です');
            return;
        }
        
        const content = `
            <div class="space-y-4">
                <div class="flex items-center space-x-3 mb-4">
                    <i data-lucide="${helpData.icon}" class="w-6 h-6 text-${helpData.color}-400"></i>
                    <h3 class="text-lg font-semibold text-white">${helpData.title}</h3>
                </div>
                
                <p class="text-white/80">${helpData.description}</p>
                
                ${helpData.features ? `
                    <div>
                        <h4 class="text-white font-medium mb-2">主な機能</h4>
                        <ul class="space-y-1">
                            ${helpData.features.map(feature => `
                                <li class="flex items-start space-x-2">
                                    <i data-lucide="check" class="w-4 h-4 text-green-400 mt-0.5"></i>
                                    <span class="text-white/80 text-sm">${feature}</span>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                ` : ''}
                
                ${helpData.tips ? `
                    <div>
                        <h4 class="text-white font-medium mb-2">使い方のコツ</h4>
                        <div class="space-y-2">
                            ${helpData.tips.map(tip => `
                                <div class="flex items-start space-x-2">
                                    <i data-lucide="lightbulb" class="w-4 h-4 text-yellow-400 mt-0.5"></i>
                                    <span class="text-white/80 text-sm">${tip}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
                
                ${helpData.warnings ? `
                    <div class="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-3">
                        <h4 class="text-yellow-400 font-medium mb-2 flex items-center space-x-2">
                            <i data-lucide="alert-triangle" class="w-4 h-4"></i>
                            <span>注意事項</span>
                        </h4>
                        <ul class="space-y-1">
                            ${helpData.warnings.map(warning => `
                                <li class="text-yellow-200 text-sm">• ${warning}</li>
                            `).join('')}
                        </ul>
                    </div>
                ` : ''}
            </div>
        `;
        
        return this.show({
            title: `${helpData.title} - ヘルプ`,
            content,
            size: 'md',
            buttons: [
                {
                    text: '閉じる',
                    action: 'close',
                    class: 'bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg'
                }
            ]
        });
    }
    
    /**
     * タブ固有のヘルプデータを取得
     * @param {string} tabId タブID
     * @returns {Object|null} ヘルプデータ
     */
    getTabHelpData(tabId) {
        const helpData = {
            basic: {
                title: '基本情報',
                icon: 'user',
                color: 'blue',
                description: 'ペルソナの基本的なプロフィール情報を設定します。名前、年齢、性別、職業、背景を入力してください。',
                features: [
                    '個人の基本属性の設定',
                    '背景情報の詳細記述',
                    '自動バリデーション機能'
                ],
                tips: [
                    '名前は必須項目です',
                    '背景は具体的で詳細に記述すると、より豊かなペルソナになります',
                    '年齢は0〜120の範囲で入力してください'
                ]
            },
            emotion: {
                title: '感情システム',
                icon: 'heart',
                color: 'red',
                description: 'Ekmanの6基本感情モデルに基づいて、各感情のベースライン値を設定します。',
                features: [
                    '6つの基本感情の管理（喜び、悲しみ、怒り、恐怖、嫌悪、驚き）',
                    'ベースライン値の調整（0〜100%）',
                    '感情説明の編集',
                    '現在の感情状態の表示'
                ],
                tips: [
                    'ベースライン値はその感情の「通常の強さ」を表します',
                    '現在の感情状態はベースラインから自動生成されます',
                    'ベースラインから同期ボタンで値をリセットできます'
                ],
                warnings: [
                    '他の感情モデル（Plutchik、PAD）は現在開発中です'
                ]
            },
            personality: {
                title: '性格特性',
                icon: 'brain',
                color: 'purple',
                description: 'Big Fiveモデルに基づいて5つの主要な性格特性を設定します。',
                features: [
                    '開放性：新しい経験への好奇心',
                    '誠実性：計画性と責任感',
                    '外向性：社交性と活動性',
                    '協調性：他者との協力性',
                    '神経症的傾向：情緒の安定性'
                ],
                tips: [
                    '各特性は0〜1の範囲で設定します',
                    'バランスの取れた設定が現実的なペルソナを作ります',
                    '特性の説明を参考にして適切な値を設定してください'
                ]
            },
            memory: {
                title: '記憶システム',
                icon: 'database',
                color: 'blue',
                description: '異なるタイプの記憶を作成・管理します。各記憶には内容、時期、感情的価値を設定できます。',
                features: [
                    'エピソード記憶：個人的な出来事や経験',
                    '意味記憶：一般的な知識や概念',
                    '手続き記憶：スキルやタスクの実行方法',
                    '自伝的記憶：ライフストーリーを形成する重要な記憶'
                ],
                tips: [
                    '記憶IDは英数字とアンダースコアのみ使用可能です',
                    '感情的価値は0（ネガティブ）〜1（ポジティブ）で設定します',
                    '具体的で詳細な記憶内容が豊かなペルソナを作ります'
                ],
                warnings: [
                    '記憶を削除すると関連する関連性も削除されます'
                ]
            },
            association: {
                title: '関連性ネットワーク',
                icon: 'network',
                color: 'green',
                description: '感情と記憶の間の関連性を定義します。トリガー条件とレスポンスを設定できます。',
                features: [
                    'シンプルな関連性：記憶→感情、感情→感情',
                    '複合条件：複数の条件をAND/ORで組み合わせ',
                    '外部トリガー：トピック、環境、キーワード',
                    'ビジュアルエディタ：関連性の視覚的編集'
                ],
                tips: [
                    'Alt+ドラッグで新しい関連性を作成できます',
                    '関連強度は関連性の影響の強さを表します',
                    '複合条件で複雑な心理状態をモデル化できます'
                ],
                warnings: [
                    'ビジュアルエディタは多くのノードがあると重くなる場合があります'
                ]
            },
            cognitive: {
                title: '認知能力',
                icon: 'activity',
                color: 'purple',
                description: 'WAIS-IVモデルに基づいて4つの主要な認知能力を設定します。',
                features: [
                    '言語理解：言語による情報処理能力',
                    '知覚推理：視覚的情報の分析能力',
                    'ワーキングメモリ：情報の一時保持・操作能力',
                    '処理速度：情報処理の効率性',
                    'レーダーチャート：能力の視覚的表示'
                ],
                tips: [
                    'レーダーチャート上のポイントをドラッグして値を調整できます',
                    '各能力は0〜100%の範囲で設定します',
                    'バランスの取れた能力設定が推奨されます'
                ],
                warnings: [
                    '他の認知モデル（CHC、カスタム）は現在開発中です'
                ]
            }
        };
        
        return helpData[tabId] || null;
    }
    
    /**
     * ボディスクロールを無効化
     */
    disableBodyScroll() {
        this.bodyScrollPosition = window.pageYOffset;
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.top = `-${this.bodyScrollPosition}px`;
        document.body.style.width = '100%';
    }
    
    /**
     * ボディスクロールを有効化
     */
    enableBodyScroll() {
        document.body.style.removeProperty('overflow');
        document.body.style.removeProperty('position');
        document.body.style.removeProperty('top');
        document.body.style.removeProperty('width');
        window.scrollTo(0, this.bodyScrollPosition);
    }
    
    /**
     * Escapeキーでモーダルを閉じる
     * @param {string} modalId モーダルID
     */
    setupEscapeClose(modalId) {
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                this.hide(modalId);
                document.removeEventListener('keydown', handleEscape);
            }
        };
        
        document.addEventListener('keydown', handleEscape);
    }
    
    /**
     * HTMLエスケープ
     * @param {string} text テキスト
     * @returns {string} エスケープされたテキスト
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    /**
     * 一意なIDを生成
     * @returns {string} ID
     */
    generateId() {
        return 'modal_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    /**
     * モーダルシステムをクリーンアップ
     */
    cleanup() {
        this.hideAll();
        this.enableBodyScroll();
        window.UPPS_LOG.debug('Modal system cleaned up');
    }
}

// グローバルインスタンスを作成
window.ModalManager = new ModalManager();

// グローバル関数として未定義関数を解決
window.showHelpDocumentation = function() {
    window.ModalManager.showHelpDocumentation();
};

window.showTabHelp = function(tabId) {
    window.ModalManager.showTabHelp(tabId);
};

// UPPSEditorプロトタイプに関数を追加
if (typeof UPPSEditor !== 'undefined') {
    UPPSEditor.prototype.showHelpModal = function() {
        this.showHelp = true;
    };
    
    UPPSEditor.prototype.closeHelpModal = function() {
        this.showHelp = false;
    };
    
    UPPSEditor.prototype.showModal = function(options) {
        return window.ModalManager.show(options);
    };
    
    UPPSEditor.prototype.hideModal = function(modalId) {
        return window.ModalManager.hide(modalId);
    };
    
    UPPSEditor.prototype.showConfirm = function(message, options = {}) {
        return window.ModalManager.confirm(message, options);
    };
}

// ページアンロード時のクリーンアップ
window.addEventListener('beforeunload', () => {
    window.ModalManager.cleanup();
});

window.UPPS_LOG.info('Modal system module initialized');
