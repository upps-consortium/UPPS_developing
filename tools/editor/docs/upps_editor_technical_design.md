# UPPSペルソナエディター 技術設計書

## ファイル構成

```
upps_editor_minimal/
├── index.html              # メインHTML
├── css/
│   └── styles.css          # メインスタイルシート
├── js/
│   ├── app.js              # アプリケーションメイン
│   ├── persona-data.js     # データモデル管理
│   ├── ui-controller.js    # UI制御
│   └── file-handler.js     # ファイル操作
├── lib/
│   └── js-yaml.min.js      # YAML処理ライブラリ（CDN代替）
└── README.md               # 使用方法
```

## アーキテクチャ設計

### MVC類似パターン
```
┌─────────────────┐
│   View (HTML)   │ ←→ ui-controller.js
└─────────────────┘
         ↕
┌─────────────────┐
│   Controller    │     app.js (coordination)
│   (JavaScript)  │ ←→ file-handler.js
└─────────────────┘
         ↕
┌─────────────────┐
│ Model (Data)    │     persona-data.js
└─────────────────┘
```

### データフロー
```
User Action → UI Controller → Data Model → View Update
File Operation → File Handler → Data Model → View Update
```

## クラス設計

### 1. PersonaData クラス
```javascript
class PersonaData {
  constructor()
  getPersona()                    // 全データ取得
  setPersona(data)               // 全データ設定
  updatePersonalInfo(info)       // 基本情報更新
  updatePersonality(traits)      // 性格特性更新
  updateEmotionSystem(emotions)  // 感情システム更新
  validate()                     // データ検証
  toYAML()                       // YAML形式出力
  fromYAML(yamlString)           // YAML形式読み込み
  reset()                        // 初期化
}
```

### 2. UIController クラス
```javascript
class UIController {
  constructor(personaData)
  initializeUI()                 // UI初期化
  bindEvents()                   // イベントバインディング
  showTab(tabName)               // タブ切り替え
  updatePersonalInfoUI(data)     // 基本情報UI更新
  updatePersonalityUI(data)      // 性格特性UI更新
  updateEmotionSystemUI(data)    // 感情システムUI更新
  updatePreview()                // プレビュー更新
  showNotification(message, type) // 通知表示
}
```

### 3. FileHandler クラス
```javascript
class FileHandler {
  constructor(personaData, uiController)
  loadFile(file)                 // ファイル読み込み
  saveFile(filename)             // ファイル保存
  exportYAML()                   // YAML出力
  importYAML(content)            // YAML入力
  validateYAML(content)          // YAML検証
}
```

### 4. App クラス（メイン）
```javascript
class App {
  constructor()
  init()                         // アプリ初期化
  handleNewPersona()             // 新規作成
  handleLoadFile()               // ファイル読み込み
  handleSaveFile()               // ファイル保存
  handleTabChange(tab)           // タブ変更
  handleDataChange()             // データ変更
}
```

## UI コンポーネント設計

### タブ構成
```html
<!-- タブナビゲーション -->
<nav class="tab-nav">
  <button class="tab-btn active" data-tab="personal">基本情報</button>
  <button class="tab-btn" data-tab="personality">性格特性</button>
  <button class="tab-btn" data-tab="emotions">感情システム</button>
  <button class="tab-btn" data-tab="preview">プレビュー</button>
</nav>

<!-- タブコンテンツ -->
<div class="tab-content">
  <div id="personal-tab" class="tab-panel active">...</div>
  <div id="personality-tab" class="tab-panel">...</div>
  <div id="emotions-tab" class="tab-panel">...</div>
  <div id="preview-tab" class="tab-panel">...</div>
</div>
```

### 基本情報タブ
```html
<div class="form-group">
  <label for="persona-name">氏名</label>
  <input type="text" id="persona-name" placeholder="例: 田中太郎">
</div>
<div class="form-group">
  <label for="persona-age">年齢</label>
  <input type="number" id="persona-age" placeholder="例: 25">
</div>
<div class="form-group">
  <label for="persona-background">背景情報</label>
  <textarea id="persona-background" rows="6" 
            placeholder="成育歴、生活背景の詳細記述..."></textarea>
</div>
```

### 性格特性タブ
```html
<div class="trait-group">
  <label for="openness-slider">開放性 (Openness)</label>
  <div class="slider-container">
    <input type="range" id="openness-slider" min="0" max="100" value="50">
    <span class="slider-value">50%</span>
  </div>
  <small class="trait-description">新しい経験や概念への受容性</small>
</div>
<!-- 他の4特性も同様 -->
```

### 感情システムタブ
```html
<div class="emotion-group">
  <label for="joy-slider">喜び (Joy)</label>
  <div class="slider-container">
    <input type="range" id="joy-slider" min="0" max="100" value="50">
    <span class="slider-value">50</span>
  </div>
  <small class="emotion-description">幸福感、満足感</small>
</div>
<!-- 他の5感情も同様 -->
```

## CSS設計方針

### CSS Grid レイアウト
```css
.app-container {
  display: grid;
  grid-template-areas: 
    "header header"
    "nav content"
    "nav preview";
  grid-template-columns: 250px 1fr;
  grid-template-rows: auto 1fr auto;
  height: 100vh;
}

.header { grid-area: header; }
.tab-nav { grid-area: nav; }
.tab-content { grid-area: content; }
.preview-panel { grid-area: preview; }
```

### CSS Custom Properties（テーマ対応）
```css
:root {
  --primary-color: #3b82f6;
  --secondary-color: #64748b;
  --success-color: #10b981;
  --error-color: #ef4444;
  --warning-color: #f59e0b;
  
  --bg-primary: #ffffff;
  --bg-secondary: #f8fafc;
  --text-primary: #1e293b;
  --text-secondary: #64748b;
  
  --border-radius: 8px;
  --box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}
```

### BEM記法採用
```css
.form-group { }
.form-group__label { }
.form-group__input { }
.form-group__help { }

.slider-container { }
.slider-container__input { }
.slider-container__value { }
.slider-container--disabled { }
```

## イベント設計

### イベントバインディング戦略
```javascript
// イベント委譲を活用
document.addEventListener('click', (e) => {
  if (e.target.matches('.tab-btn')) {
    handleTabClick(e);
  }
  if (e.target.matches('.file-btn')) {
    handleFileAction(e);
  }
});

document.addEventListener('input', (e) => {
  if (e.target.matches('.persona-input')) {
    handleDataChange(e);
  }
});

document.addEventListener('change', (e) => {
  if (e.target.matches('.slider-input')) {
    handleSliderChange(e);
  }
});
```

### カスタムイベント
```javascript
// データ変更イベント
const dataChangeEvent = new CustomEvent('personaDataChanged', {
  detail: { field: 'personality.traits.openness', value: 0.7 }
});

// UI更新イベント
const uiUpdateEvent = new CustomEvent('uiUpdateRequired', {
  detail: { tab: 'personality', data: updatedData }
});
```

## エラーハンドリング

### 階層的エラーハンドリング
```javascript
class ErrorHandler {
  static handleFileError(error) {
    console.error('File Error:', error);
    this.showNotification('ファイル操作エラー: ' + error.message, 'error');
  }
  
  static handleValidationError(errors) {
    console.warn('Validation Error:', errors);
    this.showNotification('入力エラー: ' + errors.join(', '), 'warning');
  }
  
  static handleYAMLError(error) {
    console.error('YAML Error:', error);
    this.showNotification('YAML形式エラー: ' + error.message, 'error');
  }
  
  static showNotification(message, type = 'info') {
    // 通知UI表示
  }
}
```

## パフォーマンス考慮

### 軽量化戦略
1. **ライブラリ最小化**: js-yamlのみ使用
2. **コード分割**: 機能ごとにファイル分割
3. **遅延読み込み**: 必要時のみ処理実行
4. **メモ化**: 重い計算結果のキャッシュ

### メモリ管理
```javascript
class PerformanceOptimizer {
  static debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
  
  static throttle(func, limit) {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    }
  }
}
```

## テスト戦略

### 単体テスト対象
- PersonaData クラスのメソッド
- バリデーション関数
- YAML変換関数

### 結合テスト対象
- ファイル読み込み → データ更新 → UI反映
- UI操作 → データ更新 → ファイル出力

### 手動テスト項目
- 各ブラウザでの動作確認
- レスポンシブデザイン確認
- ファイル操作の動作確認

## セキュリティ考慮

### XSS対策
```javascript
function sanitizeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
```

### ファイルアップロード検証
```javascript
function validateFile(file) {
  // ファイルサイズ制限
  if (file.size > 1024 * 1024) { // 1MB
    throw new Error('ファイルサイズが大きすぎます');
  }
  
  // ファイル拡張子確認
  if (!file.name.match(/\.(yaml|yml)$/i)) {
    throw new Error('YAMLファイルのみ対応しています');
  }
  
  return true;
}
```