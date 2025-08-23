# UPPS - Unified Personality Profile Standard 改訂版2025.3

[![License: Custom](https://img.shields.io/badge/License-UPPS_Custom-blue.svg)](./LICENSE.md)
[![Version: 2025.3 v1.0.0](https://img.shields.io/badge/Version-2025.3_v1.0.0-brightgreen.svg)](https://github.com/upps-consortium/upps)
[![Documentation Status](https://img.shields.io/badge/docs-latest-informational)](https://github.com/upps-consortium/upps/wiki)

> 「人格モデルの標準化とペルソナ表現を通じてAIと人間の対話に一貫性と深みをもたらす」

## 概要

UPPS（Unified Personality Profile Standard）は、対話型AIや架空クライアントにおいて人格モデルを「ペルソナ」として記述・共有・運用するための標準フォーマットです。人格の静的側面（性格特性や背景情報）に加え、動的に変動する内部状態（State）、およびセッション単位の文脈情報（Session_Context）を扱い、より自然で臨場感ある対話を実現します。

UPPSでは、UPPS標準に基づく人格データセットを「UPPSペルソナ」と呼びます。一般的なプロファイル（構成情報）という用語とは区別します。

**改訂版2025.3**では、2025.2の機能を継承しつつ、対話実行指示フレームワークと動的人格変容システムを追加しました。これにより長期的変化や症状表現をより柔軟に扱えます。

## 特徴

- **標準化されたYAML形式**: 一貫した形式で人格情報を記述
- **BigFiveモデル準拠**: 性格特性を科学的に裏付けられた枠組みで表現
- **動的状態管理**: 対話中の感情状態を動的に管理
- **記憶トリガーシステム**: エピソード記憶と想起トリガーのモデリング
- **セッション文脈**: 対話の背景や目的を明示的に設定
- **マルチドメイン**: 心理、医療、教育、AIなど様々な分野に適用可能
- **[新機能]** **感情システム**: 感情モデルに基づく感情のセットと基本特性の定義
- **[新機能]** **記憶システム**: 記憶タイプを区別した構造化された記憶表現
- **[新機能]** **関連性ネットワーク**: 感情と記憶の相互作用を記述
- **[新機能]** **認知能力システム**: WAIS-IVモデルに基づく知的能力の表現
- **[新機能]** **対話実行指示フレームワーク**: 症状や特殊表現を統一的に指示
- **[新機能]** **動的人格変容システム**: 長期的な変化を管理

## アプローチ

### 🚀 プロンプト主導型アプローチ（優先開発）

プロンプトエンジニアリングを活用して、プログラミングなしでUPPSペルソナを大規模言語モデル（LLM）に適用する方法です。現在以下のドキュメントが利用可能です：

#### ✅ 利用可能なドキュメント

- [基本テンプレート](./prompting/templates/basic_template.md): 基本的なUPPSペルソナプロンプトテンプレート
- [サンプルペルソナ - レイチェル YAML](./persona_lib/rachel_bladerunner.yaml) / [解説](./persona_lib/rachel_bladerunner.md)
- [サンプルペルソナ - ラムちゃん YAML](./persona_lib/lum_urusei_yatsura.yaml) / [解説](./persona_lib/lum_urusei_yatsura.md)

#### 📋 開発予定（プロンプト主導型）

- **直接プロンプト利用ガイド**: LLMプロバイダごとの最適化ガイド（近日公開）
- **会話例ドキュメント**: 実際の対話例と解説（近日公開）
- **セッション管理ガイド**: 複数セッションにわたる対話管理方法（近日公開）
- **トラブルシューティングガイド**: よくある問題と解決策（近日公開）

### 💻 プログラム主導型アプローチ（将来計画）

APIやライブラリを使用して、プログラム的にUPPSペルソナをシステムと統合する方法です。

````python
# 将来的な実装イメージ
from upps import UPPSPersona, UPPSChatBot

# ペルソナの読み込み
persona = UPPSPersona("persona.yaml")  

# チャットボットの初期化
bot = UPPSChatBot(persona)

# 対話
response = bot.chat("こんにちは、あなたについて教えてください。")
print(response)
````

#### 📋 実装予定

- **Pythonライブラリ**: コア機能の実装（2025年下半期予定）
- **Node.jsライブラリ**: JavaScript実装（2025年下半期予定）
- **REST API**: Web APIの提供（2025年下半期予定）
- **Webインターフェース**: ブラウザベースの対話システム（2025年下半期予定）

## クイックスタート（プロンプト主導型）

以下のテンプレートを使用して、LLMとの対話を開始できます：

````
# UPPSペルソナシミュレーション指示

あなたはUPPS（Unified Personality Profile Standard）改訂版2025.3に基づいた対話を行います。

## ペルソナ情報

````yaml
personal_info:
  name: "Jane Doe"
  age: 29
  gender: "Female"

emotion_system:
  model: "Ekman"
  emotions:
    joy:
      baseline: 60
      description: "幸福感、満足感"
    curiosity:
      baseline: 85  
      description: "好奇心、知的探究心"
````

## 指示

1. 上記のペルソナ情報に基づいた人格として応答してください
2. 各応答の最後に、現在の感情状態と関連性ID/強度を【状態】および【関連性】セクションとして追加してください

---

こんにちは、調子はどうですか？
````

## ドキュメント構成

### ✅ 現在利用可能

`persona_lib/medical/templates` には **31** 件の疾患テンプレートディレクトリが、`persona_lib/medical/examples` には **32** 件のサンプルペルソナが含まれています（疾患はICD-11コード順）。

```
upps/
├── LICENSE.md                     # ライセンス情報
├── README.md                      # このファイル
│
├── specification/                 # 規格仕様 ✅
│   ├── upps_2025_3_specification.md  # 規格定義書
│   ├── operational_guidelines.md     # 運用指針
│   └── schema/                       # スキーマ定義
│       └── upps_schema.yaml
│
├── prompting/                     # プロンプト主導型 ✅
│   ├── README.md                     # プロンプトフォルダ内の案内
│   ├── prompt_guide.md               # プロンプト実施ガイド（詳細）
│   ├── templates/
│   │   ├── basic_template.md         # 基本テンプレート
│   │   └── standard_template.md      # 標準テンプレート（2025.3対応）
│   └── providers/
│       ├── openai_gpt_template.md         # OpenAI GPT用テンプレート
│       ├── anthropic_claude_template.md   # Anthropic Claude用テンプレート
│       ├── google_gemini_template.md      # Google Gemini用テンプレート
│       └── meta_llama_template.md         # Meta Llama用テンプレート
│
├── tools/
│   └── editor/                    # ペルソナ編集ツール
│
└── persona_lib/                   # ペルソナファイルライブラリ
    ├── README.md
    ├── rachel_bladerunner.yaml    # サンプルペルソナデータ
    ├── rachel_bladerunner.md      # 解説
    ├── lum_urusei_yatsura.yaml    # サンプルペルソナデータ
    ├── lum_urusei_yatsura.md      # 解説
    ├── original_characters/
    └── medical/
        ├── README.md
        ├── medical_main_readme_fixed.md
        ├── templates/            # 31 disorder templates
        │   ├── README.md
        │   ├── 6A02 autism/
        │   ├── 6A05 adhd/
        │   ├── 6A20 schizophrenia/
        │   ├── 6A24 delusional_disorder/
        │   ├── 6A61 bipolar/
        │   ├── 6A72 depression/
        │   ├── 6A72 persistent_depression/
        │   ├── 6B00 anxiety/
        │   ├── 6B01 panic/
        │   ├── 6B03 specific_phobia/
        │   ├── 6B04 social_anxiety/
        │   ├── 6B20 ocd/
        │   ├── 6B21 body_dysmorphic/
        │   ├── 6B24 hoarding/
        │   ├── 6B41 acute_stress/
        │   ├── 6B41 ptsd/
        │   ├── 6B43 adjustment/
        │   ├── 6B64 depersonalization/
        │   ├── 6B65 dissociative_identity/
        │   ├── 6B80 anorexia/
        │   ├── 6B81 bulimia/
        │   ├── 6B82 binge_eating/
        │   ├── 6C20 somatic_symptom/
        │   ├── 6C21 illness_anxiety/
        │   ├── 6C40 alcohol_use/
        │   ├── 6C4A opioid_use/
        │   ├── 6C50 gambling/
        │   ├── 6D10 borderline_pd/
        │   ├── 6D40 avoidant_pd/
        │   ├── 6D80 alzheimer/
        │   └── 6D90 antisocial_pd/
        └── examples/             # 32 sample personas
            ├── README.md
            ├── acute_stress_MT.yaml
            ├── adhd_JM.yaml
            ├── adjustment_HS.yaml
            ├── alcohol_use_HS.yaml
            ├── alzheimer_TH.yaml
            ├── anorexia_MT.yaml
            ├── antisocial_pd_DT.yaml
            ├── anxiety_SY.yaml
            ├── autism_HS.yaml
            ├── avoidant_pd_HM.yaml
            ├── binge_eating_HK.yaml
            ├── bipolar_MO.yaml
            ├── bipolar_NA.yaml
            ├── body_dysmorphic_MS.yaml
            ├── borderline_pd_JK.yaml
            ├── bulimia_SN.yaml
            ├── delusional_disorder_AH.yaml
            ├── depersonalization_BQ.yaml
            ├── depression_YT.yaml
            ├── dissociative_identity_AZ.yaml
            ├── gambling_NM.yaml
            ├── hoarding_AT.yaml
            ├── illness_anxiety_HK.yaml
            ├── ocd_YK.yaml
            ├── opioid_use_MT.yaml
            ├── panic_TK.yaml
            ├── persistent_depression_MA.yaml
            ├── ptsd_KW.yaml
            ├── schizophrenia_MT.yaml
            ├── social_anxiety_NH.yaml
            ├── somatic_symptom_MS.yaml
            └── specific_phobia_AK.yaml
```

### 📋 予定・開発中

```
prompting/                         # プロンプト主導型（開発中）
├── examples/
│   └── example_conversation.md    # 会話例 🚧
│  
# programming/ ディレクトリは将来追加予定
```

## ペルソナ編集ツールの起動

`tools/editor` ディレクトリにはブラウザベースのペルソナ編集ツールが含まれています。
このツールは `fetch` を利用してファイルを読み込むため、`file://` で `index.html` を直接開くと読み込みに失敗します。
以下のようにローカル HTTP サーバー経由でアクセスしてください。

### 起動手順

```bash
# リポジトリのルートから
cd tools/editor

# Python 3 を使用する場合
python3 -m http.server 8000

# または Node.js を使用する場合
npx http-server -p 8000
```

その後、ブラウザで [http://localhost:8000](http://localhost:8000) を開きます。

## LLMチャットアプリの起動

`tools/chat-app` には OpenAI API を利用したシンプルなチャットアプリが含まれています。
ペルソナや疾患ファイルを読み込み、内部状態の表示を切り替えながら LLM と対話できます。

### 起動手順

```bash
# リポジトリのルートから
cd tools/chat-app
python3 -m http.server 8000
```

ブラウザで [http://localhost:8000](http://localhost:8000) を開き、API キーやペルソナファイルを設定して使用します。

## 変更履歴

### バージョン 2025.3 v1.0.0
- 感情システム（Emotion System）の追加
- 記憶システム（Memory System）の追加
- 関連性ネットワーク（Association System）の追加
- 認知能力システム（Cognitive System）の追加
- 対話実行指示フレームワークの導入
- 動的人格変容システムの導入
- レガシーシステムとの互換性の維持

## ライセンス

UPPSは個人、研究、学術、教育用途での使用が無償で許可されています。商用利用には別途ライセンスが必要です。詳細は[LICENSE](./LICENSE.md)ファイルを参照してください。

## 連絡先

- **公式サイト**: [https://upps-consortium.org](https://upps-consortium.org)
- **リポジトリ**: [https://github.com/upps-consortium/upps](https://github.com/upps-consortium/upps)
- **問い合わせ**: contact@upps-consortium.org

## 引用方法

UPPS規格を参照または利用する場合は、以下の形式での引用をお願いします：

```
UPPS Consortium. (2025). Unified Personality Profile Standard (Version 2025.3 v1.0.0) [Data standard].
https://github.com/upps-consortium/upps
```

---

© 2025 UPPS Consortium. All Rights Reserved.
