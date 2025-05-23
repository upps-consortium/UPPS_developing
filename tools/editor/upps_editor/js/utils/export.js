// js/utils/export.js
// プロファイルのエクスポートとインポート機能（修正版）

/**
 * JSONエクスポート（グローバル関数 - 未定義関数解決）
 */
function exportJSON() {
    const editor = window.uppsEditor;
    if (!editor?.persona) {
        window.UPPS_LOG.warn('Cannot export JSON: persona not found');
        return;
    }
    
    const success = exportAsJSON(editor.persona);
    if (success) {
        editor.showNotification('JSONファイルをエクスポートしました', 'success');
    }
}

/**
 * YAMLエクスポート（グローバル関数 - 未定義関数解決）
 */
function exportYAML() {
    const editor = window.uppsEditor;
    if (!editor?.persona) {
        window.UPPS_LOG.warn('Cannot export YAML: persona not found');
        return;
    }
    
    const success = exportAsYAML(editor.persona);
    if (success) {
        editor.showNotification('YAMLファイルをエクスポートしました', 'success');
    }
}

/**
 * JSONとしてエクスポート
 * @param {Object} persona ペルソナデータ
 * @returns {string} ファイル名
 */
function exportAsJSON(persona) {
    try {
        // ストレージマネージャーを使用してデータを準備
        const exportData = window.storageManager ? 
            window.storageManager.prepareForExport(persona) : 
            cleanupPersonaData(persona);
        
        // JSON文字列に変換
        const jsonString = JSON.stringify(exportData, null, 2);
        
        // Blobの作成
        const blob = new Blob([jsonString], { type: 'application/json' });
        
        // ファイル名の設定
        const fileName = `${persona.personal_info?.name || 'persona'}_${new Date().toISOString().slice(0, 10)}.json`;
        
        // ダウンロード
        downloadFile(blob, fileName);
        
        window.UPPS_LOG.info('JSON export completed', { fileName });
        return fileName;
    } catch (error) {
        window.UPPS_LOG.error('JSON export failed', error);
        return false;
    }
}

/**
 * YAMLとしてエクスポート
 * @param {Object} persona ペルソナデータ
 * @returns {string} ファイル名
 */
function exportAsYAML(persona) {
    try {
        // ストレージマネージャーを使用してデータを準備
        const exportData = window.storageManager ? 
            window.storageManager.prepareForExport(persona) : 
            cleanupPersonaData(persona);
        
        // YAML文字列に変換
        const yamlString = jsyaml.dump(exportData, {
            indent: 2,
            lineWidth: -1,
            noRefs: true,
            sortKeys: true
        });
        
        // Blobの作成
        const blob = new Blob([yamlString], { type: 'text/yaml' });
        
        // ファイル名の設定
        const fileName = `${persona.personal_info?.name || 'persona'}_${new Date().toISOString().slice(0, 10)}.yaml`;
        
        // ダウンロード
        downloadFile(blob, fileName);
        
        window.UPPS_LOG.info('YAML export completed', { fileName });
        return fileName;
    } catch (error) {
        window.UPPS_LOG.error('YAML export failed', error);
        return false;
    }
}

/**
 * ペルソナデータのクリーンアップ
 * @param {Object} persona ペルソナデータ
 * @returns {Object} クリーンアップされたデータ
 */
function cleanupPersonaData(persona) {
    const cleaned = JSON.parse(JSON.stringify(persona));
    
    // 空の値を削除
    function removeEmptyValues(obj) {
        for (const key in obj) {
            if (obj[key] === null || obj[key] === undefined || obj[key] === '') {
                delete obj[key];
            } else if (typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
                removeEmptyValues(obj[key]);
                
                // 空のオブジェクトを削除
                if (Object.keys(obj[key]).length === 0) {
                    delete obj[key];
                }
            } else if (Array.isArray(obj[key])) {
                // 配列内の空の要素を削除
                obj[key] = obj[key].filter(item => {
                    if (typeof item === 'object') {
                        removeEmptyValues(item);
                        return Object.keys(item).length > 0;
                    }
                    return item !== null && item !== undefined && item !== '';
                });
                
                // 空の配列を削除
                if (obj[key].length === 0) {
                    delete obj[key];
                }
            }
        }
    }
    
    removeEmptyValues(cleaned);
    
    return cleaned;
}

/**
 * ファイルダウンロード
 * @param {Blob} blob ファイルデータ
 * @param {string} fileName ファイル名
 */
function downloadFile(blob, fileName) {
    try {
        // ダウンロードリンクの作成と実行
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = fileName;
        
        // リンクをDOMに追加してクリック
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // 使用後にオブジェクトURLを解放
        setTimeout(() => {
            URL.revokeObjectURL(link.href);
        }, 100);
    } catch (error) {
        window.UPPS_LOG.error('File download failed', error);
        throw error;
    }
}

/**
 * ファイルインポート
 * @returns {Promise<Object>} インポートされたデータ
 */
function importPersonaFromFile() {
    return new Promise((resolve, reject) => {
        // ファイル選択ダイアログを表示
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json,.yaml,.yml';
        
        input.onchange = (event) => {
            const file = event.target.files[0];
            if (!file) {
                reject(new Error('No file selected'));
                return;
            }
            
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
                    
                    // バージョン互換性チェック
                    if (data.version && window.PersonaData) {
                        const compatibility = window.PersonaData.checkVersionCompatibility(data);
                        if (compatibility.warnings.length > 0) {
                            window.UPPS_LOG.warn('Version compatibility issues', compatibility.warnings);
                        }
                    }
                    
                    window.UPPS_LOG.info('File import completed', { fileName: file.name });
                    resolve(data);
                } catch (error) {
                    window.UPPS_LOG.error('File parsing failed', error);
                    reject(error);
                }
            };
            
            reader.onerror = () => {
                const error = new Error('Error reading file');
                window.UPPS_LOG.error('File reading failed', error);
                reject(error);
            };
            
            reader.readAsText(file);
        };
        
        input.click();
    });
}

/**
 * YAMLプレビューの生成
 * @param {Object} persona ペルソナデータ
 * @returns {string} YAML文字列
 */
function generateYAML(persona) {
    try {
        return jsyaml.dump(persona, {
            indent: 2,
            lineWidth: -1,
            noRefs: true,
            sortKeys: true
        });
    } catch (error) {
        window.UPPS_LOG.error('YAML generation failed', error);
        return 'エラー: YAML生成に失敗しました';
    }
}

// グローバル関数として公開（未定義関数解決）
window.exportJSON = exportJSON;
window.exportYAML = exportYAML;
window.importPersonaFromFile = importPersonaFromFile;
window.generateYAML = generateYAML;

window.UPPS_LOG.info('Export utilities initialized');
