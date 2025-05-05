### 6. ウェブサイトとドメイン関連

- [x] upps-consortium.org ドメインの取得
- [ ] プロジェクトウェブサイトの構築計画立案
- [ ] 基本情報ページの作成
- [ ] オンラインドキュメント整備
- [ ] ダウンロードセクション設計
- [ ] FAQ作成
- [ ] ドメイン情報をREADMEに反映# UPPS プロジェクト管理ドキュメント

## ファイル構成図

```
upps/
├── LICENSE                        # ライセンス情報
├── README.md                      # プロジェクト概要
├── CONTRIBUTING.md                # 貢献ガイドライン
│
├── specification/                 # 規格仕様関連
│   ├── upps_standard.md           # 規格定義書
│   ├── operational_guidelines.md  # 運用指針
│   └── schema/                    # スキーマ定義
│       └── upps_schema.yaml       # YAML形式のスキーマ
│
├── prompting/                     # プロンプト主導型アプローチ関連
│   ├── direct_prompting_guide.md  # 直接プロンプト利用ガイド
│   ├── templates/                 # プロンプトテンプレート
│   │   ├── basic_template.md      # 基本テンプレート
│   │   ├── state_update.md        # 状態更新用テンプレート
│   │   └── memory_trigger.md      # 記憶トリガー用テンプレート
│   └── examples/                  # プロンプト使用例
│       ├── conversation_example.md # 会話例
│       └── session_management.md   # セッション管理例
│
├── programming/                   # プログラム主導型アプローチ関連
│   ├── implementation_guide.md    # 実装ガイド
│   ├── api_reference.md           # APIリファレンス
│   └── examples/                  # プログラム例
│       ├── basic_chatbot.py       # 基本的なチャットボット
│       ├── state_visualization.py # 状態可視化
│       └── web_interface/         # Webインターフェース
│
└── examples/                      # 共通サンプル
    └── profiles/                  # サンプルプロファイル
        ├── basic_profile.yaml     # 基本的なプロファイル
        ├── counselor_profile.yaml # カウンセラープロファイル
        └── patient_profile.yaml   # 患者プロファイル
```

## ToDo リスト

### 1. 規格仕様書の整理と統一

- [x] 仕様書とスキーマの内容を整合させる（属性名、必須フィールド、データ型など）
- [x] スキーマファイルから日付フィールドを削除
- [x] 「感情記憶」の用語に統一
- [x] `upps-specification.md` を整理して `specification/upps_standard.md` に移行
- [x] スキーマファイル (`upps-schema.yaml` と `upps-schema.txt`) を統合
- [x] 統合したスキーマを `specification/schema/upps_schema.yaml` に配置
- [x] 運用指針 (`upps-operational-guidelines.md`) を `specification/operational_guidelines.md` に移行

### 2. プロンプト関連ドキュメントの整理

- [x] 基本テンプレート (`prompting/templates/basic_template.md`) を作成
- [x] 状態更新テンプレート (`prompting/templates/state_update.md`) を作成
- [x] 記憶トリガーテンプレート (`prompting/templates/memory_trigger.md`) を作成
- [ ] 直接プロンプト利用ガイド (`upps-direct-prompting-guide-revised.md`) を整理
- [ ] 整理したガイドを `prompting/direct_prompting_guide.md` に移行
- [ ] 会話例 (`upps-conversation-example-revised.md`) を `prompting/examples/conversation_example.md` に移行
- [ ] セッション管理の例を作成して `prompting/examples/session_management.md` に配置

### 3. 実装ガイドの整理

- [ ] 実装ガイド (`upps-implementation-guide.md`) を `programming/implementation_guide.md` に移行
- [ ] APIリファレンス (`programming/api_reference.md`) を新規作成
- [ ] サンプルコードの作成:
  - [ ] `programming/examples/basic_chatbot.py`
  - [ ] `programming/examples/state_visualization.py`
  - [ ] `programming/examples/web_interface/` ディレクトリとファイル

### 4. README と全体構造の整備

- [x] `upps-readme.md` を改良して新しいファイル構造を反映した `README.md` を作成
- [ ] `CONTRIBUTING.md` を新規作成
- [ ] サンプルプロファイルの整備:
  - [ ] `examples/profiles/basic_profile.yaml`
  - [ ] `examples/profiles/counselor_profile.yaml`
  - [ ] `examples/profiles/patient_profile.yaml`

### 5. 不整合と問題点への対処

- [ ] スキーマと仕様書の不一致を修正
- [ ] ドキュメント間の相互参照を更新
- [ ] 実装例の不足を補う
- [ ] セクションの重複を解消

## 優先タスク

1. **規格仕様書とスキーマの整合**
   - スキーマと仕様書の内容を比較し、不一致を洗い出す
   - 一貫した用語と構造に統一
   - 必須フィールドの定義を明確化

2. **基本テンプレートの分割と整理**
   - 基本テンプレートを機能別に分割
   - 各テンプレートのフォーマットを統一
   - テンプレート間の参照関係を整理

3. **ディレクトリ構造の作成**
   - 新しいディレクトリ構造を作成
   - 既存ファイルを適切な場所に移動

4. **サンプルプロファイルの整備**
   - 実用的なサンプルプロファイルを作成
   - 異なるユースケース向けのバリエーションを追加
