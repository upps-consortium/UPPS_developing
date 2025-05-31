// js/utils/import.js
// ファイルインポート専用システム

/**
 * ペルソナインポート管理クラス
 */
class PersonaImporter {
    constructor() {
        this.supportedFormats = ['.json', '.yaml', '.yml'];
        this.maxFileSize = 50 * 1024 * 1024; // 50MB
        this.importHistory = [];
        this.dragAndDropEnabled = true;
    }
    
    /**
     * ファイルインポートダイアログを開く
     * @param {Object} options インポートオプション
     * @returns {Promise<Object>} インポートされたデータ
     */
    async importFromFile(options = {}) {
        const { 
            acceptedFormats = this.supportedFormats,
            maxSize = this.maxFileSize,
            showPreview = false
        } = options;
        
        return new Promise((resolve, reject) => {
            try {
                // ファイル選択ダイアログを作成
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = acceptedFormats.join(',');
                input.multiple = false;
                
                input.onchange = async (event) => {
                    try {
                        const file = event.target.files[0];
                        if (!file) {
                            reject(new Error('ファイルが選択されませんでした'));
                            return;
                        }
                        
                        // ファイルを処理
                        const result = await this.processFile(file, { maxSize, showPreview });
                        resolve(result);
                        
                    } catch (error) {
                        reject(error);
                    }
                };
                
                input.onerror = () => {
                    reject(new Error('ファイル選択でエラーが発生しました'));
                };
                
                // ファイル選択ダイアログを開く
                input.click();
                
            } catch (error) {
                reject(error);
            }
        });
    }
    
    /**
     * ファイルを処理してデータを抽出
     * @param {File} file ファイルオブジェクト
     * @param {Object} options 処理オプション
     * @returns {Promise<Object>} 処理されたデータ
     */
    async processFile(file, options = {}) {
        const { maxSize = this.maxFileSize, showPreview = false } = options;
        
        // ファイルサイズチェック
        if (file.size > maxSize) {
            throw new Error(`ファイルサイズが大きすぎます（最大: ${this.formatFileSize(maxSize)}）`);
        }
        
        // ファイル形式チェック
        if (!this.isValidFileFormat(file.name)) {
            throw new Error(`サポートされていないファイル形式です。対応形式: ${this.supportedFormats.join(', ')}`);
        }
        
        window.UPPS_LOG.info('Processing import file', { 
            fileName: file.name, 
            fileSize: file.size, 
            fileType: file.type 
        });
        
        try {
            // ファイル内容を読み込み
            const content = await this.readFileContent(file);
            
            // データを解析
            const data = await this.parseFileContent(content, file.name);
            
            // データを検証
            const validatedData = await this.validateImportData(data);
            
            // プレビューオプションが有効な場合
            if (showPreview) {
                const confirmed = await this.showImportPreview(validatedData, file.name);
                if (!confirmed) {
                    throw new Error('インポートがキャンセルされました');
                }
            }
            
            // インポート履歴に追加
            this.addToImportHistory(file.name, validatedData);
            
            window.UPPS_LOG.info('File import completed successfully', { fileName: file.name });
            
            return validatedData;
            
        } catch (error) {
            window.UPPS_LOG.error('File import failed', { 
                fileName: file.name, 
                error: error.message 
            });
            throw error;
        }
    }
    
    /**
     * ファイル内容を読み込み
     * @param {File} file ファイルオブジェクト
     * @returns {Promise<string>} ファイル内容
     */
    readFileContent(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (event) => {
                resolve(event.target.result);
            };
            
            reader.onerror = () => {
                reject(new Error('ファイルの読み込みに失敗しました'));
            };
            
            reader.onabort = () => {
                reject(new Error('ファイルの読み込みが中断されました'));
            };
            
            reader.readAsText(file);
        });
    }
    
    /**
     * ファイル内容を解析
     * @param {string} content ファイル内容
     * @param {string} fileName ファイル名
     * @returns {Promise<Object>} 解析されたデータ
     */
    async parseFileContent(content, fileName) {
        try {
            let data;
            
            if (fileName.endsWith('.json')) {
                data = JSON.parse(content);
            } else if (fileName.endsWith('.yaml') || fileName.endsWith('.yml')) {
                if (typeof jsyaml === 'undefined') {
                    throw new Error('YAML解析ライブラリが読み込まれていません');
                }
                data = jsyaml.load(content);
            } else {
                throw new Error('サポートされていないファイル形式です');
            }
            
            if (!data || typeof data !== 'object') {
                throw new Error('ファイル内容が正しいオブジェクト形式ではありません');
            }
            
            return data;
            
        } catch (error) {
            if (error instanceof SyntaxError) {
                throw new Error(`ファイル解析エラー: ${error.message}`);
            }
            throw error;
        }
    }
    
    /**
     * インポートデータを検証
     * @param {Object} data インポートデータ
     * @returns {Promise<Object>} 検証・処理されたデータ
     */
    async validateImportData(data) {
        // エクスポート情報を削除
        const { export_info, ...personaData } = data;
        
        // 基本構造の検証
        if (!this.hasValidPersonaStructure(personaData)) {
            throw new Error('ペルソナデータの構造が正しくありません');
        }
        
        // バージョン互換性チェック
        if (window.PersonaData) {
            const compatibility = window.PersonaData.checkVersionCompatibility(personaData);
            if (compatibility.warnings.length > 0) {
                window.UPPS_LOG.warn('Version compatibility issues found', compatibility.warnings);
                
                // 警告を表示（非同期）
                if (window.NotificationManager) {
                    compatibility.warnings.forEach(warning => {
                        window.NotificationManager.warning(warning);
                    });
                }
            }
        }
        
        // テンプレートとマージして不足フィールドを補完
        let completePersona;
        if (window.PersonaData) {
            completePersona = window.PersonaData.mergeWithTemplate(personaData);
        } else {
            completePersona = personaData;
        }
        
        // 参照整合性チェック
        if (window.PersonaData) {
            const integrityErrors = window.PersonaData.checkReferentialIntegrity(completePersona);
            if (integrityErrors.length > 0) {
                window.UPPS_LOG.warn('Referential integrity issues found', integrityErrors);
                
                // 重大な整合性エラーがある場合は警告
                const criticalErrors = integrityErrors.filter(error => 
                    error.includes('が存在しません')
                );
                
                if (criticalErrors.length > 0) {
                    const proceed = await this.confirmWithIntegrityIssues(criticalErrors);
                    if (!proceed) {
                        throw new Error('参照整合性の問題によりインポートがキャンセルされました');
                    }
                }
            }
        }
        
        // IDの重複チェック
        if (window.PersonaData) {
            const duplicates = window.PersonaData.checkDuplicateIds(completePersona);
            if (duplicates.length > 0) {
                window.UPPS_LOG.warn('Duplicate IDs found, will be fixed automatically', duplicates);
            }
        }
        
        // 感情状態を適切に初期化
        if (window.PersonaData) {
            completePersona = window.PersonaData.initializeEmotionState(completePersona);
        }
        
        return completePersona;
    }
    
    /**
     * 基本的なペルソナ構造を持っているかチェック
     * @param {Object} data データ
     * @returns {boolean} 有効かどうか
     */
    hasValidPersonaStructure(data) {
        const requiredFields = [
            'personal_info',
            'emotion_system',
            'personality'
        ];
        
        return requiredFields.every(field => data.hasOwnProperty(field));
    }
    
    /**
     * インポートプレビューを表示
     * @param {Object} data ペルソナデータ
     * @param {string} fileName ファイル名
     * @returns {Promise<boolean>} ユーザーの確認結果
     */
    async showImportPreview(data, fileName) {
        return new Promise((resolve) => {
            if (!window.ModalManager) {
                resolve(true); // モーダルが無い場合は自動的に許可
                return;
            }
            
            // プレビュー内容を生成
            const previewContent = this.generatePreviewContent(data);
            
            const modalId = window.ModalManager.show({
                title: 'インポートプレビュー',
                size: 'lg',
                content: `
                    <div class="space-y-4">
                        <div class="flex items-center space-x-2 mb-4">
                            <i data-lucide="file-text" class="w-5 h-5 text-blue-400"></i>
                            <span class="font-medium text-white">${fileName}</span>
                        </div>
                        
                        ${previewContent}
                        
                        <div class="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-3 mt-4">
                            <div class="flex items-center space-x-2 mb-2">
                                <i data-lucide="alert-triangle" class="w-4 h-4 text-yellow-400"></i>
                                <span class="text-yellow-400 font-medium">注意</span>
                            </div>
                            <p class="text-yellow-200 text-sm">
                                このデータをインポートすると、現在の作業内容は置き換えられます。
                                続行する前に、必要であれば現在のデータを保存してください。
                            </p>
                        </div>
                    </div>
                `,
                buttons: [
                    {
                        text: 'キャンセル',
                        action: 'cancel',
                        class: 'glass px-4 py-2 rounded text-white hover:bg-white/10',
                        callback: () => resolve(false)
                    },
                    {
                        text: 'インポート実行',
                        action: 'import',
                        class: 'bg-indigo-500 hover:bg-indigo-600 px-4 py-2 rounded text-white',
                        callback: () => resolve(true)
                    }
                ]
            });
        });
    }
    
    /**
     * プレビュー内容を生成
     * @param {Object} data ペルソナデータ
     * @returns {string} プレビューHTML
     */
    generatePreviewContent(data) {
        const sections = [];
        
        // 基本情報
        if (data.personal_info) {
            sections.push(`
                <div class="bg-white/5 rounded-lg p-3">
                    <h4 class="text-white font-medium mb-2">基本情報</h4>
                    <div class="text-white/80 text-sm space-y-1">
                        ${data.personal_info.name ? `<div>名前: ${data.personal_info.name}</div>` : ''}
                        ${data.personal_info.age ? `<div>年齢: ${data.personal_info.age}</div>` : ''}
                        ${data.personal_info.occupation ? `<div>職業: ${data.personal_info.occupation}</div>` : ''}
                    </div>
                </div>
            `);
        }
        
        // 感情システム
        if (data.emotion_system) {
            const emotionCount = Object.keys(data.emotion_system.emotions || {}).length;
            sections.push(`
                <div class="bg-white/5 rounded-lg p-3">
                    <h4 class="text-white font-medium mb-2">感情システム</h4>
                    <div class="text-white/80 text-sm">
                        <div>モデル: ${data.emotion_system.model || '未指定'}</div>
                        <div>感情数: ${emotionCount}件</div>
                    </div>
                </div>
            `);
        }
        
        // 記憶システム
        if (data.memory_system?.memories) {
            const memoryCount = data.memory_system.memories.length;
            const memoryTypes = [...new Set(data.memory_system.memories.map(m => m.type))];
            sections.push(`
                <div class="bg-white/5 rounded-lg p-3">
                    <h4 class="text-white font-medium mb-2">記憶システム</h4>
                    <div class="text-white/80 text-sm">
                        <div>記憶数: ${memoryCount}件</div>
                        <div>タイプ: ${memoryTypes.join(', ')}</div>
                    </div>
                </div>
            `);
        }
        
        // 関連性システム
        if (data.association_system?.associations) {
            const assocCount = data.association_system.associations.length;
            sections.push(`
                <div class="bg-white/5 rounded-lg p-3">
                    <h4 class="text-white font-medium mb-2">関連性ネットワーク</h4>
                    <div class="text-white/80 text-sm">
                        <div>関連性数: ${assocCount}件</div>
                    </div>
                </div>
            `);
        }
        
        // 認知能力
        if (data.cognitive_system) {
            sections.push(`
                <div class="bg-white/5 rounded-lg p-3">
                    <h4 class="text-white font-medium mb-2">認知能力</h4>
                    <div class="text-white/80 text-sm">
                        <div>モデル: ${data.cognitive_system.model || '未指定'}</div>
                    </div>
                </div>
            `);
        }
        
        return sections.join('');
    }
    
    /**
     * 参照整合性の問題について確認
     * @param {Array} errors エラーリスト
     * @returns {Promise<boolean>} ユーザーの確認結果
     */
    async confirmWithIntegrityIssues(errors) {
        if (!window.ModalManager) {
            return true; // モーダルが無い場合は続行
        }
        
        return window.ModalManager.confirm(
            `参照整合性の問題が${errors.length}件見つかりました。このままインポートを続行しますか？`,
            {
                title: '参照整合性の警告',
                type: 'warning',
                confirmText: '続行',
                cancelText: 'キャンセル'
            }
        );
    }
    
    /**
     * ファイル形式が有効かチェック
     * @param {string} fileName ファイル名
     * @returns {boolean} 有効かどうか
     */
    isValidFileFormat(fileName) {
        return this.supportedFormats.some(format => 
            fileName.toLowerCase().endsWith(format)
        );
    }
    
    /**
     * ファイルサイズをフォーマット
     * @param {number} bytes バイト数
     * @returns {string} フォーマットされたサイズ
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    /**
     * ドラッグ&ドロップ機能を初期化
     * @param {string} dropZoneId ドロップゾーンのID
     */
    initializeDragAndDrop(dropZoneId = 'file-dropzone') {
        if (!this.dragAndDropEnabled) return;
        
        const dropZone = document.getElementById(dropZoneId);
        if (!dropZone) {
            window.UPPS_LOG.warn('Drop zone not found', { dropZoneId });
            return;
        }
        
        // ドラッグオーバーイベント
        document.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            // ファイルかどうかチェック
            if (this.hasFiles(e.dataTransfer)) {
                dropZone.classList.remove('hidden');
                dropZone.classList.add('dragover');
            }
        });
        
        // ドラッグリーブイベント
        document.addEventListener('dragleave', (e) => {
            if (e.target === document || e.target === document.body) {
                dropZone.classList.add('hidden');
                dropZone.classList.remove('dragover');
            }
        });
        
        // ドロップイベント
        dropZone.addEventListener('drop', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.add('hidden');
            dropZone.classList.remove('dragover');
            
            const files = Array.from(e.dataTransfer.files);
            if (files.length === 0) return;
            
            // 最初のファイルのみ処理
            const file = files[0];
            
            try {
                await this.handleDroppedFile(file);
            } catch (error) {
                window.UPPS_LOG.error('Dropped file processing failed', error);
                
                if (window.NotificationManager) {
                    window.NotificationManager.error(`ファイル処理エラー: ${error.message}`);
                }
            }
        });
        
        // クリックでドロップゾーンを非表示
        dropZone.addEventListener('click', (e) => {
            if (e.target === dropZone) {
                dropZone.classList.add('hidden');
            }
        });
        
        window.UPPS_LOG.info('Drag and drop initialized', { dropZoneId });
    }
    
    /**
     * ドロップされたファイルを処理
     * @param {File} file ファイル
     */
    async handleDroppedFile(file) {
        if (!this.isValidFileFormat(file.name)) {
            throw new Error(`サポートされていないファイル形式です: ${file.name}`);
        }
        
        // ファイルを処理
        const data = await this.processFile(file, { showPreview: true });
        
        // UPPSEditorにデータを設定
        const editor = window.uppsEditor;
        if (editor) {
            editor.persona = data;
            
            // タブコンテンツを再読み込み
            if (typeof editor.loadTabContent === 'function') {
                editor.loadTabContent(editor.activeTab);
            }
            
            // 成功通知
            editor.showNotification(`${file.name} を読み込みました`, 'success');
        }
    }
    
    /**
     * DataTransferがファイルを含むかチェック
     * @param {DataTransfer} dataTransfer DataTransferオブジェクト
     * @returns {boolean} ファイルを含むかどうか
     */
    hasFiles(dataTransfer) {
        return dataTransfer && dataTransfer.types && dataTransfer.types.includes('Files');
    }
    
    /**
     * インポート履歴に追加
     * @param {string} fileName ファイル名
     * @param {Object} data データ
     */
    addToImportHistory(fileName, data) {
        const historyEntry = {
            fileName,
            timestamp: Date.now(),
            dataSize: JSON.stringify(data).length,
            version: data.version || 'unknown'
        };
        
        this.importHistory.unshift(historyEntry);
        
        // 履歴を最大20件に制限
        if (this.importHistory.length > 20) {
            this.importHistory = this.importHistory.slice(0, 20);
        }
        
        window.UPPS_LOG.debug('Import history updated', historyEntry);
    }
    
    /**
     * インポート履歴を取得
     * @returns {Array} インポート履歴
     */
    getImportHistory() {
        return [...this.importHistory];
    }
    
    /**
     * インポート履歴をクリア
     */
    clearImportHistory() {
        this.importHistory = [];
        window.UPPS_LOG.info('Import history cleared');
    }
    
    /**
     * バッチインポート（複数ファイル）
     * @param {FileList} files ファイルリスト
     * @param {Object} options オプション
     * @returns {Promise<Array>} インポート結果のリスト
     */
    async batchImport(files, options = {}) {
        const results = [];
        const fileArray = Array.from(files);
        
        for (let i = 0; i < fileArray.length; i++) {
            const file = fileArray[i];
            
            try {
                const data = await this.processFile(file, options);
                results.push({
                    fileName: file.name,
                    success: true,
                    data: data
                });
            } catch (error) {
                results.push({
                    fileName: file.name,
                    success: false,
                    error: error.message
                });
            }
        }
        
        return results;
    }
    
    /**
     * インポート設定を取得
     * @returns {Object} 設定情報
     */
    getImportSettings() {
        return {
            supportedFormats: [...this.supportedFormats],
            maxFileSize: this.maxFileSize,
            dragAndDropEnabled: this.dragAndDropEnabled
        };
    }
    
    /**
     * インポート設定を更新
     * @param {Object} settings 新しい設定
     */
    updateImportSettings(settings) {
        if (settings.maxFileSize !== undefined) {
            this.maxFileSize = settings.maxFileSize;
        }
        
        if (settings.dragAndDropEnabled !== undefined) {
            this.dragAndDropEnabled = settings.dragAndDropEnabled;
        }
        
        window.UPPS_LOG.info('Import settings updated', settings);
    }
}

// グローバルインスタンスを作成
window.PersonaImporter = new PersonaImporter();

// グローバル関数として公開（後方互換性）
window.importPersonaFromFile = function(options = {}) {
    return window.PersonaImporter.importFromFile(options);
};

// UPPSEditorプロトタイプに関数を追加
if (typeof UPPSEditor !== 'undefined') {
    UPPSEditor.prototype.importFromFile = function(options = {}) {
        return window.PersonaImporter.importFromFile(options);
    };
    
    UPPSEditor.prototype.loadFile = async function() {
        try {
            const data = await window.PersonaImporter.importFromFile({ showPreview: true });
            
            // データの処理とマージ
            this.persona = data;
            
            // 通知
            this.showNotification('ファイルを読み込みました', 'success');
            
            // タブコンテンツを再読み込み
            this.loadTabContent(this.activeTab);
            
        } catch (error) {
            window.UPPS_LOG.error('Error loading file', error);
            this.showNotification('ファイルの読み込みに失敗しました: ' + error.message, 'error');
        }
    };
}

// DOMContentLoadedでドラッグ&ドロップを初期化
document.addEventListener('DOMContentLoaded', () => {
    window.PersonaImporter.initializeDragAndDrop();
});

window.UPPS_LOG.info('Import utilities initialized');
