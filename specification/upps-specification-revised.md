# Unified Personality Profile Standard (UPPS) 規格仕様書 改訂版2025.2

> *「人格モデルの標準化を通じてAIと人間の対話に一貫性と深みをもたらす」*

## 目次

1. [はじめに](#1-はじめに)
2. [適用範囲](#2-適用範囲)
3. [用語の定義](#3-用語の定義)
4. [基本構成](#4-基本構成)
5. [各項目の定義](#5-各項目の定義)
6. [感情システム](#6-感情システム)
7. [記憶システム](#7-記憶システム)
8. [関連性ネットワーク](#8-関連性ネットワーク)
9. [認知能力システム](#9-認知能力システム)
10. [記法ルール](#10-記法ルール)
11. [サンプル構造](#11-サンプル構造)
12. [バージョン管理方針](#12-バージョン管理方針)
13. [実装上の注意事項](#13-実装上の注意事項)
14. [付録: 検証方法](#14-付録-検証方法)

## 1. はじめに

Unified Personality Profile Standard (UPPS) は、対話型AIや架空クライアントにおいて人格モデルを記述・共有・運用するための標準フォーマットです。

本規格の特徴:
- 人格の静的側面（性格特性や背景情報）を構造化
- 動的に変動する内部状態（State）の定義と管理
- セッション単位の文脈情報（Session_Context）のサポート
- 感情記憶（Memory_Trace）と想起トリガーのモデリング
- **[新規]** 統合感情システム（Emotion_System）による感情状態の標準化
- **[新規]** 拡張記憶システム（Memory_System）による記憶タイプの区別と統合
- **[新規]** 関連性ネットワーク（Association_System）による感情と記憶の相互作用モデル
- **[新規]** 認知能力システム（Cognitive_System）によるWAIS-IVベースの能力表現

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
| **Memory_Trace** | 感情を伴うエピソード記憶と、それを呼び起こすトリガー（匂い、音、場面描写など）のセット |
| **Personality Traits** | BigFive理論に基づく性格特性（開放性、誠実性、外向性、協調性、神経症的傾向） |
| **Cognitive_Profile** | 知的能力や認知特性に関する情報（検査結果や特徴的な思考パターンなど） |
| **Emotion_System** | **[新規]** 感情モデルに基づく感情のセットと各感情の基本特性を定義するシステム |
| **Memory_System** | **[新規]** 記憶のタイプやカテゴリを区別して構造化する拡張記憶システム |
| **Association_System** | **[新規]** 感情と記憶の相互作用を統一的な形式で記述するためのシステム |
| **Cognitive_System** | **[新規]** WAIS-IVに基づく認知能力の標準的な表現システム |

## 4. 基本構成

UPPSは以下のYAML構成要素から成ります:

**基本要素 (必須):**
- **personal_info**: 基本的な個人情報
- **background**: 生育歴・背景情報
- **personality**: 性格特性

**標準要素:**
- **values**: 重視する価値観
- **likes / dislikes**: 好き嫌い
- **challenges**: 抱える課題
- **goals**: 目指す目標
- **communication_style**: 話し方、態度
- **cognitive_profile**: 知的能力、発達特性 (レガシー形式)
- **memory_trace**: 感情記憶とトリガー (レガシー形式)
- **session_context**: セッション背景設定
- **state**: 現在の感情傾向 (レガシー形式)

**拡張要素 (新規):**
- **emotion_system**: 感情モデルとベースライン値
- **memory_system**: 構造化された記憶システム
- **association_system**: 感情と記憶の関連性ネットワーク
- **cognitive_system**: WAIS-IVモデルに基づく認知能力

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
| **cognitive_profile** | 知的能力、発達特性 (レガシー) | Structured | 検査データ＋自由記述 | - |
| **memory_trace** | 感情記憶とトリガー (レガシー) | Structured | 複数エントリ形式 | - |
| **session_context** | セッション背景設定 | Structured | setting, purpose, background | - |
| **state** | 現在の感情傾向 (レガシー) | Structured | 感情名と数値（%）リスト | - |
| **emotion_system** | 感情モデルとベースライン値 (新規) | Structured | 感情モデルと各感情定義 | - |
| **memory_system** | 構造化された記憶システム (新規) | Structured | ID付き記憶の構造化リスト | - |
| **association_system** | 感情と記憶の関連性ネットワーク (新規) | Structured | トリガーと反応の関係定義 | - |
| **cognitive_system** | WAIS-IVモデルの認知能力 (新規) | Structured | 能力名と数値（0-100）リスト | - |

### 5.1 項目詳細

#### 5.1.1 personal_info
基本的な個人情報を記述します。以下のフィールドを含みます:
- **name** (必須): 氏名
- **age**: 年齢
- **gender**: 性別
- **occupation**: 職業
- **cultural_background**: 文化的背景

#### 5.1.2 personality
BigFive理論に基づく性格特性を0.0〜1.0の範囲で定義します:
- **openness**: 開放性 - 新しい経験や概念への受容性
- **conscientiousness**: 誠実性 - 計画性や責任感
- **extraversion**: 外向性 - 社交性やエネルギーの外向的発散
- **agreeableness**: 協調性 - 他者への思いやりや協力
- **neuroticism**: 神経症的傾向 - 感情の不安定さやストレス反応

#### 5.1.3 memory_trace (レガシー形式)
感情を伴う記憶とそれを想起させるトリガーを定義します:
- **period**: いつの記憶か（時期）
- **event**: 何があったか（出来事）
- **emotions**: どう感じたか（感情のリスト）
- **triggers**: 何によって思い出すか（想起トリガー）

#### 5.1.4 session_context
対話セッションの背景設定を定義します:
- **setting**: 場所や状況（例: 精神科外来）
- **purpose**: 対話の目的（例: 不眠相談）
- **background**: 背景情報（例: 症状の悪化）

#### 5.1.5 state (レガシー形式)
対話中の感情状態を名前と強度（0-100）で定義します:
- 例: calm: 60, anxious: 30, tired: 10

## 6. 感情システム

感情システム（emotion_system）は、人格の動的な状態を表現する感情のセットと各感情の基本特性を定義します。

### 6.1 基本構造

```yaml
emotion_system:
  model: "Ekman"  # 使用する感情モデル名
  emotions:
    joy:
      baseline: 50  # 基本値（0-100）
      description: "喜び、幸福感"  # 説明（オプション）
    sadness:
      baseline: 30
      description: "悲しみ、失望感"
    # その他の基本感情...
  
  # オプション: モデル固有の追加感情
  additional_emotions:
    nostalgia:
      baseline: 45
      description: "過去への郷愁"
    # その他の追加感情...
```

### 6.2 感情モデル

デフォルトでは**Ekmanの基本感情モデル**を採用し、以下の6つの基本感情を含みます：

1. **joy**（喜び）
2. **sadness**（悲しみ）
3. **anger**（怒り）
4. **fear**（恐れ）
5. **disgust**（嫌悪）
6. **surprise**（驚き）

別の感情モデルを使用する場合は、`model`フィールドに適切なモデル名を指定します。例えば：

- "Plutchik" - プルチックの感情の輪（8つの基本感情）
- "PAD" - Pleasure-Arousal-Dominance三次元モデル
- "OCC" - 認知評価に基づくOCC感情モデル

### 6.3 感情の特性

各感情には以下の特性を定義できます：

- **baseline**: 基本値（0-100）- 通常状態での感情強度
- **description**: 説明（オプション）- 感情の意味や表れ方

### 6.4 感情状態の現在値管理

現在の感情状態は、emotion_systemに定義された感情の中から、現在アクティブな感情を取り出して表現します。これはレガシーの`state`と同様の機能を提供しますが、emotion_systemで定義された感情に基づきます。

例：
```yaml
# 現在の感情状態（対話中に動的に変化）
current_emotion_state:
  joy: 70
  sadness: 20
  curiosity: 85
```

## 7. 記憶システム

記憶システム（memory_system）は、人格を構成する様々なタイプの記憶を構造化して表現します。

### 7.1 基本構造

```yaml
memory_system:
  memories:
    - id: "childhood_move"
      type: "episodic"
      content: "子供の頃に引っ越しをして友達と別れた経験"
      period: "Childhood (Age 8)"
      
    - id: "college_graduation"
      type: "episodic"
      content: "大学卒業式での達成感と誇り"
      period: "Early Adulthood (Age 22)"
    
    - id: "physics_knowledge"
      type: "semantic"
      content: "物理学の基本原理と公式に関する知識"
    
    # その他の記憶...
```

### 7.2 記憶タイプ

記憶は以下の主要タイプに分類されます：

1. **episodic** - エピソード記憶（個人的な経験や出来事）
2. **semantic** - 意味記憶（事実や概念に関する知識）
3. **procedural** - 手続き記憶（スキルやノウハウ）
4. **autobiographical** - 自伝的記憶（自己に関する統合的な記憶）

### 7.3 記憶の属性

各記憶には以下の属性を定義できます：

- **id**: 一意の識別子
- **type**: 記憶タイプ
- **content**: 記憶の内容
- **period**: いつの記憶か（オプション）
- **context**: 記憶の文脈情報（オプション）

## 8. 関連性ネットワーク

関連性ネットワーク（association_system）は、感情と記憶の相互作用を統一的な形式で記述するためのシステムです。

### 8.1 基本構造

```yaml
association_system:
  associations:
    # 単一トリガーの例
    - trigger:
        type: "memory"
        id: "childhood_move"
      response:
        type: "emotion"
        id: "sadness" 
        association_strength: 70
    
    - trigger:
        type: "emotion"
        id: "joy"
        threshold: 75
      response:
        type: "memory"
        id: "college_graduation"
        association_strength: 80
    
    # 複数トリガー（ANDの例）
    - trigger:
        operator: "AND"
        conditions:
          - type: "emotion"
            id: "sadness"
            threshold: 60
          - type: "emotion"
            id: "nostalgia" 
            threshold: 70
      response:
        type: "memory"
        id: "childhood_loss"
        association_strength: 85
    
    # 複数トリガー（ORの例）
    - trigger:
        operator: "OR"
        conditions:
          - type: "external"
            category: "topics"
            items: ["research", "science"]
          - type: "memory"
            id: "college_graduation"
      response:
        type: "emotion"
        id: "pride"
        association_strength: 75
```

### 8.2 関連性のタイプ

関連性ネットワークは以下のタイプの関連を表現できます：

1. **記憶→感情**: 特定の記憶が特定の感情を呼び起こす
2. **感情→記憶**: 特定の感情状態が特定の記憶を想起させる
3. **記憶→記憶**: ある記憶が別の記憶を連想させる（記憶の連鎖）
4. **外部トリガー→記憶/感情**: 外部刺激や話題が記憶や感情を呼び起こす
5. **複合条件→反応**: 複数の条件（感情、記憶、外部トリガー）の組み合わせが特定の反応を引き起こす

### 8.3 関連性の属性

各関連性には以下の属性を定義できます：

- **trigger**: 起点となる要素（単一条件または複数条件）
- **response**: 反応として生じる要素（記憶、感情など）
- **association_strength**: 関連の強さ（0-100）
- **threshold**: トリガーの閾値（オプション）- この値を超えると反応が生じる

### 8.4 複数トリガーの設計

複数のトリガーを組み合わせる場合は、以下の制約を適用します：

1. **ネストレベルの制限**: 最大2レベルまでのネスト（条件の入れ子）を許可
2. **トリガー数の制限**: 1つの条件グループ内で最大5つのトリガーを許可
3. **演算子**: AND（すべての条件を満たす）とOR（いずれかの条件を満たす）をサポート

## 9. 認知能力システム

認知能力システム（cognitive_system）は、人格の知的・認知的側面を表現するためのフレームワークです。WAIS-IVの構造に基づきながらも、シンプルで直感的な形式で能力を表現します。

### 9.1 基本構造

```yaml
cognitive_system:
  model: "WAIS-IV"  # 使用する能力モデル
  abilities:
    # 言語理解
    verbal_comprehension:
      level: 85  # 0-100のスケール
      description: "言語概念の理解、言語による思考と表現の能力"
      
    # 知覚推理
    perceptual_reasoning:
      level: 75
      description: "非言語的・視覚的情報の処理と推論能力"
      
    # ワーキングメモリ
    working_memory:
      level: 80
      description: "情報の一時的保持と操作能力"
      
    # 処理速度
    processing_speed:
      level: 70
      description: "単純な視覚情報の迅速な処理能力"
  
  # 全体的な認知能力レベル（オプション）
  general_ability:
    level: 78  # 4つの主要能力の加重平均など
    description: "全体的な認知能力"
```

### 9.2 能力の表現

認知能力システムでは、WAIS-IVの4つの主要指標に沿って能力を表現します：

1. **言語理解（Verbal Comprehension）**:
   - 言語的概念の理解と表現
   - 語彙の豊富さと適切な使用
   - 言語による論理的思考

2. **知覚推理（Perceptual Reasoning）**:
   - 視覚的情報の処理と分析
   - 空間的思考能力
   - 非言語的パターン認識

3. **ワーキングメモリ（Working Memory）**:
   - 情報の短期的保持能力
   - 会話や文脈の追跡能力
   - 複数の情報の同時処理能力

4. **処理速度（Processing Speed）**:
   - 情報処理の効率性と速度
   - 反応の迅速さ
   - 単純作業の遂行速度

### 9.3 尺度

各能力は0-100のスケールで表現されます：

- **0-20**: 極めて低い
- **21-40**: 低い
- **41-60**: 平均的
- **61-80**: 高い
- **81-100**: 極めて高い

## 10. 記法ルール

YAMLフォーマットの記述において、以下のルールを遵守してください:

- フィールド名はスネークケース（例: `personal_info`）
- 文字列はダブルクォート囲み（例: `"Jane Doe"`）
- リストはハイフン（-）で列挙
- インデントはスペース2つ
- 数値は以下の形式で表記:
  - 性格特性: 0.0〜1.0の小数
  - 感情状態: 0〜100の整数

## 11. サンプル構造

以下に、拡張モデルを含む完全なサンプルプロファイルを示します：

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

communication_style: "Thoughtful and soft-spoken"

# 感情システム
emotion_system:
  model: "Ekman"
  emotions:
    joy:
      baseline: 60
      description: "幸福感、満足感"
    sadness:
      baseline: 30
      description: "悲しみ、喪失感"
    anger:
      baseline: 25
      description: "怒り、いらだち"
    fear:
      baseline: 40
      description: "恐れ、不安"
    disgust:
      baseline: 20
      description: "嫌悪、不快感"
    surprise:
      baseline: 55
      description: "驚き、意外性への反応"
  
  additional_emotions:
    curiosity:
      baseline: 85
      description: "好奇心、知的探究心"
    nostalgia:
      baseline: 50
      description: "郷愁、懐かしさ"

# 記憶システム
memory_system:
  memories:
    - id: "childhood_nature"
      type: "episodic"
      content: "子供の頃に森で見つけた珍しい昆虫を観察した経験"
      period: "Childhood (Age 8)"
    
    - id: "first_research"
      type: "episodic"
      content: "初めて研究論文を発表したときの達成感と緊張"
      period: "Graduate School (Age 24)"
    
    - id: "biology_knowledge"
      type: "semantic"
      content: "生物学の基礎知識と生態系に関する専門知識"
    
    - id: "city_relocation"
      type: "episodic"
      content: "地方から都市部への引っ越しと環境の変化への適応"
      period: "Early Career (Age 26)"

# 認知能力システム
cognitive_system:
  model: "WAIS-IV"
  abilities:
    verbal_comprehension:
      level: 85
      description: "言語概念の理解、言語による思考と表現の能力"
    
    perceptual_reasoning:
      level: 75
      description: "非言語的・視覚的情報の処理と推論能力"
    
    working_memory:
      level: 80
      description: "情報の一時的保持と操作能力"
    
    processing_speed:
      level: 70
      description: "単純な視覚情報の迅速な処理能力"
  
  general_ability:
    level: 78
    description: "全体的な認知能力"

# 関連性ネットワーク
association_system:
  associations:
    # 記憶→感情
    - trigger:
        type: "memory"
        id: "childhood_nature"
      response:
        type: "emotion"
        id: "joy"
        association_strength: 80
    
    - trigger:
        type: "memory"
        id: "city_relocation"
      response:
        type: "emotion"
        id: "nostalgia"
        association_strength: 75
    
    # 外部トリガー→記憶
    - trigger:
        type: "external"
        category: "topics"
        items: ["nature", "forest", "insects"]
      response:
        type: "memory"
        id: "childhood_nature"
        association_strength: 90
    
    # 複数条件（AND）の例
    - trigger:
        operator: "AND"
        conditions:
          - type: "emotion"
            id: "fear"
            threshold: 60
          - type: "emotion"
            id: "sadness"
            threshold: 50
      response:
        type: "memory"
        id: "city_relocation"
        association_strength: 80

# 現在の感情状態（旧stateの代わり）
current_emotion_state:
  joy: 70
  curiosity: 90
  nostalgia: 40

# セッション文脈
session_context:
  setting: "Research laboratory"
  purpose: "Discussing research project"
  background: "First meeting with potential collaborator"
```

## 12. バージョン管理方針

### 12.1 バージョニング規則

UPPSはセマンティックバージョニング（SemVer）に従います:
- **メジャーバージョン**: 下位互換性のない変更（例: 必須フィールドの追加）
- **マイナーバージョン**: 下位互換性のある機能追加
- **パッチバージョン**: 下位互換性のあるバグ修正

### 12.2 バージョン表記

バージョンは「UPPS YYYY vX.Y.Z」の形式で表記します:
- YYYY: 年号
- X: メジャーバージョン
- Y: マイナーバージョン
- Z: パッチバージョン

例: 「UPPS 2025 v1.2.0」

### 12.3 下位互換性

バージョンアップ時には原則として下位互換性を保持します。感情・記憶システム拡張は既存の`state`や`memory_trace`と並行して使用可能です。

## 13. 実装上の注意事項

### 13.1 感情状態の管理

- 感情値は0〜100の範囲で管理
- 複数の感情が同時に存在可能
- 合計が100%になる必要はない
- 典型的な感情カテゴリ:
  - 基本感情: joy, sadness, anger, fear, disgust, surprise
  - 社会的感情: proud, ashamed, guilty, jealous
  - エネルギー状態: calm, excited, tired, alert

### 13.2 関連性ネットワークの実装

- 定義した関連性の優先順位付けが必要
- 複合条件は単一条件よりも評価コストが高い
- 過度に複雑な条件は避ける
- 関連強度（association_strength）に基づいて反応の強さを調整

### 13.3 認知能力の対話への反映

- 言語理解レベルに応じた語彙の複雑さと表現の洗練度
- ワーキングメモリに応じた会話の流れの把握と情報の保持
- 処理速度に応じた反応時間や情報処理の効率性
- 能力のレベルが対話の質に影響（完全な欠如ではなく「傾向」として表現）

### 13.4 エンジニアリング検討事項

- 大規模データセットにおける処理効率
- プライバシーとセキュリティの配慮
- 複数言語対応（Unicode対応必須）
- エッジケースの考慮（極端な値、欠損値など）
- レガシーシステムと拡張システムの併用における整合性の確保

## 14. 付録: 検証方法

UPPSプロファイルの検証には以下の方法が推奨されます:

### 14.1 構文検証

YAMLの構文エラーを検出します:
```bash
# PyYAMLを使用した検証例
python -c "import yaml; yaml.safe_load(open('profile.yaml'))"
```

### 14.2 スキーマ検証

UPPSスキーマに準拠しているか検証します:
```python
# Python + pykwalifyを使用した検証例
from pykwalify.core import Core
c = Core(source_file="profile.yaml", schema_file="upps_schema.yaml")
c.validate(raise_exception=True)
```

### 14.3 値の妥当性検証

数値範囲や必須フィールドを検証します:
```python
# 簡易検証スクリプトの例
def validate_upps(profile):
    # 必須フィールドの確認
    if 'personal_info' not in profile:
        return False, "personal_info missing"
    
    # 性格特性の値範囲確認
    traits = profile.get('personality', {}).get('traits', {})
    for trait, value in traits.items():
        if not 0.0 <= value <= 1.0:
            return False, f"Invalid trait value for {trait}: {value}"
    
    # 感情システムの検証
    if 'emotion_system' in profile:
        emotions = profile['emotion_system'].get('emotions', {})
        for emotion, data in emotions.items():
            baseline = data.get('baseline')
            if baseline is not None and not 0 <= baseline <= 100:
                return False, f"Invalid baseline for {emotion}: {baseline}"
    
    return True, "Valid"
```

### 14.4 関連性検証

関連性ネットワークの参照整合性を検証します:
```python
# 関連性の整合性検証例
def validate_associations(profile):
    # メモリIDのセット
    memory_ids = set()
    if 'memory_system' in profile:
        for memory in profile['memory_system'].get('memories', []):
            memory_ids.add(memory.get('id'))
    
    # 感情IDのセット
    emotion_ids = set()
    if 'emotion_system' in profile:
        emotion_ids.update(profile['emotion_system'].get('emotions', {}).keys())
        emotion_ids.update(profile['emotion_system'].get('additional_emotions', {}).keys())
    
    # 関連性の検証
    if 'association_system' in profile:
        for assoc in profile['association_system'].get('associations', []):
            # トリガー検証
            trigger = assoc.get('trigger', {})
            
            if trigger.get('type') == 'memory':
                if trigger.get('id') not in memory_ids:
                    return False, f"Invalid memory ID in trigger: {trigger.get('id')}"
            
            elif trigger.get('type') == 'emotion':
                if trigger.get('id') not in emotion_ids:
                    return False, f"Invalid emotion ID in trigger: {trigger.get('id')}"
            
            # レスポンス検証
            response = assoc.get('response', {})
            
            if response.get('type') == 'memory':
                if response.get('id') not in memory_ids:
                    return False, f"Invalid memory ID in response: {response.get('id')}"
            
            elif response.get('type') == 'emotion':
                if response.get('id') not in emotion_ids:
                    return False, f"Invalid emotion ID in response: {response.get('id')}"
    
    return True, "Valid associations"
```

---

© UPPS Consortium 2025  
UPPSは個人・研究・教育目的での利用が無償で許可されています。商用利用には別途ライセンスが必要です。