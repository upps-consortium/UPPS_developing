# UPPS症状表現テンプレート

> *医学的に妥当で自然な疾患症状の対話表現を実現するテンプレート集*

**対象**: UPPS 2025.3  

**最終更新**: 2025年8月1日

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
- `autism` (6A02): 自閉スペクトラム症の典型テンプレート
- `adhd` (6A05): 注意欠如・多動症（混合型）のテンプレート
- `schizophrenia` (6A20): 統合失調症の軽度〜中等度テンプレート
- `delusional_disorder` (6A24): 妄想性障害の典型テンプレート
- `bipolar` (6A60): 双極性障害の躁・うつエピソード（中等度〜重度）テンプレート
- `depression` (6A70): うつ病の軽度〜中等度テンプレート
- `persistent_depression` (6A72): 持続性抑うつ障害の長期症状テンプレート
- `anxiety` (6B00): 全般性不安症の軽度・中等度テンプレート
- `panic` (6B01): パニック症の中等度テンプレート
- `specific_phobia` (6B03): 特定恐怖症（動物恐怖）のテンプレート
- `social_anxiety` (6B04): 社交不安症（発表場面恐怖）のテンプレート
- `ocd` (6B20): 強迫症の中等度典型テンプレート
- `body_dysmorphic` (6B21): 身体醜形症の中等度テンプレート
- `hoarding` (6B24): ためこみ症の中等度テンプレート
- `acute_stress` (6B41): 急性ストレス反応の中等度テンプレート
- `ptsd` (6B41): 外傷後ストレス障害の中等度テンプレート（再体験／回避）
- `adjustment` (6B43): 適応障害の軽度抑うつ型テンプレート
- `depersonalization` (6B64): 離人症の中等度テンプレート
- `dissociative_identity` (6B65): 解離性同一症の中等度テンプレート
- `anorexia` (6B80): 神経性やせ症（制限型）の中等度テンプレート
- `bulimia` (6B81): 神経性過食症（排出型）の中等度テンプレート
- `binge_eating` (6B82): 過食性障害の中等度テンプレート
- `somatic_symptom` (6C20): 身体症状症の中等度テンプレート
- `illness_anxiety` (6C21): 病気不安症の中等度テンプレート
- `alcohol_use` (6C40): アルコール使用障害の中等度テンプレート
- `opioid_use` (6C4A): オピオイド使用障害の中等度テンプレート
- `gambling` (6C50): ギャンブル障害の中等度テンプレート
- `borderline_pd` (6D10): 境界性パーソナリティ障害の中等度テンプレート
- `avoidant_pd` (6D40): 回避性パーソナリティ障害の中等度テンプレート
- `alzheimer` (6D80): アルツハイマー型認知症の軽度〜重度テンプレート
- `antisocial_pd` (6D90): 反社会性パーソナリティ障害の中等度テンプレート

合計31ディレクトリのテンプレートを収録。重症度バリエーションあり：アルツハイマー型認知症、全般性不安症、双極性障害、うつ病、統合失調症。

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
- `social_anxiety`: 社交不安症
- `specific_phobia`: 特定恐怖症
- `ocd`: 強迫症
- `schizophrenia`: 統合失調症
- `delusional_disorder`: 妄想性障害
- `ptsd`: 外傷後ストレス障害
- `anorexia`: 神経性やせ症
- `bulimia`: 神経性過食症
- `binge_eating`: 過食性障害
- `alcohol_use_disorder`: アルコール使用障害
- `opioid_use_disorder`: オピオイド使用障害
- `gambling_disorder`: ギャンブル障害
- `dissociative_identity`: 解離性同一症
- `depersonalization`: 離人症
- `acute_stress`: 急性ストレス反応
- `adjustment`: 適応障害

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
