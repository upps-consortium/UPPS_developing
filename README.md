# UPPS - Unified Personality Profile Standard 改訂版2025.2

[![License: Custom](https://img.shields.io/badge/License-UPPS_Custom-blue.svg)](./LICENSE.md)
[![Version: 2025.2 v1.2.0](https://img.shields.io/badge/Version-2025.2_v1.2.0-brightgreen.svg)](https://github.com/upps-consortium/upps)
[![Documentation Status](https://img.shields.io/badge/docs-latest-informational)](https://github.com/upps-consortium/upps/wiki)

> 「人格モデルの標準化とペルソナ表現を通じてAIと人間の対話に一貫性と深みをもたらす」

## 概要

UPPS（Unified Personality Profile Standard）は、対話型AIや架空クライアントにおいて人格モデルを「ペルソナ」として記述・共有・運用するための標準フォーマットです。人格の静的側面（性格特性や背景情報）に加え、動的に変動する内部状態（State）、およびセッション単位の文脈情報（Session_Context）を扱い、より自然で臨場感ある対話を実現します。

UPPSでは、UPPS標準に基づく人格データセットを「UPPSペルソナ」と呼びます。一般的なプロファイル（構成情報）という用語とは区別します。

**改訂版2025.2**では、新たに感情システム（Emotion System）、記憶システム（Memory System）、関連性ネットワーク（Association System）、認知能力システム（Cognitive System）を含む拡張モデルを導入しました。これにより、より自然で深みのある人格表現が可能になっています。

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

## アプローチ

### 🚀 プロンプト主導型アプローチ（優先開発）

プロンプトエンジニアリングを活用して、プログラミングなしでUPPSペルソナを大規模言語モデル（LLM）に適用する方法です。現在以下のドキュメントが利用可能です：

#### ✅ 利用可能なドキュメント

- [基本テンプレート](./prompting/templates/basic_template.md): 基本的なUPPSペルソナプロンプトテンプレート
- [状態管理テンプレート](./prompting/templates/state_update.md): 感情状態の更新を含むテンプレート  
- [記憶トリガーテンプレート](./prompting/templates/memory_trigger.md): 記憶想起機能を含むテンプレート
- [サンプルペルソナ - レイチェル](./examples/profiles/rachel_bladerunner.md): ブレードランナーのキャラクター例

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

あなたはUPPS（Unified Personality Profile Standard）改訂版2025.2に基づいた対話を行います。

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
2. 各応答の最後に、現在の感情状態を【状態】セクションとして追加してください

---

こんにちは、調子はどうですか？
````

## ドキュメント構成

### ✅ 現在利用可能

```
upps/
├── LICENSE.md                     # ライセンス情報  
├── README.md                      # このファイル  
│  
├── specification/                 # 規格仕様 ✅  
│   ├── upps_standard.md           # 規格定義書  
│   ├── operational_guidelines.md  # 運用指針    
│   └── schema/                    # スキーマ定義  
│       └── upps_schema.yaml         
│  
├── prompting/                     # プロンプト主導型 ✅  
│   ├── README.md                     # プロンプトフォルダ内の案内
│   ├── prompt_guide.md               # プロンプト実施ガイド（詳細）
│   ├── templates/
│   │   ├── basic_template.md         # 基本テンプレート
│   │   └── upps_template.md          # 標準テンプレート（2025.2対応）
│   └── providers/
│       ├── openai_gpt.md             # OpenAI GPT用テンプレート
│       ├── anthropic_claude.md       # Anthropic Claude用テンプレート
│       ├── google_gemini.md          # Google Gemini用テンプレート
│       └── meta_llama.md             # Meta Llama用テンプレート
│
└── tools/
│   └──upps_editor/                # ペルソナ編集ツール
│
└──　persona_lib/                  # ペルソナファイルライブラリ                
│       └── rachel_bladerunner.md  　　# サンプルペルソナ  
```

### 📋 予定・開発中

```
prompting/                         # プロンプト主導型（開発中）  
├── examples/                       
│   ├── conversation_example.md    # 会話例 🚧  
│   └── session_management.md      # セッション管理例 🚧  
│  
programming/                       # プログラム主導型（将来予定）  
├── implementation_guide.md        # 実装ガイド 📋  
├── api_reference.md               # APIリファレンス 📋  
└── examples/                      # プログラム例 📋  
    ├── basic_chatbot.py            
    ├── state_visualization.py      
    └── web_interface/  
```

## 変更履歴

### バージョン 2025.2 v1.2.0
- 感情システム（Emotion System）の追加
- 記憶システム（Memory System）の追加
- 関連性ネットワーク（Association System）の追加
- 認知能力システム（Cognitive System）の追加
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
UPPS Consortium. (2025). Unified Personality Profile Standard (Version 2025.2 v1.2.0) [Data standard].
https://github.com/upps-consortium/upps
```

---

© 2025 UPPS Consortium. All Rights Reserved.
