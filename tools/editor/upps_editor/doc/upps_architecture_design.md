# UPPS 新アーキテクチャ設計書（制約対応版）

## 🎯 設計方針

### 制約への対応策
1. **小さなファイル単位**: 1ファイル = 1つのアーティファクト（200-300行以内）
2. **最小依存**: 各ファイルが独立して作成・テスト可能
3. **段階的実装**: インターフェース → 骨組み → 詳細実装の順序
4. **自己完結**: 新しいチャットでも即座に作業再開可能

---

## 🏗️ 新アーキテクチャ概要

### レイヤー構成
```
📱 Presentation Layer (Alpine.js Templates)
    ↓ Events & State Binding
🎮 Application Layer (State Management + Event Bus)  
    ↓ Domain Events
💼 Domain Layer (Business Modules)
    ↓ Data Operations  
💾 Infrastructure Layer (Storage + Utils)
```

### 核となる4つのコアファイル
1. **StateManager.js** (150-200行) - 状態管理の中枢
2. **EventBus.js** (100-150行) - イベント通信システム
3. **ModuleRegistry.js** (100-150行) - モジュール管理
4. **AppController.js** (200-250行) - アプリケーション制御

---

## 📋 作業工程（制約対応）

### Phase 1: コア設計（Week 1-2）

#### Step 1-1: インターフェース定義
**作成ファイル**: `interfaces.md` (1アーティファクト)
**参照**: なし（新規設計）
**内容**: TypeScript風の型定義、メソッドシグネチャ

#### Step 1-2: StateManager設計＋実装
**作成ファイル**: `StateManager.js` (1アーティファクト)
**参照**: `interfaces.md` のみ
**内容**: Alpine.js統合、リアクティブ状態管理

#### Step 1-3: EventBus設計＋実装  
**作成ファイル**: `EventBus.js` (1アーティファクト)
**参照**: `interfaces.md` のみ
**内容**: パブサブパターン、ミドルウェア対応

#### Step 1-4: ModuleRegistry設計＋実装
**作成ファイル**: `ModuleRegistry.js` (1アーティファクト)  
**参照**: `StateManager.js`, `EventBus.js`
**内容**: 動的モジュール管理、依存解決

### Phase 2: ドメインモジュール移行（Week 3-4）

#### Step 2-1: EmotionModule v2.0
**作成ファイル**: `EmotionModule.js` (1アーティファクト)
**参照**: 既存 `emotion_system.js` + 新コアファイル
**手法**: 既存ロジック抽出 + 新アーキテクチャ適用

#### Step 2-2: MemoryModule v2.0  
**作成ファイル**: `MemoryModule.js` (1アーティファクト)
**参照**: 既存 `memory_system.js` + 新コアファイル
**手法**: 同上

#### Step 2-3: AssociationModule v2.0
**作成ファイル**: `AssociationModule.js` (1アーティファクト) 
**参照**: 既存 `association_system.js` + 新コアファイル
**手法**: 同上

#### Step 2-4: CognitiveModule v2.0
**作成ファイル**: `CognitiveModule.js` (1アーティファクト)
**参照**: 既存 `cognitive_system.js` + 新コアファイル  
**手法**: 同上

### Phase 3: UI・統合（Week 5-6）

#### Step 3-1: AppController実装
**作成ファイル**: `AppController.js` (1アーティファクト)
**参照**: 全コアファイル + 既存 `app.js`（部分）
**内容**: アプリケーション初期化とライフサイクル管理

#### Step 3-2: Alpine.js統合
**作成ファイル**: `alpine-integration.js` (1アーティファクト)
**参照**: `StateManager.js` + 既存タブファイル（1つずつ）
**内容**: ストア設定、ディレクティブ、テンプレート更新

#### Step 3-3: 各UIモジュール更新（個別）
- `TabController.js` (1アーティファクト)
- `ModalController.js` (1アーティファクト)  
- `NotificationController.js` (1アーティファクト)

### Phase 4: 統合・テスト（Week 7-8）

#### Step 4-1: 段階的移行スクリプト
**作成ファイル**: `migration-guide.md` + `bootstrap.js` 
**内容**: 既存システムから新システムへの切り替え手順

#### Step 4-2: テスト・最適化
各モジュールの動作確認と性能調整

---

## 🔧 実装戦略

### 1. 最小依存の原則
```javascript
// 悪い例（多数のファイル参照が必要）
class EmotionSystem {
    constructor(app, storage, validator, modal, notification) { ... }
}

// 良い例（コアファイルのみ依存）
class EmotionModule {
    constructor(eventBus, stateManager) { 
        this.eventBus = eventBus;
        this.stateManager = stateManager;
    }
}
```

### 2. インターフェース駆動開発
```typescript
// interfaces.md で事前定義
interface StateManager {
    setState(path: string, value: any): void;
    getState(path: string): any;
    subscribe(path: string, callback: Function): void;
}

interface EventBus {
    emit(event: string, data: any): void;
    on(event: string, handler: Function): void;
}
```

### 3. 段階的実装
```javascript
// Step 1: 骨組み（アーティファクト1）
class StateManager {
    constructor() { /* 基本構造のみ */ }
    setState() { /* TODO */ }
}

// Step 2: 詳細実装（アーティファクト2で更新）
class StateManager {
    constructor() { /* 完全実装 */ }
    setState(path, value) { /* 完全なロジック */ }
}
```

---

## 📄 各作業のアーティファクト制限

### ファイルサイズ目安
- **設計文書**: 100-150行
- **コアファイル**: 150-250行  
- **モジュールファイル**: 200-300行
- **統合スクリプト**: 100-200行

### 参照ファイル制限
- **新規作成時**: 参照ファイル2-3個まで
- **既存更新時**: 元ファイル1個 + 関連コア2-3個まで
- **統合作業時**: コアファイル群のみ

---

## 🔄 チャット引継ぎ戦略

### 各チャットの完了条件
1. **実装済みファイル**の完全版アーティファクト作成
2. **次の作業指示書**作成（参照ファイル、実装内容明記）
3. **テスト手順書**作成（動作確認方法）

### 引継ぎテンプレート
```markdown
## 前回の成果物
- StateManager.js (完成)
- EventBus.js (完成)

## 今回の作業内容  
- ModuleRegistry.js 実装
- 参照ファイル: StateManager.js, EventBus.js, interfaces.md

## 実装要件
[具体的な要件]

## テスト方法
[動作確認手順]
```

---

## 🎯 成功指標（制約考慮版）

### プロセス指標
- [ ] 各ファイルが単独でアーティファクト内完結
- [ ] 参照ファイル数が常に3個以下
- [ ] チャット引継ぎが5分以内で完了
- [ ] 各段階で動作確認可能

### 技術指標
- [ ] Alpine.js完全統合
- [ ] モジュール間の疎結合実現
- [ ] 既存機能の100%保持
- [ ] パフォーマンス向上

---

## 📋 次のアクション

### 即座に実行（今回のチャット）
1. **インターフェース定義書**作成（参照ファイル: なし）
2. **StateManager.js**設計＋実装（参照ファイル: interfaces.md）

### 次回チャット用の準備
- StateManager.js完成版
- EventBus.js実装指示書
- 引継ぎ情報まとめ

---

この設計で制約を克服しながら効率的に新アーキテクチャを実現できますが、いかがでしょうか？

まず**インターフェース定義書**から始めますか？
