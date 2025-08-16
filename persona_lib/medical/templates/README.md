# UPPS症状表現テンプレート

> *医学的に妥当で自然な疾患症状の対話表現を実現するテンプレート集*

**対象**: UPPS 2025.3  
**最終更新**: 2025年7月3日

## 概要

このディレクトリには、UPPS 2025.3準拠の症状表現テンプレートが格納されています。各テンプレートは特定の疾患・重症度・症状パターンの組み合わせに対して、医学的に正確かつ自然な対話表現を可能にします。

## 使用方法

### 基本的な参照方法

```yaml
# 個人ペルソナファイルでの参照例
dialogue_instructions:
  template_ref: "alzheimer_moderate_typical_v1.0"
  customizations:
    additional_notes: "元教師なので教育話題で活発になる"
    specific_expressions:
      - "学習について語る時は表情が明るくなる"

# 架空患者情報の例
personal_info:
  name: "T.H."
  display_name: "T.H.さん（78歳女性）"
  disclaimer: "このペルソナは研究教育目的で作成された架空の患者です"
```

### 実行時の統合

症状表現テンプレートは個人ペルソナファイルと統合されてLLMに提供されます：

```
症状表現テンプレート + 個人ペルソナファイル → 統合プロンプト → LLM
```

### 架空患者について

**本ライブラリの全ての患者は架空であり、以下の方針に基づいています：**

- **イニシャル表記**: T.H.、Y.T.等のイニシャルのみ使用
- **架空明示**: 全て教育目的の仮想患者である旨を明記
- **実在者保護**: 実在の患者・個人との混同を避ける設計
- **プライバシー**: 個人特定可能な情報は一切含まない

## テンプレート一覧

### 認知症関連

#### アルツハイマー型認知症
- **alzheimer_mild_typical_v1.0.yaml**
  - 軽度・典型パターン（記憶障害中心）
  - 日常生活に軽微な影響
  
- **alzheimer_moderate_typical_v1.0.yaml**
  - 中等度・典型パターン（記憶障害中心）
  - 日常生活に明確な影響
  
  - **alzheimer_moderate_confabulation_v1.0.yaml**
    - 中等度・作話症状パターン
    - 誤った記憶を補う発言が目立つ

  - **alzheimer_moderate_anosognosia_v1.0.yaml**
    - 中等度・病識欠如パターン
    - 自身の障害を自覚しない
  
  - **alzheimer_severe_disorientation_v1.0.yaml**
    - 重度・見当識障害パターン
    - 日常生活に著しい混乱

### 気分障害関連

#### うつ病
  - **depression_mild_typical_v1.0.yaml**
    - 軽度・典型パターン
    - 気分の落ち込みが主体

  - **depression_mild_atypical_v1.0.yaml**
    - 軽度・非定型パターン
    - 気分反応性、過眠・過食傾向

  - **depression_moderate_melancholic_v1.0.yaml**
    - 中等度・メランコリー型
    - 朝の悪化、興味喪失が特徴

  - **depression_dysthymic_chronic_v1.0.yaml**
    - 慢性持続型抑うつ
    - 長期にわたる軽度抑うつ状態

#### 双極性障害
- **bipolar_manic_moderate_v1.0.yaml**
  - 躁エピソード・中等度
  - 気分高揚、多弁、活動性増加
  
- **bipolar_depressive_moderate_v1.0.yaml**
  - うつエピソード・中等度
  - 双極性障害のうつ状態

### 不安症関連

#### 全般性不安症
- **anxiety_mild_generalized_v1.0.yaml**
  - 軽度・全般性不安
  - 過度の心配、身体症状
  
- **anxiety_moderate_generalized_v1.0.yaml**
  - 中等度・全般性不安
  - 日常生活への影響が明確

#### パニック症
- **panic_disorder_moderate_v1.0.yaml**
  - 中等度・パニック症
  - パニック発作、予期不安

### 強迫症関連

#### 強迫症
- **ocd_moderate_typical_v1.0.yaml**
  - 中等度・典型パターン
  - 強迫観念と強迫行為が顕著

### 統合失調症関連

  - **schizophrenia_moderate_acute_v1.0.yaml**
    - 中等度・急性期パターン
    - 陽性症状が顕著

  - **schizophrenia_mild_negative_v1.0.yaml**
    - 軽度・陰性症状優位
    - 意欲低下、感情鈍麻が目立つ

### トラウマ関連

#### PTSD
- **ptsd_moderate_reexperiencing_v1.0.yaml**
  - 中等度・再体験症状優位
  - フラッシュバック、悪夢が顕著
  
- **ptsd_moderate_avoidance_v1.0.yaml**
  - 中等度・回避症状優位
  - 刺激回避、感情麻痺が顕著

### パーソナリティ障害関連

#### 境界性パーソナリティ障害
- **borderline_pd_moderate_typical_v1.0.yaml**
  - 中等度・典型パターン
  - 感情の不安定さ、対人関係の不安定さが特徴

#### 反社会性パーソナリティ障害
- **antisocial_pd_moderate_typical_v1.0.yaml**
  - 中等度・典型パターン
  - 他者権利の無視、罪悪感の欠如が特徴

#### 回避性パーソナリティ障害
- **avoidant_pd_moderate_typical_v1.0.yaml**
  - 中等度・典型パターン
  - 対人回避と劣等感が特徴

## 命名規則

テンプレートファイル名は以下の規則に従います：

```
{疾患名}_{重症度}_{症状パターン}_v{バージョン}.yaml
```

### 疾患名略称
- `alzheimer`: アルツハイマー型認知症
- `depression`: うつ病
- `bipolar`: 双極性障害
- `anxiety`: 不安症
- `panic`: パニック症
- `ocd`: 強迫症
- `schizophrenia`: 統合失調症
- `ptsd`: 外傷後ストレス障害

### 重症度
- `mild`: 軽度（日常生活に軽微な影響）
- `moderate`: 中等度（日常生活に明確な影響）
- `severe`: 重度（日常生活に著明な影響）

### 症状パターン
- `typical`: 典型的・最も一般的なパターン
- `executive`: 実行機能障害優位
- `language`: 言語障害優位
- `melancholic`: メランコリー型
- `atypical`: 非定型
- `positive`: 陽性症状優位
- `negative`: 陰性症状優位
- `reexperiencing`: 再体験症状優位
- `avoidance`: 回避症状優位

## テンプレート構造

各テンプレートは以下の構造を持ちます：

```yaml
# 1. テンプレート情報
template_info:
  id: "疾患_重症度_パターン_vバージョン"
  name: "疾患名（重症度・パターン）"
  description: "このテンプレートの特徴"
  # 診断情報・監修情報など

# 2. 症状定義
symptom_profile:
  active_symptoms:    # 現れる症状
    - name: "症状名"
      severity: "重症度"  # オプション
  absent_symptoms:    # 現れない症状

symptom_manifestations:
  症状名:
    definition: "医学的定義"
    expression: "対話での現れ方"
    examples: ["具体的発言例"]
    behaviors: ["非言語的行動"]

# 3. 特記事項（オプション）
additional_notes:
  symptom_variations: "症状の変動パターン"
  preserved_functions: "保たれる機能"
  implementation_tips: "実装上の注意点"

# 4. 実行指示
execution_instructions: |
  LLMへの具体的な実行指示
```

## 作成・監修プロセス

### 品質保証
- 可能な場合は該当分野の専門医による監修を実施
- 監修情報はtemplate_info内に記載
- 医学的妥当性の確保に努める

### 品質基準
- **医学的妥当性**: DSM-5-TR/ICD-11準拠
- **臨床的妥当性**: 実際の臨床現象に基づく
- **患者尊厳**: 偏見やスティグマを助長しない表現
- **教育効果**: 医学教育に適した内容

### 更新・改訂
- 医学的知見の更新に応じて適宜見直し
- 実装現場からのフィードバックを反映
- バージョン管理により変更履歴を追跡

## 利用上の注意

### 医学的制限
- このテンプレートは教育・研究目的のみに使用してください
- 実際の診断・治療には使用しないでください
- 医学的判断は必ず専門医にご相談ください

### 実装上の注意
- 症状を機械的に表現せず、自然な対話を心がけてください
- 患者の尊厳を保った表現を維持してください
- 指定された症状のみを表現し、未指定症状は表現しないでください

### 著作権・利用許諾
- 本テンプレート群はUPPS Consortiumの著作物です
- 教育・研究目的での利用は自由です
- 商用利用については別途お問い合わせください

## 関連文書

- [UPPS症状表現テンプレート作成ガイドライン](../../specification/clinical_symptom_expression_templates.md)
- [UPPS 2025.3仕様書](../../specification/upps_2025_3_specification.md)
- [UPPS運用指針](../../specification/operational_guidelines.md)
- [医療用ペルソナ実装例](../examples/README.md)

---

© UPPS Consortium 2025

*症状表現テンプレートは、医学的に妥当で自然な疾患症状表現を実現するための標準化されたツールです。教育・研究目的での活用により、医療従事者の訓練や患者理解の向上に貢献することを目指しています。*
