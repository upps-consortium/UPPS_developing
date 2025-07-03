# UPPS 2025.3 リポジトリ整備手順書

**対象バージョン**: UPPS 2025.3 v1.0.0  
**作成日**: 2025年7月3日  

## 1. 整備概要

### 1.1 主要な変更・追加内容

- **対話実行指示フレームワーク**（dialogue_instructions）の実装
- **動的人格変容システム**（association_system拡張）の実装  
- **非対話メタデータ管理**（non_dialogue_metadata）の実装
- **疾患特異的テンプレートシステム**の構築
- **用語統一**（「UPPSペルソナ」への移行）
- **スキーマ更新**（2025.3対応）

### 1.2 作業優先度

**Phase 1 (最優先)**: コア仕様とスキーマの更新  
**Phase 2 (高優先)**: 実装例とテンプレートの充実  
**Phase 3 (中優先)**: ドキュメント統合と品質向上  
**Phase 4 (低優先)**: ツール開発とエコシステム整備  

## 2. Phase 1: コア仕様とスキーマ更新

### 2.1 specification/ ディレクトリの整備

#### ✅ 対応済みファイル
- `specification/upps_standard.md` - 基本仕様（2025.3対応済み）
- `specification/operational_guidelines.md` - 運用指針（2025.3対応済み）

#### 🔄 更新が必要なファイル

**A. specification/schema/upps_schema.yaml の更新**
```yaml
# 以下の新規フィールドを追加
dialogue_instructions:
  type: object
  properties:
    template_ref: {type: string}
    customizations: {type: object}
    direct_description: {type: string}

non_dialogue_metadata:
  type: object
  properties:
    clinical_data: {type: object}
    copyright_info: {type: object}  
    administrative: {type: object}

# association_systemのid必須化
association_system:
  associations:
    items:
      required: ["id", "trigger", "response"]  # idを必須に
```

**手順**:
1. 現在の`specification/schema/schema.yaml`を`upps_schema.yaml`にリネーム
2. 2025.3の新機能に対応した新規フィールドを追加
3. association_systemにid必須化を追加
4. validation機能の強化

### 2.2 新規仕様書の作成

#### 📝 新規作成: `specification/upps_2025_3_specification.md`
- 既存の`upps_2025_3_specification.md`を`specification/`に移動
- 2025.3の新機能詳細説明
- 移行ガイドライン

#### 📝 新規作成: `specification/dialogue_instructions_framework.md`  
- 対話実行指示フレームワークの詳細仕様
- 疾患特異的テンプレートの設計指針
- 実装ガイドライン

#### 📝 新規作成: `specification/dynamic_persona_changes.md`
- 動的人格変容システムの詳細仕様
- 心理学的妥当性の担保方法
- 実装制約と推奨パターン

## 3. Phase 2: 実装例とテンプレートの充実

### 3.1 persona_lib/ ディレクトリの拡張

#### ✅ 対応済みファイル
- `persona_lib/rachel_bladerunner.yaml` - レイチェル（2025.3対応済み）
- `persona_lib/lum_urusei_yatsura.yaml` - ラム（2025.3対応済み）

#### 📝 新規作成: 統一された `persona_lib/` 構造

**A. 医療用ペルソナ（テンプレート + 実装例）**
```
persona_lib/medical/
├── templates/
│   ├── alzheimer_moderate_template.yaml    # 疾患特異的テンプレート
│   ├── depression_mild_template.yaml       # うつ病（軽度）テンプレート
│   ├── anxiety_disorder_template.yaml      # 不安症テンプレート
│   ├── ptsd_moderate_template.yaml         # PTSDテンプレート
│   └── cognitive_impairment_template.yaml  # 軽度認知障害テンプレート
├── examples/
│   ├── alzheimer_tanaka_hanako.yaml        # 田中花子（アルツハイマー実装例）
│   ├── depression_yamada_taro.yaml         # 山田太郎（うつ病実装例）
│   ├── anxiety_sato_yuki.yaml              # 佐藤雪（不安症実装例）
│   ├── ptsd_watanabe_ken.yaml              # 渡辺健（PTSD実装例）
│   └── cognitive_suzuki_ai.yaml            # 鈴木愛（軽度認知障害実装例）
└── README.md
```

**B. 創作用ペルソナ（テンプレート + 実装例）**
```
persona_lib/creative/
├── templates/
│   ├── anime_character_template.yaml       # アニメキャラテンプレート
│   ├── game_npc_template.yaml              # ゲームNPCテンプレート
│   ├── novel_character_template.yaml       # 小説キャラテンプレート
│   └── historical_figure_template.yaml     # 歴史人物風テンプレート
├── examples/
│   ├── detective_holmes_inspired.yaml      # 探偵キャラクター実装例
│   ├── ai_android_original.yaml            # AI・アンドロイド実装例
│   ├── fantasy_wizard_original.yaml        # ファンタジーキャラ実装例
│   └── historical_samurai_original.yaml    # 歴史人物風実装例
├── lum_urusei_yatsura.yaml                 # 既存（移動）
└── README.md
```

**C. 教育用ペルソナ（テンプレート + 実装例）**
```
persona_lib/educational/
├── templates/
│   ├── language_learner_template.yaml      # 言語学習者テンプレート
│   ├── student_template.yaml               # 学生テンプレート
│   ├── researcher_template.yaml            # 研究者テンプレート
│   └── elderly_learner_template.yaml       # 高齢学習者テンプレート
├── examples/
│   ├── language_learner_beginner.yaml      # 初級言語学習者実装例
│   ├── student_middle_school.yaml          # 中学生実装例
│   ├── researcher_phd_candidate.yaml       # 博士課程研究者実装例
│   └── elderly_tech_newcomer.yaml          # 高齢技術初心者実装例
└── README.md
```

**D. 映画・文学系ペルソナ（既存の整理）**
```
persona_lib/media/
├── rachel_bladerunner.yaml                 # 既存（移動）
└── README.md
```

### 3.2 疾患特異的テンプレートの構造例

**テンプレートファイルの基本構造**:
```yaml
# persona_lib/medical/templates/alzheimer_moderate_template.yaml
template_info:
  id: "alzheimer_moderate_v1.0"
  name: "アルツハイマー型認知症（中等度）テンプレート"
  version: "1.0"
  target_diagnosis: "F00.0"
  medical_reviewer: "神経内科専門医"
  last_updated: "2025-01-15"
  
# テンプレート固有のdialogue_instructions
dialogue_instructions:
  primary_symptoms:
    memory_formation_deficit: |
      新しい情報を3-5分程度しか保持できない。会話の途中で
      「あれ？何の話でしたっけ？」のような困惑表現を使う。
    repetitive_behavior: |
      同じ話題を15-20分間隔で繰り返す。特に家族の話、昔の仕事、
      心配事について。「そういえば...」で自然に始める。
  # ... 詳細な症状指示

# このテンプレートを使用する際の推奨設定例
recommended_settings:
  personality:
    neuroticism: 0.6-0.8  # 不安レベル高め推奨
    conscientiousness: 0.4-0.6  # やや低下
  
  cognitive_system:
    working_memory:
      level: 20-40  # 著明な低下
    verbal_comprehension:
      level: 60-80  # 比較的保持
```

### 3.3 prompting/ ディレクトリの拡張

#### ✅ 対応済みファイル  
- `prompting/templates/basic_template.md` 
- `prompting/templates/upps_template.md`
- `prompting/providers/` 各種プロバイダー対応

#### 📝 新規作成: 2025.3対応プロンプト
```
prompting/
├── v2025_3/
│   ├── dynamic_persona_prompts.md      # 動的変容対応プロンプト
│   ├── medical_persona_prompts.md      # 医療用特化プロンプト
│   └── creative_persona_prompts.md     # 創作用特化プロンプト
└── migration/
    └── v2025_2_to_v2025_3_guide.md     # 移行ガイド
```

## 4. Phase 3: ドキュメント統合と品質向上

### 4.1 documentation/ ディレクトリの新規作成

#### 📝 新規作成: 包括的ドキュメント体系
```
documentation/
├── getting_started/
│   ├── quickstart_guide.md
│   ├── basic_concepts.md  
│   └── first_persona_creation.md
├── advanced/
│   ├── dynamic_changes_guide.md
│   ├── medical_applications.md
│   └── creative_applications.md
├── reference/
│   ├── field_reference.md
│   ├── emotion_systems.md
│   ├── memory_systems.md
│   └── cognitive_systems.md
└── tutorials/
    ├── medical_persona_tutorial.md
    ├── creative_persona_tutorial.md
    └── troubleshooting.md
```

### 4.2 examples/ ディレクトリの拡張

#### 📝 新規作成: 実装例の体系化
```
examples/
├── conversations/
│   ├── medical_consultation_example.md
│   ├── therapy_session_example.md
│   └── creative_roleplay_example.md  
├── integration/
│   ├── chatgpt_integration.md
│   ├── claude_integration.md
│   └── custom_llm_integration.md
└── validation/
    ├── persona_validation.py
    ├── schema_validation.py
    └── conversation_quality_check.py
```

### 4.3 ルートディレクトリファイルの更新

#### 🔄 更新: `README.md`
- 2025.3の新機能紹介
- クイックスタートガイドの更新  
- ディレクトリ構造説明の更新
- 実装例へのリンク追加

#### 🔄 更新: `LICENSE.md`
- 最新のライセンス条項
- 商用利用に関する明確化
- テンプレート利用条件の追加

## 5. Phase 4: ツール開発とエコシステム整備

### 5.1 tools/ ディレクトリの新規作成

#### 📝 新規作成: 開発支援ツール
```
tools/
├── validator/
│   ├── upps_validator.py               # UPPS形式検証
│   ├── schema_validator.py             # スキーマ検証
│   └── medical_accuracy_check.py       # 医療的妥当性検証
├── generator/
│   ├── legacy_to_2025_3.py            # 旧版から2025.3への変換
│   ├── persona_generator.py            # ペルソナ生成支援
│   ├── template_applier.py             # テンプレート適用ツール
│   └── batch_processor.py             # 一括処理
├── editor/
│   ├── persona_editor.html            # Web版エディタ
│   ├── js/
│   │   ├── upps_editor.js
│   │   └── validation.js
│   └── css/
│       └── editor.css
└── testing/
    ├── conversation_simulator.py      # 対話シミュレーション
    ├── persona_tester.py              # ペルソナテスト
    └── performance_benchmark.py       # パフォーマンス測定
```

### 5.2 研究・評価用リソース

#### 📝 新規作成: research/ ディレクトリ
```
research/
├── validation_studies/
│   ├── medical_accuracy_study.md
│   ├── user_experience_study.md
│   └── conversation_quality_metrics.md
├── benchmarks/
│   ├── persona_consistency_test.py
│   ├── emotional_realism_test.py
│   └── memory_coherence_test.py
└── datasets/
    ├── medical_conversation_corpus/
    ├── creative_dialogue_samples/
    └── evaluation_metrics/
```

## 6. 実装手順詳細

### 6.1 Phase 1 実装手順 (1-2週間)

**Step 1: スキーマ更新** (2-3日)
1. `specification/schema/schema.yaml` → `upps_schema.yaml`リネーム
2. dialogue_instructions、non_dialogue_metadataフィールド追加
3. association_system のid必須化
4. バリデーション強化

**Step 2: コア仕様書整備** (3-4日)  
1. `upps_2025_3_specification.md`を`specification/`に移動・統合
2. `dialogue_instructions_framework.md`新規作成
3. `dynamic_persona_changes.md`新規作成
4. 既存仕様書との整合性確認

**Step 3: 移行ガイド作成** (2-3日)
1. 2025.2→2025.3移行手順の詳細化
2. 自動移行スクリプトの作成
3. 破壊的変更の明確化

### 6.2 Phase 2 実装手順 (2-3週間)

**Step 4: 医療用テンプレート・実装例作成** (1週間)
1. `persona_lib/medical/templates/`に疾患特異的テンプレート作成
   - アルツハイマー型認知症テンプレート（優先度最高）
   - うつ病、不安症テンプレート
   - PTSDテンプレート
2. `persona_lib/medical/examples/`に実装例作成
   - 各疾患の代表的な患者ペルソナ
3. 医療専門家レビュー体制構築

**Step 5: 創作・教育用ペルソナ拡充** (1週間)
1. `persona_lib/creative/`の整備
   - 既存ファイル（lum）の移動・整理
   - 新規創作用テンプレート・実装例追加
2. `persona_lib/educational/`の新規作成
   - 教育用テンプレート・実装例作成
3. `persona_lib/media/`の整備
   - 既存ファイル（rachel）の移動・整理
4. 動的変容機能の実装例充実

**Step 6: プロンプト体系拡張** (1週間)  
1. 2025.3対応プロンプトテンプレート
2. 動的変容用プロンプト
3. 医療・創作特化プロンプト
4. プロバイダー別最適化

### 6.3 Phase 3 実装手順 (2-3週間)

**Step 7: ドキュメント体系構築** (1-2週間)
1. `documentation/`ディレクトリ構造作成
2. 初心者向けガイド作成  
3. 上級者向けリファレンス作成
4. チュートリアル作成

**Step 8: 実装例・会話例拡充** (1週間)
1. 医療コンサルテーション例
2. 創作ロールプレイ例
3. 教育シナリオ例
4. トラブルシューティング例

### 6.4 Phase 4 実装手順 (3-4週間)

**Step 9: バリデーション・生成ツール開発** (1-2週間)
1. UPPS形式検証ツール
2. 医療的妥当性チェックツール
3. ペルソナ生成支援ツール（テンプレート適用機能含む）
4. 会話品質評価ツール
5. パフォーマンス測定ツール

**Step 10: エディタツール開発** (1-2週間)  
1. Webベースペルソナエディタ
2. リアルタイムバリデーション
3. テンプレート選択機能
4. エクスポート機能

## 7. 品質保証とレビュー体制

### 7.1 医療用コンテンツ品質保証

**医療専門家レビュー**:
- 神経内科専門医による認知症関連テンプレートレビュー
- 精神科医によるメンタルヘルス関連テンプレートレビュー  
- 臨床心理士による心理学的妥当性レビュー

**品質基準**:
- DSM-5-TR/ICD-11準拠
- 現代精神医学的妥当性
- 患者の尊厳保持
- 教育的価値

### 7.2 技術的品質保証

**自動テスト**:
- YAML構文チェック
- スキーマバリデーション
- 参照整合性チェック
- パフォーマンステスト

**手動レビュー**:
- コード品質レビュー
- ドキュメント品質レビュー
- ユーザビリティテスト
- セキュリティレビュー

### 7.3 コミュニティフィードバック

**ベータテスト**:
- 医療従事者向けベータテスト
- 開発者向けベータテスト
- 創作者向けベータテスト
- 学術研究者向けベータテスト

## 8. リリース計画

### 8.1 マイルストーン

**Milestone 1** (Phase 1完了): 2025年7月末
- コア仕様・スキーマ確定
- 基本的な2025.3対応完了

**Milestone 2** (Phase 2完了): 2025年8月末  
- 主要テンプレート・実装例完成
- プロンプト体系整備完了

**Milestone 3** (Phase 3完了): 2025年9月末
- ドキュメント体系完成
- 品質保証体制確立

**Milestone 4** (Phase 4完了): 2025年10月末
- ツール群開発完了
- エコシステム整備完了

### 8.2 リリース戦略

**Alpha Release** (Milestone 1後):
- 内部テスト・専門家レビュー用
- 限定公開（招待制）

**Beta Release** (Milestone 2後):  
- コミュニティベータテスト
- パブリックフィードバック収集

**RC (Release Candidate)** (Milestone 3後):
- 最終品質検証
- ドキュメント完成度確認

**General Availability** (Milestone 4後):
- 正式リリース
- プロダクションレディ

## 9. 実装時の注意事項

### 9.1 後方互換性の維持

- UPPS 2025.2フォーマットの継続サポート
- 段階的移行支援
- 明確な非推奨スケジュール
- 自動移行ツールの提供

### 9.2 法的・倫理的配慮

**医療用コンテンツ**:
- 医療情報の正確性担保
- 個人情報保護の徹底
- インフォームドコンセントの確保
- 診断・治療目的での使用制限明記

**創作用コンテンツ**:
- 著作権侵害の防止
- 二次創作ガイドライン遵守
- オリジナル作品の尊重
- フェアユース原則の適用

### 9.3 セキュリティ・プライバシー

- 個人特定可能情報の除去
- 医療情報の匿名化
- データ処理の透明性確保
- GDPR等プライバシー法制遵守

## 10. persona_lib/ 統一管理の利点

### 10.1 管理面の利点

**統一されたディレクトリ構造**:
- すべてのペルソナファイルが一箇所に集約
- テンプレートと実装例の関係性が明確
- バージョン管理が容易
- 検索・発見性の向上

**開発効率の向上**:
- ファイル間の参照が簡単
- テンプレート適用プロセスの標準化
- 新規ペルソナ作成時の迷いが削減
- 既存ペルソナの再利用促進

### 10.2 コミュニティ貢献への配慮

**コントリビューション体制**:
- テンプレート提案の簡素化
- 実装例の提供プロセス統一
- レビュー体制の効率化
- 品質基準の統一適用

**メンテナンス性**:
- 医療用テンプレートの専門家レビューが一元化
- 創作用コンテンツの著作権チェックが統一
- バージョンアップ時の影響範囲が明確
- 廃止・非推奨プロセスが一貫

## 11. コミュニティ貢献・ガバナンス

### 11.1 コントリビューション体制

**Pull Request ガイドライン**:
- 医療用コンテンツ（`persona_lib/medical/`）は専門家レビュー必須
- 創作用コンテンツ（`persona_lib/creative/`）は著作権確認必須
- 技術的変更はテスト必須
- ドキュメント更新の徹底

**コントリビューター認定**:
- 医療専門家認定システム
- 技術専門家認定システム
- クリエイター認定システム
- コミュニティメンバー階層

### 11.2 意思決定プロセス

**Technical Steering Committee**:
- UPPS標準の技術的方向性決定
- 重要な仕様変更の承認
- コミュニティ紛争の調停

**Medical Advisory Board**:
- 医療用途での妥当性確認
- 臨床的適用に関する指針策定
- 倫理的ガイドライン策定

### 10.1 コントリビューション体制

**Pull Request ガイドライン**:
- 医療用コンテンツは専門家レビュー必須
- 創作用コンテンツは著作権確認必須
- 技術的変更はテスト必須
- ドキュメント更新の徹底

**コントリビューター認定**:
- 医療専門家認定システム
- 技術専門家認定システム
- クリエイター認定システム
- コミュニティメンバー階層

### 10.2 意思決定プロセス

**Technical Steering Committee**:
- UPPS標準の技術的方向性決定
- 重要な仕様変更の承認
- コミュニティ紛争の調停

**Medical Advisory Board**:
- 医療用途での妥当性確認
- 臨床的適用に関する指針策定
- 倫理的ガイドライン策定

---

## 12. 完成時のディレクトリ構造全体像

```
upps/
├── LICENSE.md                           # ライセンス情報
├── README.md                            # プロジェクト概要（2025.3対応）
├── CONTRIBUTING.md                      # 貢献ガイドライン
│
├── specification/                       # 規格仕様関連
│   ├── upps_standard.md                 # 基本規格定義書
│   ├── upps_2025_3_specification.md     # 2025.3詳細仕様
│   ├── operational_guidelines.md        # 運用指針
│   ├── dialogue_instructions_framework.md # 対話実行指示フレームワーク
│   ├── dynamic_persona_changes.md       # 動的人格変容システム
│   └── schema/
│       └── upps_schema.yaml             # 2025.3対応スキーマ
│
├── persona_lib/                         # 🎯 統一ペルソナライブラリ
│   ├── medical/                         # 医療用ペルソナ
│   │   ├── templates/                   # 疾患特異的テンプレート
│   │   │   ├── alzheimer_moderate_template.yaml
│   │   │   ├── depression_mild_template.yaml
│   │   │   ├── anxiety_disorder_template.yaml
│   │   │   ├── ptsd_moderate_template.yaml
│   │   │   └── cognitive_impairment_template.yaml
│   │   ├── examples/                    # 医療用実装例
│   │   │   ├── alzheimer_tanaka_hanako.yaml
│   │   │   ├── depression_yamada_taro.yaml
│   │   │   ├── anxiety_sato_yuki.yaml
│   │   │   ├── ptsd_watanabe_ken.yaml
│   │   │   └── cognitive_suzuki_ai.yaml
│   │   └── README.md
│   ├── creative/                        # 創作用ペルソナ
│   │   ├── templates/
│   │   │   ├── anime_character_template.yaml
│   │   │   ├── game_npc_template.yaml
│   │   │   ├── novel_character_template.yaml
│   │   │   └── historical_figure_template.yaml
│   │   ├── examples/
│   │   │   ├── detective_holmes_inspired.yaml
│   │   │   ├── ai_android_original.yaml
│   │   │   ├── fantasy_wizard_original.yaml
│   │   │   └── historical_samurai_original.yaml
│   │   ├── lum_urusei_yatsura.yaml      # 既存（移動）
│   │   └── README.md
│   ├── educational/                     # 教育用ペルソナ
│   │   ├── templates/
│   │   │   ├── language_learner_template.yaml
│   │   │   ├── student_template.yaml
│   │   │   ├── researcher_template.yaml
│   │   │   └── elderly_learner_template.yaml
│   │   ├── examples/
│   │   │   ├── language_learner_beginner.yaml
│   │   │   ├── student_middle_school.yaml
│   │   │   ├── researcher_phd_candidate.yaml
│   │   │   └── elderly_tech_newcomer.yaml
│   │   └── README.md
│   ├── media/                           # 映画・文学系ペルソナ
│   │   ├── rachel_bladerunner.yaml      # 既存（移動）
│   │   └── README.md
│   └── README.md                        # ライブラリ全体の案内
│
├── prompting/                           # プロンプト主導型アプローチ
│   ├── README.md
│   ├── prompt_guide.md
│   ├── templates/
│   │   ├── basic_template.md
│   │   └── upps_template.md
│   ├── providers/
│   │   ├── openai_gpt.md
│   │   ├── anthropic_claude.md
│   │   ├── google_gemini.md
│   │   └── meta_llama.md
│   ├── v2025_3/                         # 2025.3対応プロンプト
│   │   ├── dynamic_persona_prompts.md
│   │   ├── medical_persona_prompts.md
│   │   └── creative_persona_prompts.md
│   ├── migration/
│   │   └── v2025_2_to_v2025_3_guide.md
│   └── examples/
│       └── example_conversation.md
│
├── documentation/                       # 包括的ドキュメント
│   ├── getting_started/
│   │   ├── quickstart_guide.md
│   │   ├── basic_concepts.md
│   │   └── first_persona_creation.md
│   ├── advanced/
│   │   ├── dynamic_changes_guide.md
│   │   ├── medical_applications.md
│   │   └── creative_applications.md
│   ├── reference/
│   │   ├── field_reference.md
│   │   ├── emotion_systems.md
│   │   ├── memory_systems.md
│   │   └── cognitive_systems.md
│   └── tutorials/
│       ├── medical_persona_tutorial.md
│       ├── creative_persona_tutorial.md
│       └── troubleshooting.md
│
├── examples/                            # 実装例・会話例
│   ├── conversations/
│   │   ├── medical_consultation_example.md
│   │   ├── therapy_session_example.md
│   │   └── creative_roleplay_example.md
│   ├── integration/
│   │   ├── chatgpt_integration.md
│   │   ├── claude_integration.md
│   │   └── custom_llm_integration.md
│   └── validation/
│       ├── persona_validation.py
│       ├── schema_validation.py
│       └── conversation_quality_check.py
│
├── tools/                               # 開発支援ツール
│   ├── validator/
│   │   ├── upps_validator.py
│   │   ├── schema_validator.py
│   │   └── medical_accuracy_check.py
│   ├── generator/
│   │   ├── legacy_to_2025_3.py
│   │   ├── persona_generator.py
│   │   ├── template_applier.py
│   │   └── batch_processor.py
│   ├── editor/
│   │   ├── persona_editor.html
│   │   ├── js/
│   │   └── css/
│   └── testing/
│       ├── conversation_simulator.py
│       ├── persona_tester.py
│       └── performance_benchmark.py
│
└── research/                            # 研究・評価用リソース
    ├── validation_studies/
    ├── benchmarks/
    └── datasets/
```

この手順書に従って段階的に実装することで、`persona_lib/`を中心とした統一的で使いやすいUPPS 2025.3リポジトリを構築できます。各フェーズでの成果物は次のフェーズの基盤となるため、品質を重視した着実な進行が重要です。