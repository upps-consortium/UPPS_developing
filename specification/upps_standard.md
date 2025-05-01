# Unified Personality Profile Standard (UPPS) 規格仕様書 改訂版2025

> *「人格モデルの標準化を通じてAIと人間の対話に一貫性と深みをもたらす」*

## 目次

1. [はじめに](#1-はじめに)
2. [適用範囲](#2-適用範囲)
3. [用語の定義](#3-用語の定義)
4. [基本構成](#4-基本構成)
5. [各項目の定義](#5-各項目の定義)
6. [記法ルール](#6-記法ルール)
7. [サンプル構造](#7-サンプル構造)
8. [バージョン管理方針](#8-バージョン管理方針)
9. [実装上の注意事項](#9-実装上の注意事項)
10. [付録: 検証方法](#10-付録-検証方法)

## 1. はじめに

Unified Personality Profile Standard (UPPS) は、対話型AIや架空クライアントにおいて人格モデルを記述・共有・運用するための標準フォーマットです。

本規格の特徴:
- 人格の静的側面（性格特性や背景情報）を構造化
- 動的に変動する内部状態（State）の定義と管理
- セッション単位の文脈情報（Session_Context）のサポート
- 感情記憶（Memory_Trace）と想起トリガーのモデリング

これらの機能により、より自然で臨場感ある対話を実現します。

## 2. 適用範囲

UPPSは以下の領域での活用を想定しています:

- **心理支援**: カウンセリングや心理療法のシミュレーション
- **医療**: 医療面接や診断練習用の仮想患者
- **教育**: 教育・研修シナリオにおける仮想対話者
- **AI対話設計**: チャットボットや対話システムの人格設定
- **創作**: 物語やゲームにおけるキャラクター設計

## 3. 用語の定義

| 用語 | 定義 |
|------|------|
| **Session_Context** | 対話セッション単位で設定される背景情報。例: 精神科外来での不眠相談など |
| **State** | 対話中に変動する気分や感情傾向の内部状態。性格特性（BigFive）とは独立して管理される |
| **Memory_Trace** | 感情を伴う記憶（感情記憶）と、それを呼び起こすトリガー（匂い、音、場面描写など）のセット |
| **Personality Traits** | BigFive理論に基づく性格特性（開放性、誠実性、外向性、協調性、神経症的傾向） |
| **Cognitive_Profile** | 知的能力や認知特性に関する情報（検査結果や特徴的な思考パターンなど） |

## 4. 基本構成

UPPSは以下のYAML構成要素から成ります:

- **personal_info** (必須): 基本的な個人情報
- **background** (必須): 生育歴・背景情報
- **personality** (必須): 性格特性
- **values**: 重視する価値観
- **likes / dislikes**: 好き嫌い
- **challenges**: 抱える課題
- **goals**: 目指す目標
- **communication_style**: 話し方、態度
- **cognitive_profile**: 知的能力、発達特性
- **memory_trace**: 感情記憶とトリガー
- **session_context**: セッション背景設定
- **state**: 現在の感情傾向

## 5. 各項目の定義

| 項目 | 定義 | データ型 | 入力形式 | 必須 |
|------|------|----------|----------|------|
| **personal_info** | 氏名、年齢、性別、職業、文化背景 | Structured | key-value記述 | ✅ |
| **background** | 成育歴、生活背景の自由記述 | Text | 長文記述 | ✅ |
| **personality** | BigFive理論による性格特性スコア | Numeric | 0.0〜1.0の小数 | ✅ |
| **values** | 重視する価値観 | List | キーワード列挙 | - |
| **likes / dislikes** | 好き嫌い | List | キーワード列挙 | - |
| **challenges** | 抱える課題 | List | キーワードまたは短文 | - |
| **goals** | 目指す目標 | List | キーワードまたは短文 | - |
| **communication_style** | 話し方、態度 | Text | 一文記述 | - |
| **cognitive_profile** | 知的能力、発達特性 | Structured | 検査データ＋自由記述 | - |
| **memory_trace** | 感情記憶とトリガー | Structured | 複数エントリ形式 | - |
| **session_context** | セッション背景設定 | Structured | setting, purpose, background | - |
| **state** | 現在の感情傾向 | Structured | 感情名と数値（%）リスト | - |

### 5.1 項目詳細

#### 5.1.1 personal_info
基本的な個人情報を記述します。以下のフィールドを含みます:
- **name** (必須): 氏名
- **age**: 年齢（0〜150の整数値）
- **gender**: 性別
- **occupation**: 職業
- **cultural_background**: 文化的背景

#### 5.1.2 personality
性格特性モデルとその特性値を定義します:
- **model** (デフォルト: "BigFive"): 使用する性格特性モデル
  - 選択肢: "BigFive", "HEXACO", "Custom"
- **traits**: BigFive特性（すべて必須）
  - **openness**: 開放性 - 新しい経験や概念への受容性（0.0〜1.0）
  - **conscientiousness**: 誠実性 - 計画性や責任感（0.0〜1.0）
  - **extraversion**: 外向性 - 社交性やエネルギーの外向的発散（0.0〜1.0）
  - **agreeableness**: 協調性 - 他者への思いやりや協力（0.0〜1.0）
  - **neuroticism**: 神経症的傾向 - 感情の不安定さやストレス反応（0.0〜1.0）

#### 5.1.3 memory_trace
感情記憶とそれを想起させるトリガーを定義します:
- **memories**: 記憶のリスト
  - **period**: いつの記憶か（時期）
  - **event**: 何があったか（出来事）
  - **emotions**: どう感じたか（感情のリスト、最低1つ以上必要）
  - **triggers**: 何によって思い出すか（想起トリガー、最低1つ以上必要）

#### 5.1.4 cognitive_profile
知的能力や認知特性に関する情報を定義します:
- **test_results**: 検査結果のリスト
  - **test_name** (必須): 検査名
  - **scores** (必須): 検査スコア（キーと数値のマップ）
  - **description**: 検査結果の説明
- **narrative**: 認知特性の総合的な説明

#### 5.1.5 session_context
対話セッションの背景設定を定義します。すべての要素が必須です:
- **setting**: 場所や状況（例: 精神科外来）
- **purpose**: 対話の目的（例: 不眠相談）
- **background**: 背景情報（例: 症状の悪化）

#### 5.1.6 state
対話中の感情状態を名前と強度（0-100の整数）で定義します。最低1つ以上の状態値が必要です:
- 例: calm: 60, anxious: 30, tired: 10

## 6. 記法ルール

YAMLフォーマットの記述において、以下のルールを遵守してください:

- フィールド名はスネークケース（例: `personal_info`）
- 文字列はダブルクォート囲み（例: `"Jane Doe"`）
- リストはハイフン（-）で列挙
- インデントはスペース2つ
- 数値は以下の形式で表記:
  - 性格特性: 0.0〜1.0の小数
  - 感情状態: 0〜100の整数
  - 年齢: 0〜150の整数

## 7. サンプル構造

```yaml
personal_info:
  name: "Jane Doe"
  age: 29
  gender: "Female"
  occupation: "Researcher"

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

values:
  - "Curiosity"
  - "Integrity"

likes:
  - "Books"
  - "Nature walks"

dislikes:
  - "Dishonesty"
  - "Noise"

challenges:
  - "Public speaking anxiety"

goals:
  - "Publish first research paper"

communication_style: "Thoughtful and soft-spoken"

cognitive_profile:
  test_results:
    - test_name: "WAIS-IV"
      scores:
        Full_Scale_IQ: 125
        Verbal_Comprehension_Index: 130
        Perceptual_Reasoning_Index: 120
      description: "言語理解が非常に高い。処理速度は平均程度。"
  narrative: "分析的で粘り強く問題解決に取り組む傾向がある。"

memory_trace:
  memories:
    - period: "Childhood (8 years old)"
      event: "First science fair participation"
      emotions: ["Excitement", "Pride"]
      triggers: ["Smell of fresh paint", "School auditorium sounds"]
    - period: "University Graduation"
      event: "Receiving diploma on stage"
      emotions: ["Happiness"]
      triggers: ["Sound of applause"]

session_context:
  setting: "Psychiatric outpatient clinic"
  purpose: "Consultation for worsening insomnia"
  background: "Symptoms intensified over the past week."

state:
  calm: 60
  anxious: 30
  tired: 10
```

## 8. バージョン管理方針

### 8.1 バージョニング規則

UPPSはセマンティックバージョニング（SemVer）に従います:
- **メジャーバージョン**: 下位互換性のない変更（例: 必須フィールドの追加）
- **マイナーバージョン**: 下位互換性のある機能追加
- **パッチバージョン**: 下位互換性のあるバグ修正

### 8.2 バージョン表記

バージョンは「UPPS YYYY vX.Y.Z」の形式で表記します:
- YYYY: 年号
- X: メジャーバージョン
- Y: マイナーバージョン
- Z: パッチバージョン

例: 「UPPS 2025 v1.0.0」

### 8.3 下位互換性

バージョンアップ時には原則として下位互換性を保持します。ただし、メジャーバージョンアップの際には互換性を損なう変更が含まれる可能性があります。

## 9. 実装上の注意事項

### 9.1 感情状態の管理

- State変数は0〜100の範囲で管理
- 複数の感情が同時に存在可能
- 合計が100%になる必要はない
- 典型的な感情カテゴリの例:
  - 基本感情: happy, sad, angry, fearful, disgusted, surprised
  - 社会的感情: proud, ashamed, guilty, jealous
  - エネルギー状態: calm, excited, tired, alert

### 9.2 フィールドの追加と拡張

- personal_infoセクションのみadditionalPropertiesが許可されている
- モデル固有の拡張を行う場合は、拡張フィールド名の先頭に「x_」を付けることを推奨

### 9.3 エンジニアリング検討事項

- 大規模データセットにおける処理効率
- プライバシーとセキュリティの配慮
- 複数言語対応（Unicode対応必須）
- エッジケースの考慮（極端な値、欠損値など）

## 10. 付録: 検証方法

UPPSプロファイルの検証には以下の方法が推奨されます:

### 10.1 構文検証

YAMLの構文エラーを検出します:
```bash
# PyYAMLを使用した検証例
python -c "import yaml; yaml.safe_load(open('profile.yaml'))"
```

### 10.2 スキーマ検証

UPPSスキーマに準拠しているか検証します:
```python
# Python + pykwalifyを使用した検証例
from pykwalify.core import Core
c = Core(source_file="profile.yaml", schema_file="upps_schema.yaml")
c.validate(raise_exception=True)
```

### 10.3 値の妥当性検証

数値範囲や必須フィールドを検証します:
```python
# 簡易検証スクリプトの例
def validate_upps(profile):
    # 必須フィールドの確認
    if 'personal_info' not in profile:
        return False, "personal_info missing"
    
    if 'name' not in profile.get('personal_info', {}):
        return False, "personal_info.name missing"
    
    # 性格特性の値範囲確認
    traits = profile.get('personality', {}).get('traits', {})
    for trait, value in traits.items():
        if not 0.0 <= value <= 1.0:
            return False, f"Invalid trait value for {trait}: {value}"
    
    # 状態値の範囲確認
    state = profile.get('state', {})
    for emotion, value in state.items():
        if not 0 <= value <= 100:
            return False, f"Invalid state value for {emotion}: {value}"
    
    return True, "Valid"
```

---

© UPPS Consortium 2025  
UPPSは個人・研究・教育目的での利用が無償で許可されています。商用利用には別途ライセンスが必要です。
