# UPPS新アーキテクチャ インターフェース定義書

## 📋 文書情報
- **作成日**: 2025年1月
- **バージョン**: 1.0
- **参照ファイル**: なし（新規設計）
- **用途**: 全モジュールの基準インターフェース

---

## 🏗️ コアシステム インターフェース

### StateManager
```typescript
interface StateManager {
    // 状態管理
    setState(path: string, value: any): void;
    getState(path: string): any;
    mergeState(path: string, value: object): void;
    deleteState(path: string): void;
    
    // リアクティブ機能
    subscribe(path: string, callback: (value: any) => void): () => void;
    watch(path: string, callback: (newValue: any, oldValue: any) => void): () => void;
    
    // Alpine.js統合
    bindToAlpine(storeName: string): void;
    syncFromAlpine(storeName: string): void;
    
    // 永続化
    save(): void;
    load(): void;
    reset(): void;
}

interface StateManagerConfig {
    persistence: boolean;
    storageKey: string;
    autoSave: boolean;
    autoSaveInterval: number;
}
```

### EventBus
```typescript
interface EventBus {
    // 基本イベント
    emit(event: string, data?: any): void;
    on(event: string, handler: (data: any) => void): () => void;
    off(event: string, handler?: Function): void;
    once(event: string, handler: (data: any) => void): void;
    
    // 名前空間
    namespace(name: string): EventBus;
    
    // ミドルウェア
    use(middleware: EventMiddleware): void;
    
    // ユーティリティ
    listEvents(): string[];
    hasListeners(event: string): boolean;
    clear(): void;
}

interface EventMiddleware {
    (event: string, data: any, next: () => void): void;
}

interface EventHandler {
    (data: any): void;
}
```

### ModuleRegistry
```typescript
interface ModuleRegistry {
    // モジュール管理
    register(name: string, module: DomainModule): void;
    unregister(name: string): void;
    get(name: string): DomainModule | null;
    has(name: string): boolean;
    
    // ライフサイクル
    initialize(): Promise<void>;
    start(): Promise<void>;
    stop(): Promise<void>;
    destroy(): Promise<void>;
    
    // 依存関係
    resolveDependencies(): void;
    checkCircularDependencies(): string[];
}

interface DomainModule {
    name: string;
    dependencies?: string[];
    initialize?(eventBus: EventBus, stateManager: StateManager): Promise<void>;
    start?(): Promise<void>;
    stop?(): Promise<void>;
    destroy?(): Promise<void>;
}
```

---

## 💼 ドメインモジュール インターフェース

### 共通ドメインモジュール基底
```typescript
interface BaseDomainModule extends DomainModule {
    // データ操作
    create(data: any): Promise<string>;
    read(id: string): Promise<any>;
    update(id: string, data: any): Promise<void>;
    delete(id: string): Promise<void>;
    list(): Promise<any[]>;
    
    // バリデーション
    validate(data: any): ValidationResult;
    
    // 状態管理
    getState(): any;
    setState(state: any): void;
    
    // イベント
    emitChange(type: string, data: any): void;
}

interface ValidationResult {
    valid: boolean;
    errors: ValidationError[];
}

interface ValidationError {
    field: string;
    message: string;
    code: string;
}
```

### EmotionModule
```typescript
interface EmotionModule extends BaseDomainModule {
    // 感情モデル管理
    initializeModel(model: EmotionModel): void;
    getModel(): EmotionModel;
    switchModel(modelType: string): void;
    
    // 感情操作
    setBaseline(emotionId: string, value: number): void;
    getBaseline(emotionId: string): number;
    updateCurrentState(emotionId: string, value: number): void;
    getCurrentState(emotionId: string): number;
    
    // 同期
    syncStateFromBaseline(): void;
    resetToBaseline(emotionId?: string): void;
}

interface EmotionModel {
    type: 'Ekman' | 'Plutchik' | 'PAD' | 'Custom';
    emotions: Record<string, EmotionData>;
}

interface EmotionData {
    baseline: number;
    description: string;
    category?: string;
    intensity?: number;
}
```

### MemoryModule
```typescript
interface MemoryModule extends BaseDomainModule {
    // 記憶操作
    addMemory(memory: Memory): string;
    updateMemory(id: string, updates: Partial<Memory>): void;
    removeMemory(id: string): void;
    getMemory(id: string): Memory | null;
    getMemoriesByType(type: MemoryType): Memory[];
    
    // ID管理
    updateMemoryId(oldId: string, newId: string): void;
    generateUniqueId(): string;
    validateId(id: string): boolean;
    
    // 関連性対応
    getReferencedMemories(): string[];
    updateReferences(oldId: string, newId: string): void;
}

interface Memory {
    id: string;
    type: MemoryType;
    content: string;
    period: string;
    emotional_valence: number;
    metadata?: Record<string, any>;
}

type MemoryType = 'episodic' | 'semantic' | 'procedural' | 'autobiographical';
```

### AssociationModule
```typescript
interface AssociationModule extends BaseDomainModule {
    // 関連性操作
    addAssociation(association: Association): string;
    updateAssociation(id: string, updates: Partial<Association>): void;
    removeAssociation(id: string): void;
    getAssociation(id: string): Association | null;
    
    // 複合条件
    addComplexCondition(assocId: string, condition: Condition): void;
    removeComplexCondition(assocId: string, conditionIndex: number): void;
    updateComplexCondition(assocId: string, conditionIndex: number, updates: Partial<Condition>): void;
    
    // 外部トリガー
    updateExternalItems(assocId: string, items: string[]): void;
    getExternalItems(assocId: string): string[];
    
    // 検索・分析
    findAssociationsByTrigger(trigger: TriggerCondition): Association[];
    findAssociationsByResponse(response: ResponseCondition): Association[];
    analyzeNetwork(): NetworkAnalysis;
}

interface Association {
    id: string;
    trigger: TriggerCondition;
    response: ResponseCondition;
    metadata?: Record<string, any>;
}

interface TriggerCondition {
    type: 'memory' | 'emotion' | 'external' | 'complex';
    id?: string;
    threshold?: number;
    category?: string;
    items?: string[];
    operator?: 'AND' | 'OR';
    conditions?: Condition[];
}

interface ResponseCondition {
    type: 'memory' | 'emotion';
    id: string;
    association_strength: number;
}

interface Condition {
    type: 'memory' | 'emotion' | 'external';
    id?: string;
    threshold?: number;
    category?: string;
    items?: string[];
}
```

### CognitiveModule
```typescript
interface CognitiveModule extends BaseDomainModule {
    // 認知モデル管理
    initializeModel(model: CognitiveModel): void;
    getModel(): CognitiveModel;
    switchModel(modelType: string): void;
    
    // 能力操作
    setAbilityLevel(abilityId: string, level: number): void;
    getAbilityLevel(abilityId: string): number;
    updateAbilityDescription(abilityId: string, description: string): void;
    
    // 分析
    generateProfile(): CognitiveProfile;
    getStatistics(): CognitiveStats;
    identifyStrengths(): AbilityRanking[];
    identifyWeaknesses(): AbilityRanking[];
}

interface CognitiveModel {
    type: 'WAIS-IV' | 'CHC' | 'Custom';
    abilities: Record<string, AbilityData>;
}

interface AbilityData {
    level: number;
    description: string;
    category?: string;
}

interface CognitiveProfile {
    overall: string;
    strengths: AbilityRanking[];
    weaknesses: AbilityRanking[];
    recommendations: string[];
}

interface AbilityRanking {
    ability: string;
    level: number;
    description: string;
}
```

---

## 🎮 アプリケーション層 インターフェース

### AppController
```typescript
interface AppController {
    // ライフサイクル
    initialize(): Promise<void>;
    start(): Promise<void>;
    stop(): Promise<void>;
    destroy(): Promise<void>;
    
    // 状態管理
    getState(): ApplicationState;
    setState(state: Partial<ApplicationState>): void;
    
    // モジュール制御
    loadModule(name: string): Promise<void>;
    unloadModule(name: string): Promise<void>;
    
    // UI制御
    switchTab(tabId: string): Promise<void>;
    showModal(modalId: string, data?: any): void;
    hideModal(modalId: string): void;
    showNotification(message: string, type: string): void;
}

interface ApplicationState {
    activeTab: string;
    persona: PersonaData;
    ui: UIState;
    settings: AppSettings;
}

interface UIState {
    modalStack: string[];
    notifications: Notification[];
    theme: 'light' | 'dark';
    loading: boolean;
}
```

### TabController
```typescript
interface TabController {
    // タブ管理
    loadTab(tabId: string): Promise<void>;
    unloadTab(tabId: string): void;
    switchTab(tabId: string): Promise<void>;
    
    // 状態管理
    saveTabState(tabId: string): void;
    restoreTabState(tabId: string): void;
    getTabHistory(): string[];
    
    // ライフサイクル
    onTabEnter(tabId: string, callback: () => void): void;
    onTabLeave(tabId: string, callback: () => void): void;
}
```

---

## 💾 インフラストラクチャ層 インターフェース

### StorageAdapter
```typescript
interface StorageAdapter {
    // 基本操作
    get(key: string): Promise<any>;
    set(key: string, value: any): Promise<void>;
    delete(key: string): Promise<void>;
    clear(): Promise<void>;
    
    // 一括操作
    getMultiple(keys: string[]): Promise<Record<string, any>>;
    setMultiple(data: Record<string, any>): Promise<void>;
    
    // メタ情報
    exists(key: string): Promise<boolean>;
    size(): Promise<number>;
    keys(): Promise<string[]>;
}

interface ValidationAdapter {
    // バリデーション
    validate(data: any, schema: ValidationSchema): ValidationResult;
    validateField(value: any, rules: ValidationRule[]): ValidationError[];
    
    // スキーマ管理
    registerSchema(name: string, schema: ValidationSchema): void;
    getSchema(name: string): ValidationSchema | null;
}
```

---

## 🎨 UI層 インターフェース

### ModalController
```typescript
interface ModalController {
    // モーダル管理
    show(modalId: string, options?: ModalOptions): Promise<any>;
    hide(modalId: string): void;
    hideAll(): void;
    
    // 状態管理
    isOpen(modalId: string): boolean;
    getOpenModals(): string[];
    
    // イベント
    onShow(modalId: string, callback: (data: any) => void): void;
    onHide(modalId: string, callback: () => void): void;
}

interface ModalOptions {
    title?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    closable?: boolean;
    data?: any;
    onConfirm?: () => void;
    onCancel?: () => void;
}
```

### NotificationController
```typescript
interface NotificationController {
    // 通知表示
    show(message: string, type: NotificationType, options?: NotificationOptions): string;
    hide(id: string): void;
    hideAll(): void;
    
    // 特別な通知
    success(message: string, options?: NotificationOptions): string;
    error(message: string, options?: NotificationOptions): string;
    warning(message: string, options?: NotificationOptions): string;
    info(message: string, options?: NotificationOptions): string;
    
    // プログレス通知
    showProgress(message: string, progress: number): string;
    updateProgress(id: string, message: string, progress: number): void;
}

type NotificationType = 'success' | 'error' | 'warning' | 'info';

interface NotificationOptions {
    duration?: number;
    persistent?: boolean;
    action?: {
        label: string;
        callback: () => void;
    };
}
```

---

## 📊 データ型定義

### PersonaData
```typescript
interface PersonaData {
    version: string;
    personal_info: PersonalInfo;
    background: string;
    current_emotion_state: Record<string, number>;
    emotion_system: EmotionSystem;
    personality: PersonalitySystem;
    memory_system: MemorySystem;
    association_system: AssociationSystem;
    cognitive_system: CognitiveSystem;
}

interface PersonalInfo {
    name: string;
    age: number | null;
    gender: string;
    occupation: string;
}

interface EmotionSystem {
    model: string;
    emotions: Record<string, EmotionData>;
}

interface PersonalitySystem {
    model: string;
    traits: Record<string, number>;
}

interface MemorySystem {
    memories: Memory[];
}

interface AssociationSystem {
    associations: Association[];
}

interface CognitiveSystem {
    model: string;
    abilities: Record<string, AbilityData>;
}
```

---

## 🎯 イベント定義

### システムイベント
```typescript
// アプリケーション
'app:initialized' | 'app:started' | 'app:stopped'
'app:error' | 'app:warning'

// 状態管理
'state:changed' | 'state:saved' | 'state:loaded'
'state:reset' | 'state:error'

// UI
'tab:changed' | 'tab:loaded' | 'tab:error'
'modal:opened' | 'modal:closed' | 'modal:confirmed'
'notification:shown' | 'notification:hidden'

// ドメイン - 感情
'emotion:baseline:changed' | 'emotion:state:changed'
'emotion:model:changed' | 'emotion:synced'

// ドメイン - 記憶  
'memory:added' | 'memory:updated' | 'memory:removed'
'memory:id:changed' | 'memory:validation:failed'

// ドメイン - 関連性
'association:added' | 'association:updated' | 'association:removed'
'association:condition:added' | 'association:condition:removed'

// ドメイン - 認知
'cognitive:ability:changed' | 'cognitive:model:changed'
'cognitive:profile:generated'
```

---

## ✅ 実装チェックリスト

### Phase 1: コアシステム
- [ ] StateManager.js - インターフェース準拠
- [ ] EventBus.js - インターフェース準拠  
- [ ] ModuleRegistry.js - インターフェース準拠
- [ ] AppController.js - インターフェース準拠

### Phase 2: ドメインモジュール
- [ ] EmotionModule.js - インターフェース準拠
- [ ] MemoryModule.js - インターフェース準拠
- [ ] AssociationModule.js - インターフェース準拠
- [ ] CognitiveModule.js - インターフェース準拠

### Phase 3: UI・統合
- [ ] TabController.js - インターフェース準拠
- [ ] ModalController.js - インターフェース準拠
- [ ] NotificationController.js - インターフェース準拠
- [ ] Alpine.js統合 - 状態バインディング確認

---

## 📋 次の作業

### 今回のチャットで実装
1. **StateManager.js** - 状態管理コア実装
   - 参照: この インターフェース定義書
   - サイズ: 200-250行予定

### 次回チャット用準備
- StateManager.js 完成版
- EventBus.js 実装指示
- 引継ぎ情報

---

*このインターフェース定義書は、全実装の基準となります。各実装ファイルは必ずこのインターフェースに準拠してください。*