# UPPSペルソナエディター 開始ガイド

## 🚀 今すぐ始める手順

### 1. プロトタイプの設置
1. 上記のHTMLファイルを `upps-editor.html` として保存
2. ブラウザで開く（ChromeまたはFirefox推奨）
3. 基本動作を確認

### 2. 初期テスト項目
```
□ タブ切り替えが正常に動作するか
□ 基本情報の入力ができるか
□ スライダーが動作し、値が更新されるか
□ YAMLプレビューが表示されるか
□ ファイル保存・読み込みができるか
```

### 3. サンプルペルソナでのテスト
以下のYAMLファイルを作成し、読み込みテストを行う：

```yaml
personal_info:
  name: "テスト太郎"
  age: 30
  gender: "Male"
  occupation: "エンジニア"

background: |
  システム開発に従事する30代男性。
  几帳面で責任感が強いが、やや神経質な面もある。

personality:
  model: "BigFive"
  traits:
    openness: 0.7
    conscientiousness: 0.8
    extraversion: 0.4
    agreeableness: 0.6
    neuroticism: 0.6

emotion_system:
  model: "Ekman"
  emotions:
    joy:
      baseline: 55
      description: "幸福感、満足感"
    sadness:
      baseline: 35
      description: "悲しみ、失望感"
    anger:
      baseline: 30
      description: "怒り、いらだち"
    fear:
      baseline: 45
      description: "恐れ、不安"
    disgust:
      baseline: 25
      description: "嫌悪、不快感"
    surprise:
      baseline: 50
      description: "驚き、意外性への反応"
```

## 🔧 即座に改善すべき点

### 優先度【高】- 今すぐ修正
1. **キーボードショートカット**
   ```javascript
   // app.js に追加
   document.addEventListener('keydown', (e) => {
     if (e.ctrlKey) {
       switch(e.key) {
         case 's':
           e.preventDefault();
           app.handleSaveFile();
           break;
         case 'o':
           e.preventDefault();
           app.handleLoadFile();
           break;
         case 'n':
           e.preventDefault();
           app.handleNewPersona();
           break;
       }
     }
   });
   ```

2. **入力検証の追加**
   ```javascript
   // PersonaData.js に追加
   validatePersonalInfo(info) {
     const errors = [];
     
     if (info.age && (info.age < 0 || info.age > 150)) {
       errors.push('年齢は0-150の範囲で入力してください');
     }
     
     if (info.name && info.name.length > 100) {
       errors.push('氏名は100文字以内で入力してください');
     }
     
     return errors;
   }
   ```

3. **自動保存機能**
   ```javascript
   // app.js に追加
   class AutoSave {
     constructor(personaData) {
       this.personaData = personaData;
       this.init();
     }
     
     init() {
       // 30秒ごとに自動保存
       setInterval(() => {
         this.save();
       }, 30000);
       
       // ページ離脱時に保存
       window.addEventListener('beforeunload', () => {
         this.save();
       });
     }
     
     save() {
       const data = this.personaData.getData();
       localStorage.setItem('upps-autosave', JSON.stringify(data));
       console.log('自動保存しました');
     }
     
     load() {
       const saved = localStorage.getItem('upps-autosave');
       return saved ? JSON.parse(saved) : null;
     }
   }
   ```

### 優先度【中】- 今週中に対応
1. **レスポンシブデザインの調整**
2. **YAML構文ハイライト**
3. **より詳細なエラーメッセージ**
4. **ツールチップヘルプ**

### 優先度【低】- 来週以降
1. **記憶システムUI**
2. **関連性ネットワークUI**
3. **テンプレート機能**

## 🐛 既知の問題と回避策

### 問題1: js-yamlライブラリの読み込み失敗
**症状**: 「jsyaml is not defined」エラー
**回避策**: 
```html
<!-- CDNが失敗した場合の代替 -->
<script src="https://unpkg.com/js-yaml@4.1.0/dist/js-yaml.min.js"></script>
```

### 問題2: ファイル選択ダイアログが開かない
**症状**: 「開く」ボタンを押しても反応しない
**回避策**: ブラウザの設定でファイルアクセスを許可

### 問題3: 日本語入力での文字化け
**症状**: 日本語が正しく保存・読み込みされない
**回避策**: ファイル保存時にUTF-8エンコーディングを明示

## 📈 開発効率化のTips

### 1. 開発用ブックマークレット
```javascript
// デバッグ情報表示
javascript:(function(){
  const data = app.personaData.getData();
  console.log('Current Data:', data);
  alert('現在のデータをコンソールに出力しました');
})();
```

### 2. 開発用設定
```javascript
// app.js の先頭に追加（本番では削除）
const DEBUG_MODE = true;

if (DEBUG_MODE) {
  // コンソールにデバッグ情報を出力
  window.app = app; // グローバルからアクセス可能に
  
  // 自動的にサンプルデータを読み込み
  app.personaData.fromYAML(`
    personal_info:
      name: "開発テスト"
      age: 25
      gender: "Male"
      occupation: "テスター"
    background: "開発用のテストデータです"
  `);
}
```

### 3. 高速テスト用関数
```javascript
// 開発時のみ使用
function quickTest() {
  // 全フィールドに適当な値を設定
  app.personaData.updatePersonalInfo({
    name: "テスト太郎",
    age: 30,
    gender: "Male",
    occupation: "エンジニア"
  });
  
  app.personaData.updateBackground("テスト用の背景情報");
  
  console.log("クイックテストデータを設定しました");
}
```

## 📚 参考資料

### UPPS規格関連
- [UPPS標準仕様書](./specification/upps_standard.md)
- [運用指針](./specification/operational_guidelines.md)
- [スキーマ定義](./specification/schema/upps_schema.yaml)

### 技術参考
- [js-yaml Documentation](https://github.com/nodeca/js-yaml)
- [CSS Grid Complete Guide](https://css-tricks.com/snippets/css/complete-guide-grid/)
- [JavaScript Classes MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes)

## 🎯 次のマイルストーン

### 今日やること
1. プロトタイプの動作確認
2. 改善点のリストアップ
3. Phase 2の具体的タスク定義

### 今週のゴール
- 基本機能の完成
- エラーハンドリングの強化
- ユーザビリティの向上

### 来週のゴール
- 拡張機能の実装
- テスト項目の充実
- ドキュメントの整備

---

**重要**: このプロトタイプは実際に動作する最小限の機能を持っています。まずは手を動かして使ってみて、必要な改善点を体感することから始めましょう。完璧を目指すより、まずは動くものを作って改善していくアプローチが効果的です。