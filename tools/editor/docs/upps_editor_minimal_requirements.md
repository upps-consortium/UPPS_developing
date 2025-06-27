# UPPSペルソナエディター 最小要件定義

## 基本方針
- **軽量性**: 外部ライブラリを最小限に抑制
- **シンプル性**: 必要な機能のみに集中
- **保守性**: 理解しやすいコード構造
- **実用性**: 実際に使える最小限の機能

## 最小機能セット

### 必須機能（MVP）
1. **基本情報編集**
   - 氏名、年齢、性別、職業の入力
   - 背景情報のテキスト入力

2. **性格特性編集**
   - BigFive特性のスライダー入力（5項目）
   - リアルタイムプレビュー

3. **感情システム編集**
   - 基本6感情（Ekman）のベースライン値設定
   - シンプルなスライダーUI

4. **ファイル操作**
   - YAMLファイルの読み込み
   - YAMLファイルの書き出し
   - 新規作成・クリア機能

### 後期追加予定
1. **記憶システム編集**（リスト形式）
2. **関連性ネットワーク編集**（簡易フォーム）
3. **バリデーション機能**
4. **プレビューモード**

## 技術選択（最小構成）

### 核心技術
- **HTML5** + **CSS3** + **Vanilla JavaScript**
- **js-yaml**: YAMLパース用（CDN経由）
- **ブラウザ標準API**: File API, localStorage

### スタイリング
- **CSS Grid/Flexbox**: レイアウト
- **CSS Custom Properties**: テーマ対応
- **最小限のCSSフレームワーク**: 検討中（Pico.css等）

### データフロー
```
User Input → JavaScript Object → YAML → File Download
File Upload → YAML → JavaScript Object → UI Update
```

## UI設計原則

### レイアウト
- **シングルページアプリ**: タブ切り替え
- **カード型UI**: 各セクションをカードで区切り
- **レスポンシブ**: モバイル対応

### 操作フロー
```
1. 新規作成 または ファイル読み込み
2. 各タブで編集
3. リアルタイムプレビュー（YAML）
4. ファイル保存
```

## 画面構成（最小版）

### ヘッダー
- アプリタイトル
- ファイル操作ボタン（新規、開く、保存）

### メインエリア
- **タブナビゲーション**
  - 基本情報
  - 性格特性
  - 感情システム
  - プレビュー
- **編集エリア**（タブごとに切り替え）

### サイドバー（オプション）
- YAMLプレビュー（折りたたみ可能）

## データ構造（最小版）

```javascript
const personaData = {
  personal_info: {
    name: "",
    age: null,
    gender: "",
    occupation: ""
  },
  background: "",
  personality: {
    model: "BigFive",
    traits: {
      openness: 0.5,
      conscientiousness: 0.5,
      extraversion: 0.5,
      agreeableness: 0.5,
      neuroticism: 0.5
    }
  },
  emotion_system: {
    model: "Ekman",
    emotions: {
      joy: { baseline: 50, description: "喜び、幸福感" },
      sadness: { baseline: 30, description: "悲しみ、失望感" },
      anger: { baseline: 25, description: "怒り、いらだち" },
      fear: { baseline: 40, description: "恐れ、不安" },
      disgust: { baseline: 20, description: "嫌悪、不快感" },
      surprise: { baseline: 55, description: "驚き、意外性への反応" }
    }
  }
};
```

## 開発フェーズ

### Phase 1: 基盤構築（1-2日）
- [ ] HTML構造の作成
- [ ] 基本CSS設計
- [ ] JavaScript基盤クラス
- [ ] ファイル操作機能

### Phase 2: 基本編集機能（2-3日）
- [ ] 基本情報編集UI
- [ ] 性格特性編集UI（スライダー）
- [ ] 感情システム編集UI
- [ ] データバインディング

### Phase 3: 統合とテスト（1-2日）
- [ ] YAMLプレビュー機能
- [ ] バリデーション
- [ ] テスト用ペルソナでの動作確認
- [ ] ドキュメント作成

### Phase 4: 拡張機能（必要に応じて）
- [ ] 記憶システム
- [ ] 関連性ネットワーク
- [ ] 高度なバリデーション

## 成功指標

### 技術指標
- ファイルサイズ: HTML+CSS+JS < 100KB
- 起動時間: < 1秒
- 対応ブラウザ: Chrome, Firefox, Safari, Edge

### 機能指標
- 基本的なUPPSペルソナの作成・編集が可能
- YAMLファイルの正常な入出力
- 直感的で使いやすいUI

## 制約事項

### 当面の制約
- ネットワーク図表示は後回し
- 高度なバリデーションは後回し
- 複雑な関連性編集は後回し
- 多言語対応は後回し

### 技術的制約
- ブラウザ環境のみ（サーバー不要）
- localStorage使用（セキュリティ考慮が必要な場合は制限）
- モダンブラウザ前提（IE11サポートなし）