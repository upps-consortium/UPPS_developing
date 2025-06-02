/**
 * bootstrap.js - UPPS新アーキテクチャ 移行制御ブートストラップ
 * 
 * 新旧システムの切り替え、段階的移行、エラーハンドリングを管理
 * 移行ガイドに基づく安全な移行制御を提供
 */

class UPPSBootstrap {
    constructor() {
        this.name = 'UPPSBootstrap';
        this.version = '1.0.0';
        
        // 移行設定
        this.migrationConfig = {
            // 移行フラグ（段階的に有効化）
            useNewArchitecture: this._getMigrationFlag(),
            enableStateManager: this._getFeatureFlag('stateManager'),
            enableEventBus: this._getFeatureFlag('eventBus'),
            enableAlpineIntegration: this._getFeatureFlag('alpineIntegration'),
            enableDomainModules: this._getFeatureFlag('domainModules'),
            enableUIControllers: this._getFeatureFlag('uiControllers'),
            
            // 移行段階
            migrationPhase: this._getMigrationPhase(),
            
            // バックアップ設定
            createBackup: true,
            backupKey: 'upps_migration_backup',
            
            // ロールバック設定
            enableRollback: true,
            rollbackThreshold: 3, // 3回エラーでロールバック
            
            // ログ設定
            enableMigrationLog: true,
            logLevel: 'debug'
        };
        
        // システム状態
        this.systemState = {
            initialized: false,
            migrationCompleted: false,
            errorCount: 0,
            lastError: null,
            startTime: null,
            components: new Map()
        };
        
        // コンポーネント参照
        this.components = {
            stateManager: null,
            eventBus: null,
            moduleRegistry: null,
            appController: null,
            tabController: null,
            modalController: null,
            notificationController: null,
            alpineIntegration: null
        };
        
        this.log('UPPSBootstrap initialized', { 
            config: this.migrationConfig,
            version: this.version 
        });
    }

    /**
     * システムの初期化
     * @returns {Promise<void>}
     */
    async initialize() {
        if (this.systemState.initialized) {
            this.log('System already initialized');
            return;
        }

        this.systemState.startTime = Date.now();
        
        try {
            this.log('Starting UPPS system initialization...');
            
            // バックアップの作成
            if (this.migrationConfig.createBackup) {
                await this._createDataBackup();
            }
            
            // 移行判定
            if (this.migrationConfig.useNewArchitecture) {
                await this._initializeNewArchitecture();
            } else {
                await this._initializeLegacySystem();
            }
            
            // 初期化完了
            this.systemState.initialized = true;
            this.systemState.migrationCompleted = true;
            
            const initTime = Date.now() - this.systemState.startTime;
            this.log(`System initialization completed in ${initTime}ms`);
            
            // 成功通知
            this._showMigrationSuccess();
            
        } catch (error) {
            await this._handleInitializationError(error);
        }
    }

    /**
     * 新アーキテクチャの初期化
     */
    async _initializeNewArchitecture() {
        this.log('Initializing new architecture...');
        
        try {
            // Phase B: コアシステム初期化
            if (this.migrationConfig.enableStateManager) {
                await this._initializeStateManager();
            }
            
            if (this.migrationConfig.enableEventBus) {
                await this._initializeEventBus();
            }
            
            if (this.migrationConfig.enableAlpineIntegration) {
                await this._initializeAlpineIntegration();
            }
            
            // Phase C: モジュール初期化
            if (this.migrationConfig.enableDomainModules) {
                await this._initializeDomainModules();
            }
            
            if (this.migrationConfig.enableUIControllers) {
                await this._initializeUIControllers();
            }
            
            // AppControllerの初期化と開始
            await this._initializeAppController();
            
            this.log('New architecture initialization completed');
            
        } catch (error) {
            this.log('New architecture initialization failed', error);
            throw error;
        }
    }

    /**
     * StateManagerの初期化
     */
    async _initializeStateManager() {
        this.log('Initializing StateManager...');
        
        try {
            // StateManagerクラスの確認
            if (typeof StateManager === 'undefined') {
                throw new Error('StateManager class not found. Check if StateManager.js is loaded.');
            }
            
            // StateManagerの作成
            this.components.stateManager = new StateManager({
                persistence: true,
                storageKey: 'upps_app_state',
                autoSave: true,
                autoSaveInterval: 5000
            });
            
            // 既存データの移行
            await this._migrateLegacyData();
            
            // グローバル参照の設定
            window.stateManager = this.components.stateManager;
            
            this.systemState.components.set('stateManager', 'initialized');
            this.log('StateManager initialized successfully');
            
        } catch (error) {
            this.systemState.components.set('stateManager', 'failed');
            throw new Error(`StateManager initialization failed: ${error.message}`);
        }
    }

    /**
     * EventBusの初期化
     */
    async _initializeEventBus() {
        this.log('Initializing EventBus...');
        
        try {
            // EventBusクラスの確認
            if (typeof EventBus === 'undefined') {
                throw new Error('EventBus class not found. Check if EventBus.js is loaded.');
            }
            
            // EventBusの作成
            this.components.eventBus = new EventBus({
                enableLogging: this.migrationConfig.logLevel === 'debug',
                maxListeners: 100,
                enableWildcard: true
            });
            
            // グローバル参照の設定
            window.eventBus = this.components.eventBus;
            
            // 基本イベントハンドラーの設定
            this._setupBasicEventHandlers();
            
            this.systemState.components.set('eventBus', 'initialized');
            this.log('EventBus initialized successfully');
            
        } catch (error) {
            this.systemState.components.set('eventBus', 'failed');
            throw new Error(`EventBus initialization failed: ${error.message}`);
        }
    }

    /**
     * Alpine.js統合の初期化
     */
    async _initializeAlpineIntegration() {
        this.log('Initializing Alpine.js integration...');
        
        try {
            // Alpine.jsの確認
            if (typeof Alpine === 'undefined') {
                throw new Error('Alpine.js not found. Check if Alpine.js is loaded.');
            }
            
            // AlpineIntegrationクラスの確認
            if (typeof AlpineIntegration === 'undefined') {
                throw new Error('AlpineIntegration class not found.');
            }
            
            // Alpine統合の作成と初期化
            this.components.alpineIntegration = new AlpineIntegration();
            await this.components.alpineIntegration.initialize(
                this.components.stateManager,
                this.components.eventBus
            );
            
            // グローバル参照の設定
            window.alpineIntegration = this.components.alpineIntegration;
            
            this.systemState.components.set('alpineIntegration', 'initialized');
            this.log('Alpine.js integration initialized successfully');
            
        } catch (error) {
            this.systemState.components.set('alpineIntegration', 'failed');
            throw new Error(`Alpine.js integration initialization failed: ${error.message}`);
        }
    }

    /**
     * ドメインモジュールの初期化
     */
    async _initializeDomainModules() {
        this.log('Initializing domain modules...');
        
        try {
            // ModuleRegistryの初期化
            if (typeof ModuleRegistry === 'undefined') {
                throw new Error('ModuleRegistry class not found.');
            }
            
            this.components.moduleRegistry = new ModuleRegistry(
                this.components.eventBus,
                this.components.stateManager
            );
            
            // ドメインモジュールの登録
            await this._registerDomainModules();
            
            // モジュールの初期化と開始
            await this.components.moduleRegistry.initialize();
            await this.components.moduleRegistry.start();
            
            // グローバル参照の設定
            window.moduleRegistry = this.components.moduleRegistry;
            
            this.systemState.components.set('domainModules', 'initialized');
            this.log('Domain modules initialized successfully');
            
        } catch (error) {
            this.systemState.components.set('domainModules', 'failed');
            throw new Error(`Domain modules initialization failed: ${error.message}`);
        }
    }

    /**
     * UIコントローラーの初期化
     */
    async _initializeUIControllers() {
        this.log('Initializing UI controllers...');
        
        try {
            // TabControllerの初期化
            if (typeof TabController !== 'undefined') {
                this.components.tabController = new TabController();
                await this.components.tabController.initialize(
                    this.components.eventBus,
                    this.components.stateManager,
                    this.components.moduleRegistry
                );
            }
            
            // ModalControllerの初期化
            if (typeof ModalController !== 'undefined') {
                this.components.modalController = new ModalController();
                await this.components.modalController.initialize(
                    this.components.eventBus,
                    this.components.stateManager
                );
            }
            
            // NotificationControllerの初期化
            if (typeof NotificationController !== 'undefined') {
                this.components.notificationController = new NotificationController();
                await this.components.notificationController.initialize(
                    this.components.eventBus,
                    this.components.stateManager
                );
            }
            
            // グローバル参照の設定
            window.tabController = this.components.tabController;
            window.modalController = this.components.modalController;
            window.notificationController = this.components.notificationController;
            
            this.systemState.components.set('uiControllers', 'initialized');
            this.log('UI controllers initialized successfully');
            
        } catch (error) {
            this.systemState.components.set('uiControllers', 'failed');
            throw new Error(`UI controllers initialization failed: ${error.message}`);
        }
    }

    /**
     * AppControllerの初期化
     */
    async _initializeAppController() {
        this.log('Initializing AppController...');
        
        try {
            // AppControllerクラスの確認
            if (typeof AppController === 'undefined') {
                throw new Error('AppController class not found.');
            }
            
            // AppControllerの作成
            this.components.appController = new AppController({
                autoStart: true,
                enableAlpine: true,
                defaultTab: 'basic',
                persistState: true
            });
            
            // 初期化と開始
            await this.components.appController.initialize();
            await this.components.appController.start();
            
            // グローバル参照の設定
            window.appController = this.components.appController;
            window.uppsEditor = this.components.appController; // 既存互換性
            
            this.systemState.components.set('appController', 'initialized');
            this.log('AppController initialized successfully');
            
        } catch (error) {
            this.systemState.components.set('appController', 'failed');
            throw new Error(`AppController initialization failed: ${error.message}`);
        }
    }

    /**
     * ドメインモジュールの登録
     */
    async _registerDomainModules() {
        const modules = [
            { name: 'EmotionModule', class: EmotionModule },
            { name: 'MemoryModule', class: MemoryModule },
            { name: 'AssociationModule', class: AssociationModule },
            { name: 'CognitiveModule', class: CognitiveModule }
        ];
        
        for (const { name, class: ModuleClass } of modules) {
            try {
                if (typeof ModuleClass !== 'undefined') {
                    const module = new ModuleClass();
                    this.components.moduleRegistry.register(name, module);
                    this.log(`${name} registered successfully`);
                } else {
                    this.log(`${name} not available, skipping registration`);
                }
            } catch (error) {
                this.log(`Failed to register ${name}: ${error.message}`);
                throw error;
            }
        }
    }

    /**
     * 既存データの移行
     */
    async _migrateLegacyData() {
        this.log('Migrating legacy data...');
        
        try {
            // 既存のペルソナデータの確認
            const legacyData = localStorage.getItem('upps_persona_data');
            
            if (legacyData) {
                const personaData = JSON.parse(legacyData);
                
                // データの検証と正規化
                const normalizedData = this._normalizeLegacyData(personaData);
                
                // 新しい状態管理システムに設定
                this.components.stateManager.setState('persona', normalizedData);
                
                this.log('Legacy data migrated successfully');
            } else {
                // デフォルトデータの設定
                this._initializeDefaultData();
                this.log('Default data initialized');
            }
            
        } catch (error) {
            this.log('Data migration failed', error);
            // データ移行失敗時はデフォルトデータで継続
            this._initializeDefaultData();
        }
    }

    /**
     * レガシーシステムの初期化（ロールバック用）
     */
    async _initializeLegacySystem() {
        this.log('Initializing legacy system...');
        
        try {
            // 既存のapp.jsの初期化
            if (typeof UPPSEditor !== 'undefined') {
                window.uppsEditor = new UPPSEditor();
                await window.uppsEditor.initialize();
            }
            
            this.log('Legacy system initialized successfully');
            
        } catch (error) {
            this.log('Legacy system initialization failed', error);
            throw error;
        }
    }

    /**
     * 初期化エラーのハンドリング
     */
    async _handleInitializationError(error) {
        this.systemState.errorCount++;
        this.systemState.lastError = error;
        
        this.log(`Initialization error (${this.systemState.errorCount}): ${error.message}`, error);
        
        // エラー回数によるロールバック判定
        if (this.migrationConfig.enableRollback && 
            this.systemState.errorCount >= this.migrationConfig.rollbackThreshold) {
            
            this.log('Rollback threshold reached, switching to legacy system');
            await this._performRollback();
        } else {
            // エラー通知
            this._showMigrationError(error);
            throw error;
        }
    }

    /**
     * ロールバックの実行
     */
    async _performRollback() {
        this.log('Performing rollback to legacy system...');
        
        try {
            // 移行フラグを無効化
            localStorage.setItem('upps_migration_disabled', 'true');
            
            // レガシーシステムの初期化
            await this._initializeLegacySystem();
            
            // バックアップデータの復元
            await this._restoreDataBackup();
            
            this.log('Rollback completed successfully');
            this._showRollbackNotification();
            
        } catch (rollbackError) {
            this.log('Rollback failed', rollbackError);
            this._showCriticalError(rollbackError);
        }
    }

    // ==================== ユーティリティメソッド ====================

    /**
     * データバックアップの作成
     */
    async _createDataBackup() {
        try {
            const legacyData = localStorage.getItem('upps_persona_data');
            if (legacyData) {
                localStorage.setItem(this.migrationConfig.backupKey, legacyData);
                localStorage.setItem(`${this.migrationConfig.backupKey}_timestamp`, Date.now().toString());
                this.log('Data backup created successfully');
            }
        } catch (error) {
            this.log('Failed to create data backup', error);
        }
    }

    /**
     * データバックアップの復元
     */
    async _restoreDataBackup() {
        try {
            const backupData = localStorage.getItem(this.migrationConfig.backupKey);
            if (backupData) {
                localStorage.setItem('upps_persona_data', backupData);
                this.log('Data backup restored successfully');
            }
        } catch (error) {
            this.log('Failed to restore data backup', error);
        }
    }

    /**
     * レガシーデータの正規化
     */
    _normalizeLegacyData(legacyData) {
        // データの基本構造確認と修正
        const normalized = {
            version: legacyData.version || "2025.3",
            personal_info: legacyData.personal_info || {
                name: "",
                age: null,
                gender: "",
                occupation: ""
            },
            background: legacyData.background || "",
            current_emotion_state: legacyData.current_emotion_state || {},
            emotion_system: legacyData.emotion_system || { model: "Ekman", emotions: {} },
            personality: legacyData.personality || { model: "Big Five", traits: {} },
            memory_system: legacyData.memory_system || { memories: [] },
            association_system: legacyData.association_system || { associations: [] },
            cognitive_system: legacyData.cognitive_system || { model: "WAIS-IV", abilities: {} }
        };
        
        return normalized;
    }

    /**
     * デフォルトデータの初期化
     */
    _initializeDefaultData() {
        const defaultPersona = {
            version: "2025.3",
            personal_info: {
                name: "",
                age: null,
                gender: "",
                occupation: ""
            },
            background: "",
            current_emotion_state: {},
            emotion_system: { model: "Ekman", emotions: {} },
            personality: { model: "Big Five", traits: {} },
            memory_system: { memories: [] },
            association_system: { associations: [] },
            cognitive_system: { model: "WAIS-IV", abilities: {} }
        };
        
        this.components.stateManager.setState('persona', defaultPersona);
    }

    /**
     * 基本イベントハンドラーの設定
     */
    _setupBasicEventHandlers() {
        // エラーイベントの監視
        this.components.eventBus.on('error', (error) => {
            this.systemState.errorCount++;
            this.systemState.lastError = error;
            this.log('System error detected', error);
        });
        
        // 成功イベントの監視
        this.components.eventBus.on('success', (data) => {
            this.log('System success event', data);
        });
    }

    /**
     * 移行フラグの取得
     */
    _getMigrationFlag() {
        // 移行無効化フラグのチェック
        if (localStorage.getItem('upps_migration_disabled') === 'true') {
            return false;
        }
        
        // URLパラメータでの制御
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('legacy') === 'true') {
            return false;
        }
        
        // デフォルトは新アーキテクチャを使用
        return true;
    }

    /**
     * 機能フラグの取得
     */
    _getFeatureFlag(feature) {
        const flags = localStorage.getItem('upps_feature_flags');
        if (flags) {
            try {
                const parsed = JSON.parse(flags);
                return parsed[feature] !== false; // デフォルトはtrue
            } catch {
                return true;
            }
        }
        return true;
    }

    /**
     * 移行段階の取得
     */
    _getMigrationPhase() {
        return localStorage.getItem('upps_migration_phase') || 'complete';
    }

    /**
     * 通知メソッド
     */
    _showMigrationSuccess() {
        if (this.components.notificationController) {
            this.components.notificationController.success('新アーキテクチャの初期化が完了しました');
        } else {
            console.log('✅ 新アーキテクチャの初期化が完了しました');
        }
    }

    _showMigrationError(error) {
        if (this.components.notificationController) {
            this.components.notificationController.error(`初期化エラー: ${error.message}`);
        } else {
            console.error('❌ 初期化エラー:', error.message);
        }
    }

    _showRollbackNotification() {
        console.warn('⚠️ レガシーシステムにロールバックしました');
    }

    _showCriticalError(error) {
        console.error('🚨 致命的なエラーが発生しました:', error.message);
    }

    /**
     * ログ出力
     */
    log(message, data = null) {
        if (!this.migrationConfig.enableMigrationLog) return;
        
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] UPPSBootstrap: ${message}`;
        
        if (data !== null) {
            console.debug(logMessage, data);
        } else {
            console.debug(logMessage);
        }
    }

    /**
     * システム状態の取得
     */
    getSystemState() {
        return {
            ...this.systemState,
            components: Object.fromEntries(this.systemState.components),
            config: this.migrationConfig
        };
    }
}

// ==================== 自動初期化 ====================

// DOMContentLoadedでの自動初期化
document.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log('🚀 UPPS System Bootstrap Starting...');
        
        // ブートストラップの作成と初期化
        const bootstrap = new UPPSBootstrap();
        await bootstrap.initialize();
        
        // グローバル参照の設定
        window.uppsBootstrap = bootstrap;
        
        console.log('✅ UPPS System Bootstrap Completed');
        console.log('System State:', bootstrap.getSystemState());
        
    } catch (error) {
        console.error('❌ UPPS System Bootstrap Failed:', error);
        
        // 緊急時のフォールバック
        try {
            console.log('🔄 Attempting emergency fallback...');
            localStorage.setItem('upps_migration_disabled', 'true');
            window.location.reload();
        } catch (fallbackError) {
            console.error('🚨 Emergency fallback failed:', fallbackError);
        }
    }
});

// ES6モジュールとしてエクスポート
export { UPPSBootstrap };
