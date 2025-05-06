# UPPS拡張提案: 感情・記憶システムの統合モデル

## 概要

本文書はUnified Personality Profile Standard (UPPS)における感情モデルと記憶モデルの拡張および両者の相互作用の体系化に関する提案です。性格特性に加え、感情状態と記憶の表現を標準化し、それらの相互関連を定量的に記述できる枠組みを提供します。また、認知能力モデルの改良も含まれています。

## 目次

1. [背景と目的](#1-背景と目的)
2. [感情システム](#2-感情システム)
3. [記憶システム](#3-記憶システム)
4. [関連性ネットワーク](#4-関連性ネットワーク)
5. [認知能力システム](#5-認知能力システム)
6. [実装ガイドライン](#6-実装ガイドライン)
7. [スキーマ例](#7-スキーマ例)

## 1. 背景と目的

UPPSは人格プロファイルを標準化するフレームワークとして、性格特性（Big Fiveモデルなど）を基盤としていますが、より豊かな人格表現には感情状態と記憶の適切なモデル化および両者の相互作用の記述が不可欠です。本提案は以下を目的としています：

- 感情モデルの統一的な表現方法の確立
- 記憶タイプの区別と構造化
- 感情と記憶の相互作用の関連性ネットワークによる記述
- 認知能力の標準化されたモデリング
- プロファイルデータ（何を）と実装ロジック（どのように）の明確な分離

## 2. 感情システム

感情システムは、人格の動的な状態を表現する感情のセットと各感情の基本特性を定義します。

### 2.1 基本構造

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

### 2.2 感情モデル

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

### 2.3 感情の特性

各感情には以下の特性を定義できます：

- **baseline**: 基本値（0-100）- 通常状態での感情強度
- **description**: 説明（オプション）- 感情の意味や表れ方

## 3. 記憶システム

記憶システムは、人格を構成する様々なタイプの記憶を構造化して表現します。

### 3.1 基本構造

```yaml
memory_system:
  memories:
    - id: "childhood_move"
      type: "episodic"
      content: "子供の頃に引っ越しをして友達と別れた経験"
      
    - id: "college_graduation"
      type: "episodic"
      content: "大学卒業式での達成感と誇り"
    
    - id: "physics_knowledge"
      type: "semantic"
      content: "物理学の基本原理と公式に関する知識"
    
    # その他の記憶...
```

### 3.2 記憶タイプ

記憶は以下の主要タイプに分類されます：

1. **episodic** - エピソード記憶（個人的な経験や出来事）
2. **semantic** - 意味記憶（事実や概念に関する知識）
3. **procedural** - 手続き記憶（スキルやノウハウ）
4. **autobiographical** - 自伝的記憶（自己に関する統合的な記憶）

### 3.3 記憶の属性

各記憶には以下の属性を定義できます：

- **id**: 一意の識別子
- **type**: 記憶タイプ
- **content**: 記憶の内容
- **period**: いつの記憶か（オプション）
- **context**: 記憶の文脈情報（オプション）

## 4. 関連性ネットワーク

関連性ネットワークは、感情と記憶の相互作用を統一的な形式で記述するためのシステムです。

### 4.1 基本構造

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

### 4.2 関連性のタイプ

関連性ネットワークは以下のタイプの関連を表現できます：

1. **記憶→感情**: 特定の記憶が特定の感情を呼び起こす
2. **感情→記憶**: 特定の感情状態が特定の記憶を想起させる
3. **記憶→記憶**: ある記憶が別の記憶を連想させる（記憶の連鎖）
4. **外部トリガー→記憶/感情**: 外部刺激や話題が記憶や感情を呼び起こす
5. **複合条件→反応**: 複数の条件（感情、記憶、外部トリガー）の組み合わせが特定の反応を引き起こす

### 4.3 関連性の属性

各関連性には以下の属性を定義できます：

- **trigger**: 起点となる要素（単一条件または複数条件）
- **response**: 反応として生じる要素（記憶、感情など）
- **association_strength**: 関連の強さ（0-100）
- **threshold**: トリガーの閾値（オプション）- この値を超えると反応が生じる

### 4.4 複数トリガーの設計

複数のトリガーを組み合わせる場合は、以下の制約を適用します：

1. **ネストレベルの制限**: 最大2レベルまでのネスト（条件の入れ子）を許可
2. **トリガー数の制限**: 1つの条件グループ内で最大5つのトリガーを許可
3. **演算子**: AND（すべての条件を満たす）とOR（いずれかの条件を満たす）をサポート

## 5. 認知能力システム

認知能力システムは、人格の知的・認知的側面を表現するためのフレームワークです。WAIS-IVの構造に基づきながらも、シンプルで直感的な形式で能力を表現します。

### 5.1 基本構造

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

### 5.2 能力の表現

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

### 5.3 尺度

各能力は0-100のスケールで表現されます：

- **0-20**: 極めて低い
- **21-40**: 低い
- **41-60**: 平均的
- **61-80**: 高い
- **81-100**: 極めて高い

### 5.4 実装への示唆

認知能力の違いは、以下のような形で対話や行動に反映させることができます：

- **言語理解の高い人格**: 豊かな語彙、複雑な概念の正確な理解と表現、抽象的な議論の構築
- **知覚推理の高い人格**: 視覚的情報の詳細な描写、空間関係の正確な把握、パターン認識の高さ
- **ワーキングメモリの高い人格**: 長い会話の流れを正確に追跡、複数の話題の同時処理
- **処理速度の高い人格**: 迅速な応答、効率的な情報処理と整理

## 6. 実装ガイドライン

UPPSプロファイルの実装において、以下のガイドラインを推奨します：

### 6.1 分離原則

UPPSプロファイルは「何が」相互作用するかを記述し、プロンプトやプログラムは「どのように」それを処理するかを担当するという明確な役割分担を維持します。

### 6.2 関連度の反映

関連性ネットワークで定義された`association_strength`は、実装時に以下のように反映できます：

- 高い関連度（70-100）: 強く、明確に反応する
- 中程度の関連度（40-69）: 適度に反応する
- 低い関連度（0-39）: 弱く、時に反応しない場合もある

### 6.3 複数トリガーの評価

複数トリガーを含む条件は以下のように評価します：

- **AND条件**: すべての条件が満たされた場合のみ反応を生成
- **OR条件**: いずれかの条件が満たされた場合に反応を生成
- **閾値の考慮**: 感情トリガーの場合、指定された閾値以上の感情強度がある場合にのみ条件を満たす
- **部分的なマッチング**: 外部トリガーの`items`リストでは、少なくとも1つの項目がマッチした場合に条件を満たす

### 6.4 認知能力の表現

認知能力の実装においては、以下の点を考慮します：

- 言語理解レベルに応じた語彙の複雑さと表現の洗練度の調整
- ワーキングメモリに応じた会話の流れの把握と情報の保持
- 処理速度に応じた反応時間や情報処理の効率性の表現
- 能力のレベルが対話の質に影響するが、完全に能力を欠如させるのではなく、「癖」や「傾向」として表現

### 6.5 実装の独立性

異なるUPPSプロファイルを同じプロンプトテンプレートやプログラムで処理できるようにし、プロファイルの交換のみで異なる人格表現を実現します。

## 7. スキーマ例

以下に、感情システム、記憶システム、関連性ネットワーク、認知能力システムを含む完全なUPPSプロファイルの例を示します：

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
    
    - id: "research_failure"
      type: "episodic"
      content: "重要な実験が失敗し、研究チームに迷惑をかけた経験"
      period: "Early Career (Age 27)"

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
    
    # 感情→記憶
    - trigger:
        type: "emotion"
        id: "curiosity"
        threshold: 70
      response:
        type: "memory"
        id: "childhood_nature"
        association_strength: 85
    
    - trigger:
        type: "emotion"
        id: "sadness"
        threshold: 60
      response:
        type: "memory"
        id: "city_relocation"
        association_strength: 70
    
    # 記憶→記憶
    - trigger:
        type: "memory"
        id: "childhood_nature"
      response:
        type: "memory"
        id: "biology_knowledge"
        association_strength: 65
    
    # 外部トリガー→記憶/感情
    - trigger:
        type: "external"
        category: "topics"
        items: ["nature", "forest", "insects"]
      response:
        type: "memory"
        id: "childhood_nature"
        association_strength: 90
    
    - trigger:
        type: "external"
        category: "environment"
        items: ["laboratory", "research papers", "conferences"]
      response:
        type: "memory"
        id: "first_research"
        association_strength: 85
        
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
        id: "research_failure"
        association_strength: 80
    
    # 複数条件（OR）の例
    - trigger:
        operator: "OR"
        conditions:
          - type: "external"
            category: "topics"
            items: ["failure", "mistake", "error"]
          - type: "emotion"
            id: "sadness"
            threshold: 75
      response:
        type: "memory"
        id: "research_failure"
        association_strength: 75
```

## まとめ

本提案は、UPPSフレームワークにおける感情システム、記憶システム、認知能力システム、およびそれらの相互作用を記述するための関連性ネットワークの導入を提案しています。この拡張により、UPPSプロファイルは静的な性格特性だけでなく、動的な感情状態、記憶の相互作用、知的・認知的能力を含む、より豊かな人格表現が可能になります。

基本的なEkmanモデルとWAIS-IVモデルを基盤としながらも、異なるモデルをサポートする柔軟性を確保し、人格の様々な側面を統一的なフォーマットで記述できるようにしています。

この設計は、プロファイルデータ（何を）と実装ロジック（どのように）を明確に分離し、様々な実装方法やプラットフォームでの互換性を確保します。
