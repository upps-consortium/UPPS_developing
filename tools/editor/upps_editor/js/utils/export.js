// export.js
// プロファイルのエクスポートとインポート機能

// JSONとしてエクスポート
function exportAsJSON(profile) {
    // 無効なデータをフィルタリング
    const cleanedProfile = cleanupProfileData(profile);
    
    // JSON文字列に変換
    const jsonString = JSON.stringify(cleanedProfile, null, 2);
    
    // Blobの作成
    const blob = new Blob([jsonString], { type: 'application/json' });
    
    // ファイル名の設定
    const fileName = `${profile.personal_info.name || 'profile'}_${new Date().toISOString().slice(0, 10)}.json`;
    
    // ダウンロード
    downloadFile(blob, fileName);
    
    return fileName;
}

// YAMLとしてエクスポート
function exportAsYAML(profile) {
    // 無効なデータをフィルタリング
    const cleanedProfile = cleanupProfileData(profile);
    
    // YAML文字列に変換
    const yamlString = jsyaml.dump(cleanedProfile, {
        indent: 2,
        lineWidth: -1,
        noRefs: true,
        sortKeys: true
    });
    
    // Blobの作成
    const blob = new Blob([yamlString], { type: 'text/yaml' });
    
    // ファイル名の設定
    const fileName = `${profile.personal_info.name || 'profile'}_${new Date().toISOString().slice(0, 10)}.yaml`;
    
    // ダウンロード
    downloadFile(blob, fileName);
    
    return fileName;
}

// プロファイルデータのクリーンアップ
function cleanupProfileData(profile) {
    const cleaned = JSON.parse(JSON.stringify(profile));
    
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

// ファイルダウンロード
function downloadFile(blob, fileName) {
    // ダウンロードリンクの作成と実行
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
    
    // 使用後にオブジェクトURLを解放
    setTimeout(() => {
        URL.revokeObjectURL(link.href);
    }, 100);
}

// ファイルインポート
function importProfileFromFile() {
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
                    if (data.version) {
                        const currentVersion = getDefaultProfile().version;
                        if (data.version !== currentVersion) {
                            console.warn(`Import notice: File version (${data.version}) differs from current editor version (${currentVersion})`);
                        }
                    }
                    
                    resolve(data);
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = () => {
                reject(new Error('Error reading file'));
            };
            
            reader.readAsText(file);
        };
        
        input.click();
    });
}

// YAMLプレビューの生成
function generateYAML(profile) {
    return jsyaml.dump(profile, {
        indent: 2,
        lineWidth: -1,
        noRefs: true,
        sortKeys: true
    });
}