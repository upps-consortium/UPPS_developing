# UPPS医療用ペルソナライブラリ

> *医学教育・臨床研修・心理学研究のための仮想患者ペルソナ集*

**対象**: UPPS 2025.3  
**最終更新**: 2025年7月30日

## 概要

このディレクトリには、医療・心理学分野での教育・研修・研究に活用できるUPPS準拠のペルソナが格納されています。実際の臨床現場を想定した仮想患者との対話を通じて、医療従事者の訓練や患者理解の向上を支援します。

## 構成

### templates/ - 症状表現テンプレート
```
templates/
├── README.md                # テンプレート使用方法
├── alzheimer/               # アルツハイマー型認知症テンプレート
├── depression/              # うつ病テンプレート
├── schizophrenia/           # 統合失調症テンプレート
├── anxiety/                 # 不安症テンプレート
├── panic/                   # パニック症テンプレート
├── ocd/                     # 強迫症テンプレート
├── ptsd/                    # PTSDテンプレート
├── bipolar/                 # 双極性障害テンプレート
├── alcohol_use/             # アルコール使用障害テンプレート
├── opioid_use/              # オピオイド使用障害テンプレート
└── gambling/                # ギャンブル障害テンプレート
```

**特徴**:
- 疾患・重症度・症状パターン別に整理
- DSM-5-TR/ICD-11準拠の医学的妥当性
- 専門医監修による品質保証
- 複数ペルソナでの再利用可能

### examples/ - 実装例
```
examples/
├── README.md            # 実装例使用方法
├── alzheimer_TH.yaml    # T.H.（アルツハイマー）
├── depression_YT.yaml   # Y.T.（うつ病）
├── anxiety_SY.yaml      # S.Y.（不安症）
├── bipolar_NA.yaml      # N.A.（双極性障害）
├── ocd_YK.yaml          # Y.K.（強迫症）
├── panic_TK.yaml        # パニック症
├── ptsd_KW.yaml         # K.W.（PTSD）
├── alcohol_use_HS.yaml  # H.S.（アルコール使用障害）
├── opioid_use_MT.yaml   # M.T.（オピオイド使用障害）
└── gambling_NM.yaml     # N.M.（ギャンブル障害）
```

**特徴**:
- 症状表現テンプレートを参照
- 個人的背景・人格・価値観を含む
- 実際の臨床場面を想定
- 多様な背景・年齢層をカバー

## 使用方法

### 基本的な活用パターン

#### 1. 既存実装例の利用
```yaml
# T.H.さん（アルツハイマー）をそのまま使用
persona_file: "examples/alzheimer_TH.yaml"
```

#### 2. テンプレートベースの新規作成
```yaml
# 新規ペルソナファイル作成
personal_info:
  name: "A.B."
  display_name: "A.B.さん（75歳女性）"
  disclaimer: "このペルソナは研究教育目的で作成された架空の患者です"
  age: 75
  # 個人情報...

dialogue_instructions:
  template_ref: "alzheimer_moderate_typical_v1.0"  # テンプレート参照
  customizations:
    additional_notes: "個人的背景に基づく調整"
```

#### 3. 完全カスタム作成
```yaml
# dialogue_instructionsで直接記述
dialogue_instructions:
  direct_description: |
    独自の症状表現指示を記述
```

### 架空患者について

**本ライブラリの全ての患者は架空であり、以下の方針に基づいています：**

- **イニシャル表記**: T.H.、Y.T.等のイニシャルのみ使用
- **架空明示**: 全て教育目的の仮想患者である旨を明記  
- **実在者保護**: 実在の患者・個人との混同を避ける設計
- **プライバシー**: 個人特定可能な情報は一切含まない
- **教育目的**: 研究教育目的での使用に限定

### 教育・研修での活用

#### 医学生向け
- **基礎教育**: 疾患症状の理解
- **コミュニケーション**: 患者との対話技法
- **共感性**: 患者の心理状態の理解

#### 研修医向け
- **診断練習**: 症状の聞き取りと診断
- **治療計画**: 病状に応じた対応
- **医療面接**: 効果的な問診技法

#### 看護師向け
- **患者対応**: 症状に応じた看護ケア
- **心理的支援**: 患者の不安への対応
- **家族支援**: 家族への説明と支援

#### 臨床心理士向け
- **アセスメント**: 心理状態の評価
- **カウンセリング**: 治療的対話技法
- **家族療法**: 家族を含めた支援

### 研究での活用

#### 心理学研究
- **症状表現**: 疾患の言語的表現パターン
- **対話分析**: 患者-医療者間コミュニケーション
- **認知評価**: 疾患による認知機能への影響

#### 医学教育研究
- **教育効果**: 仮想患者教育の効果測定
- **コンピテンシー**: 医療従事者の能力評価
- **シミュレーション**: 臨床場面の再現と分析

## 対象疾患・症状

### 認知症・神経認知障害
- **アルツハイマー型認知症**: 軽度〜重度、各種症状パターン
- **血管性認知症**: 段階的進行パターン
- **レビー小体型認知症**: 幻視、パーキンソン症状
- **前頭側頭型認知症**: 人格変化、行動異常

### 気分障害
- **うつ病**: メランコリー型、非定型など
- **双極性障害**: 躁エピソード、うつエピソード
- **持続性抑うつ障害**: 長期間の軽度うつ状態

### 不安症・関連障害
- **全般性不安症**: 過度の心配、身体症状
- **パニック症**: パニック発作、予期不安
- **社交不安症**: 社会的場面での不安
- **恐怖症性障害**: 特定の対象への恐怖

### 統合失調症スペクトラム
- **統合失調症**: 陽性症状、陰性症状、認知症状
- **妄想性障害**: 体系化された妄想
- **短期精神病性障害**: 一過性の精神病症状

### トラウマ・ストレス関連障害
- **PTSD**: 再体験、回避、覚醒症状
- **急性ストレス障害**: 急性期の反応
- **適応障害**: ストレス因子への反応

## 実装状況

### ✅ 実装済みテンプレート群
| 疾患群 | 実装済み | 予定 | 完成率 | ステータス |
|--------|----------|------|--------|------------|
| アルツハイマー型認知症 | 4種類 | 7種類 | 57% | 🟡 部分完成 |
| うつ病 | 4種類 | 6種類 | 67% | 🟡 部分完成 |
| 統合失調症 | 4種類 | 5種類 | 80% | 🟢 ほぼ完成 |
| 不安症 | 2種類 | 3種類 | 67% | 🟡 部分完成 |
| PTSD | 2種類 | 2種類 | 100% | 🟢 完成 |
| 双極性障害 | 2種類 | 2種類 | 100% | 🟢 完成 |

### 📁 ディレクトリ構造（実際の状況）
```
templates/
├── alzheimer/          ✅ 4ファイル実装済み
│   ├── alzheimer_mild_typical_v1.0.yaml
│   ├── alzheimer_moderate_confabulation_v1.0.yaml
│   ├── alzheimer_moderate_anosognosia_v1.0.yaml
│   ├── alzheimer_severe_disorientation_v1.0.yaml
│   └── alzheimer_memory_templates.md
├── depression/         ✅ 4ファイル実装済み
│   ├── depression_mild_typical_v1.0.yaml
│   ├── depression_mild_atypical_v1.0.yaml
│   ├── depression_moderate_melancholic_v1.0.yaml
│   ├── depression_dysthymic_chronic_v1.0.yaml
│   └── depression_templates_overview.md
├── schizophrenia/      ✅ 4ファイル実装済み
│   ├── schizophrenia_mild_adapted_v1.0.yaml
│   ├── schizophrenia_mild_negative_v1.0.yaml
│   ├── schizophrenia_moderate_acute_v1.0.yaml
│   ├── schizophrenia_subtle_positive_v1.0.yaml
│   └── schizophrenia_templates_overview.md
├── anxiety/          ✅ 2ファイル実装済み
│   ├── anxiety_mild_generalized_v1.0.yaml
│   └── anxiety_moderate_generalized_v1.0.yaml
├── panic/            ✅ 1ファイル実装済み
│   └── panic_disorder_moderate_v1.0.yaml
├── ptsd/             ✅ 2ファイル実装済み
│   ├── ptsd_moderate_reexperiencing_v1.0.yaml
│   └── ptsd_moderate_avoidance_v1.0.yaml
└── bipolar/          ✅ 2ファイル実装済み
    ├── bipolar_manic_moderate_v1.0.yaml
    └── bipolar_depressive_moderate_v1.0.yaml
```

## 品質保証

### 医学的妥当性
- **診断基準準拠**: DSM-5-TR/ICD-11に基づく
- **臨床的妥当性**: 実際の臨床現象に即した表現
- **専門医監修**: 該当分野の専門医による監修
- **定期更新**: 医学的知見の更新に応じた改訂

### 教育効果
- **学習目標**: 明確な教育目標の設定
- **適切な難易度**: 学習者レベルに応じた調整
- **実践的内容**: 実際の臨床場面を想定
- **効果測定**: 学習効果の定量的評価

### 倫理的配慮
- **患者尊厳**: 偏見やスティグマを助長しない表現
- **多様性**: 多様な背景・文化的要因の考慮
- **プライバシー**: 個人を特定できる情報の除去
- **インフォームドコンセント**: 利用目的の明確化

## 技術仕様

### 対応UPPS版
- **UPPS 2025.3**: 最新仕様に完全対応
- **動的変容**: 対話を通じた症状変化の表現
- **関連性ネットワーク**: 感情と記憶の相互作用
- **認知能力システム**: WAIS-IV準拠の認知評価

### 対応LLM
- **ChatGPT**: GPT-4以降推奨
- **Claude**: Claude 3以降推奨
- **Gemini**: Gemini Pro以降推奨
- **その他**: UPPS対応LLMシステム

### 統合要件
- **プロンプト統合**: テンプレートとペルソナの自動統合
- **バリデーション**: 医学的妥当性の自動チェック
- **品質管理**: 症状表現の一貫性確保
- **更新管理**: バージョン管理とアップデート

## 利用上の注意

### 医学的制限
- **教育・研究目的**: 診断・治療目的では使用しない
- **専門医相談**: 実際の医学的判断は専門医に相談
- **個人差**: 実際の患者には個人差があることを理解
- **限界認識**: 仮想患者の限界を認識した活用

### 実装上の注意
- **自然な対話**: 症状の機械的表現を避ける
- **患者尊厳**: 尊厳を保った表現を維持
- **文脈適応**: 対話の流れに応じた調整
- **感情配慮**: 患者の感情状態への配慮

### 法的・倫理的配慮
- **利用許諾**: 教育・研究目的での利用
- **データ保護**: 対話データの適切な管理
- **プライバシー**: 個人情報の保護
- **責任制限**: 利用による結果への責任範囲

## 開発・貢献

### 新規テンプレート提案
- **医学的根拠**: 確立された診断基準に基づく
- **専門医監修**: 該当分野の専門医による監修
- **品質基準**: 既存テンプレートと同等の品質
- **文書化**: 適切な文書化と説明

### 改善提案
- **フィードバック**: 実装現場からの改善提案
- **バグ報告**: 医学的不正確性の報告
- **機能要求**: 新機能の提案
- **品質向上**: 教育効果の向上提案

### 貢献プロセス
1. **Issue作成**: GitHub Issuesで問題・提案を報告
2. **Pull Request**: 改善案の提出
3. **専門医レビュー**: 医学的妥当性の確認
4. **コミュニティレビュー**: コミュニティによる評価
5. **統合**: 承認後の本体への統合

## 関連文書

- [症状表現テンプレート使用方法](templates/README.md)
- [実装例使用方法](examples/README.md)
- [UPPS症状表現テンプレート作成ガイドライン](../../specification/clinical_symptom_expression_templates.md)
- [UPPS 2025.3仕様書](../../specification/upps_2025_3_specification.md)
- [UPPS運用指針](../../specification/operational_guidelines.md)

## サポート・問い合わせ

### 技術的問題
- **GitHub Issues**: https://github.com/upps-consortium/upps/issues
- **技術サポート**: tech-support@upps-consortium.org
- **統合支援**: integration-support@upps-consortium.org

### 医学的内容
- **医学監修**: medical-review@upps-consortium.org
- **新規テンプレート**: template-proposals@upps-consortium.org
- **品質改善**: quality-feedback@upps-consortium.org

### 教育・研修
- **教育活用**: education-support@upps-consortium.org
- **研修プログラム**: training-programs@upps-consortium.org
- **効果測定**: evaluation-support@upps-consortium.org

### 研究・学術
- **研究協力**: research-collaboration@upps-consortium.org
- **学術発表**: academic-publications@upps-consortium.org
- **データ提供**: data-sharing@upps-consortium.org

---

© UPPS Consortium 2025

*UPPS医療用ペルソナライブラリは、医学教育・臨床研修・心理学研究の質向上を目指して開発されています。仮想患者との対話を通じて、医療従事者の臨床能力向上と患者理解の深化に貢献することを使命としています。*
