// js/core/storage.js
// ローカルストレージの管理と自動保存機能

/**
 * ストレージマネージャークラス
 */
class StorageManager {
    constructor() {
        this.autoSaveTimer = null;
        this.isAutoSaveEnabled = true;
        this.storageKeys = window.UPPS_CONFIG.STORAGE_KEYS;
    }
    
    /**
     * ペルソナデータをローカルストレージに保存
     * @param {Object} persona ペルソナデータ
     * @returns {boolean} 保存成功の可否
     */
    savePersona(persona) {
        try {
            const personaData = JSON.stringify(persona);
            localStorage.setItem(this.storageKeys.PERSONA_DATA, personaData);
            
            // 保存日時を記録
            const saveTime = new Date().toLocaleTimeString();
            localStorage.setItem(this.storageKeys.LAST_SAVED, saveTime);
            
            window.UPPS_LOG.info('Persona saved to local storage', { time: saveTime });
            
            // 自動保存ステータスを更新
            this.updateAutoSaveStatus(saveTime);
            
            return true;
        } catch (error) {
            window.UPPS_LOG.error('Error saving to local storage', error);
            return false;
        }
    }
    
    /**
     * ローカルストレージからペルソナデータを読み込み
     * @returns {Object|null} ペルソナデータまたはnull
     */
    loadPersona() {
        try {
            const data = localStorage.getItem(this.storageKeys.PERSONA_DATA);
            if (!data) {
                window.UPPS_LOG.info('No persona data found in local storage');
                return null;
            }
            
            const persona = JSON.parse(data);
            
            // バージョン互換性チェック
            const compatibility = window.PersonaData.checkVersionCompatibility(persona);
            if (compatibility.warnings.length > 0) {
                compatibility.warnings.forEach(warning => {
                    window.UPPS_LOG.warn('Version compatibility', warning);
                });
            }
            
            // 保存日時を取得
            const saveTime = localStorage.getItem(this.storageKeys.LAST_SAVED);
            if (saveTime) {
                this.updateAutoSaveStatus(saveTime);
            }
            
            window.UPPS_LOG.info('Persona loaded from local storage');
            return persona;
        } catch (error) {
            window.UPPS_LOG.error('Error loading from local storage', error);
            return null;
        }
    }
    
    /**
     * ローカルストレージをクリア
     * @returns {boolean} クリア成功の可否
     */
    clearStorage() {
        try {
            localStorage.removeItem(this.storageKeys.PERSONA_DATA);
            localStorage.removeItem(this.storageKeys.LAST_SAVED);
            localStorage.removeItem(this.storageKeys.USER_PREFERENCES);
            
            window.UPPS_LOG.info('Local storage cleared');
            
            // 自動保存ステータスをリセット
            this.updateAutoSaveStatus('初回保存前');
            
            return true;
        } catch (error) {
            window.UPPS_LOG.error('Error clearing local storage', error);
            return false;
        }
    }
    
    /**
     * 自動保存を開始
     * @param {Function} saveCallback 保存時に呼び出すコールバック
     */
    startAutoSave(saveCallback) {
        if (!this.isAutoSaveEnabled) {
            return;
        }
        
        // 既存のタイマーをクリア
        this.stopAutoSave();
        
        // 自動保存タイマーを設定
        this.autoSaveTimer = setInterval(() => {
            if (typeof saveCallback === 'function') {
                saveCallback();
            }
        }, window.UPPS_CONFIG.AUTO_SAVE_INTERVAL);
        
        window.UPPS_LOG.info('Auto save started', { 
            interval: window.UPPS_CONFIG.AUTO_SAVE_INTERVAL / 1000 + 's' 
        });
    }
    
    /**
     * 自動保存を停止
     */
    stopAutoSave() {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
            this.autoSaveTimer = null;
            window.UPPS_LOG.info('Auto save stopped');
        }
    }
    
    /**
     * 自動保存の有効/無効を切り替え
     * @param {boolean} enabled 有効かどうか
     */
    setAutoSaveEnabled(enabled) {
        this.isAutoSaveEnabled = enabled;
        
        if (!enabled) {
            this.stopAutoSave();
        }
        
        window.UPPS_LOG.info('Auto save enabled', enabled);
    }
    
    /**
     * 自動保存ステータスを更新
     * @param {string} saveTime 保存時刻
     */
    updateAutoSaveStatus(saveTime) {
        const statusElement = document.getElementById('auto-save-status');
        if (statusElement) {
            statusElement.textContent = `最終保存: ${saveTime}`;
        }
    }
    
    /**
     * ストレージの使用量を取得
     * @returns {Object} ストレージ使用量情報
     */
    getStorageUsage() {
        try {
            let totalSize = 0;
            let personaSize = 0;
            
            // 全体のサイズ計算
            for (let key in localStorage) {
                if (localStorage.hasOwnProperty(key)) {
                    totalSize += localStorage[key].length;
                }
            }
            
            // ペルソナデータのサイズ
            const personaData = localStorage.getItem(this.storageKeys.PERSONA_DATA);
            if (personaData) {
                personaSize = personaData.length;
            }
            
            return {
                totalSize,
                personaSize,
                totalSizeKB: Math.round(totalSize / 1024 * 100) / 100,
                personaSizeKB: Math.round(personaSize / 1024 * 100) / 100
            };
        } catch (error) {
            window.UPPS_LOG.error('Error calculating storage usage', error);
            return {
                totalSize: 0,
                personaSize: 0,
                totalSizeKB: 0,
                personaSizeKB: 0
            };
        }
    }
    
    /**
     * ストレージが利用可能かチェック
     * @returns {boolean} 利用可能かどうか
     */
    isStorageAvailable() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (error) {
            window.UPPS_LOG.error('Local storage not available', error);
            return false;
        }
    }
    
    /**
     * データをエクスポート用に準備
     * @param {Object} persona ペルソナデータ
     * @returns {Object} エクスポート用データ
     */
    prepareForExport(persona) {
        // データをクリーンアップ
        const cleanedData = window.PersonaData.cleanupPersonaData(persona);
        
        // メタデータを追加
        return {
            ...cleanedData,
            export_info: {
                exported_at: new Date().toISOString(),
                exported_by: 'UPPS Persona Editor',
                version: window.UPPS_CONFIG.VERSION
            }
        };
    }
    
    /**
     * インポートデータを処理
     * @param {Object} importedData インポートされたデータ
     * @returns {Object} 処理されたペルソナデータ
     */
    processImportedData(importedData) {
        // エクスポート情報を削除
        const { export_info, ...persona } = importedData;
        
        // テンプレートとマージして不足フィールドを補完
        const completePersona = window.PersonaData.mergeWithTemplate(persona);
        
        // 参照整合性チェック
        const integrityErrors = window.PersonaData.checkReferentialIntegrity(completePersona);
        if (integrityErrors.length > 0) {
            window.UPPS_LOG.warn('Referential integrity issues found', integrityErrors);
        }
        
        // 感情状態を初期化
        return window.PersonaData.initializeEmotionState(completePersona);
    }
    
    /**
     * バックアップを作成
     * @returns {boolean} バックアップ成功の可否
     */
    createBackup() {
        try {
            const persona = this.loadPersona();
            if (!persona) {
                return false;
            }
            
            const backupKey = `${this.storageKeys.PERSONA_DATA}_backup_${Date.now()}`;
            const backupData = this.prepareForExport(persona);
            
            localStorage.setItem(backupKey, JSON.stringify(backupData));
            
            window.UPPS_LOG.info('Backup created', { key: backupKey });
            return true;
        } catch (error) {
            window.UPPS_LOG.error('Error creating backup', error);
            return false;
        }
    }
    
    /**
     * バックアップを一覧取得
     * @returns {Array} バックアップのリスト
     */
    getBackups() {
        try {
            const backups = [];
            const backupPrefix = `${this.storageKeys.PERSONA_DATA}_backup_`;
            
            for (let key in localStorage) {
                if (key.startsWith(backupPrefix)) {
                    const timestamp = key.replace(backupPrefix, '');
                    const date = new Date(parseInt(timestamp));
                    
                    backups.push({
                        key,
                        timestamp: parseInt(timestamp),
                        date: date.toLocaleString(),
                        size: localStorage[key].length
                    });
                }
            }
            
            // 日付順でソート（新しい順）
            return backups.sort((a, b) => b.timestamp - a.timestamp);
        } catch (error) {
            window.UPPS_LOG.error('Error getting backups', error);
            return [];
        }
    }
}

// グローバルストレージマネージャーインスタンス
window.storageManager = new StorageManager();

// ページアンロード時に自動保存を停止
window.addEventListener('beforeunload', () => {
    window.storageManager.stopAutoSave();
});

window.UPPS_LOG.info('Storage module initialized');
