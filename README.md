# UPPS - Unified Personality Profile Standard

[![License: Custom](https://img.shields.io/badge/License-UPPS_Custom-blue.svg)](./LICENSE)
[![Version: 2025 v1.0.0](https://img.shields.io/badge/Version-2025_v1.0.0-brightgreen.svg)](https://github.com/upps-consortium/upps)

> 「人格モデルの標準化を通じてAIと人間の対話に一貫性と深みをもたらす」

## 概要

UPPS（Unified Personality Profile Standard）は、対話型AIや架空クライアントにおいて人格モデルを記述・共有・運用するための標準フォーマットです。人格の静的側面（性格特性や背景情報）に加え、動的に変動する内部状態（State）、およびセッション単位の文脈情報（Session_Context）を扱い、より自然で臨場感ある対話を実現します。

## 特徴

- **標準化されたYAML形式**: 一貫した形式で人格情報を記述
- **BigFiveモデル準拠**: 性格特性を科学的に裏付けられた枠組みで表現
- **動的状態管理**: 対話中の感情状態を動的に管理
- **感情記憶システム**: 感情記憶と想起トリガーのモデリング
- **セッション文脈**: 対話の背景や目的を明示的に設定
- **マルチドメイン**: 心理、医療、教育、AIなど様々な分野に適用可能

## 用途

- **心理支援**: カウンセリングや心理療法のシミュレーション
- **医療教育**: 医療面接や診断練習用の仮想患者
- **教育訓練**: 教育・研修シナリオにおける仮想対話者
- **AI対話設計**: チャットボットや対話システムの人格設定
- **物語創作**: 物語やゲームにおけるキャラクター設計

## はじめかた

現在、本リポジトリはUPPS規格の仕様と基本ドキュメントを提供しています。
実装やライブラリについては今後順次追加される予定です。

### クイックスタート

UPPSプロファイルの基本的な構造は以下のようになります：

```yaml
personal_info:
  name: "Jane Doe"
  age: 29
  gender: "Female"

background: |
  幼少期は自然豊かな地域で育ち、読書と科学に没頭していた。
  現在は都市部で研究職に従事している。

personality:
  model: "BigFive"
  traits:
    openness: 0.8
    conscientiousness: 0.7
    extraversion: 0.4
    agreeableness: 0.9
    neuroticism: 0.3

state:
  calm: 70
  curious: 60
  anxious: 20
```

## ドキュメント

詳細なドキュメントは以下のセクションを参照してください：

- [規格仕様書](./specification/upps_standard.md): UPPS規格の完全な仕様
- [プロンプトテンプレート](./prompting/templates/basic_template.md): 基本的なプロンプトテンプレート

## 構成要素

UPPSは以下の主要な構成要素から成ります：

1. **personal_info**: 基本的な個人情報
2. **background**: 成育歴・背景情報
3. **personality**: BigFiveモデルによる性格特性
4. **values**: 重視する価値観
5. **likes/dislikes**: 好き嫌い
6. **challenges**: 抱える課題
7. **goals**: 目指す目標
8. **communication_style**: 話し方、態度
9. **cognitive_profile**: 知的能力、発達特性
10. **memory_trace**: 感情記憶とトリガー
11. **session_context**: セッション背景設定
12. **state**: 現在の感情傾向

## アプローチ

UPPSは2つの主要なアプローチをサポートしています：

### 1. プロンプト主導型アプローチ

プロンプトエンジニアリングを活用して、プログラミングなしでUPPSプロファイルを大規模言語モデル（LLM）に適用する方法です。

```
# UPPS人格シミュレーション指示

あなたはUPPS（Unified Personality Profile Standard）に基づいた対話を行います。
以下のプロファイル情報に忠実に従って応答してください。

## プロファイル情報

```yaml
personal_info:
  name: "Jane Doe"
  age: 29
  # その他のプロファイル情報
```

## 指示

1. 上記のプロファイル情報に基づいた人格として応答してください
2. 各応答の最後に、現在の感情状態を【状態】セクションとして追加してください
```

### 2. プログラム主導型アプローチ

APIやライブラリを使用して、プログラム的にUPPSプロファイルをシステムと統合する方法です。

```python
# 将来的な実装イメージ
from upps import UPPSProfile, UPPSChatBot

# プロファイルの読み込み
profile = UPPSProfile("profile.yaml")

# チャットボットの初期化
bot = UPPSChatBot(profile)

# 対話
response = bot.chat("こんにちは、あなたについて教えてください。")
print(response)
```

## ライセンス

UPPSは個人、研究、学術、教育用途での使用が無償で許可されています。商用利用には別途ライセンスが必要です。詳細は[LICENSE](./LICENSE)ファイルを参照してください。

## プロジェクト構成

現在の構成：

```
upps/
├── LICENSE                        # ライセンス情報
├── README.md                      # 本ファイル
│
├── specification/                 # 規格仕様関連
│   ├── upps_standard.md           # 規格定義書
│   └── schema/                    # スキーマ定義
│       └── upps_schema.yaml       # YAML形式のスキーマ
│
└── prompting/                     # プロンプト主導型アプローチ関連
    └── templates/                 # プロンプトテンプレート
        └── basic_template.md      # 基本テンプレート
```

今後追加予定のコンテンツ：

```
upps/
├── prompting/                     # プロンプト主導型アプローチ関連
│   ├── direct_prompting_guide.md  # 直接プロンプト利用ガイド
│   ├── templates/                 # プロンプトテンプレート
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
│
└── examples/                      # 共通サンプル
    └── profiles/                  # サンプルプロファイル
```

## 貢献ガイドライン

現在、貢献ガイドラインは準備中です。プロジェクトへの貢献に関心のある方は、今後の更新をお待ちください。

## 連絡先

- **リポジトリ**: [https://github.com/upps-consortium/upps](https://github.com/upps-consortium/upps)

## 引用方法

UPPS規格を参照または利用する場合は、以下の形式での引用をお願いします：

```
UPPS Consortium. (2025). Unified Personality Profile Standard (Version 2025 v1.0.0) [Data standard].
https://github.com/upps-consortium/upps
```

---

© 2025 UPPS Consortium. All Rights Reserved.
