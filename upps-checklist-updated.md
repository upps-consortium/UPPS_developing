# UPPS用語統一ガイドライン 改訂版：「UPPSペルソナ」への移行 - チェックリスト更新

## チェックリスト

- [x] README.md の用語統一と説明追加
- [x] specification/upps_standard.md の用語統一と説明追加
- [x] specification/operational_guidelines.md の用語統一と説明追加
- [x] specification/schema/upps_schema.yaml の修正
- [x] prompting/templates/ 内のファイル修正
  - [x] basic_template.md
  - [x] upps-template.md
- [x] prompting/prompt_guide.md の修正
- [x] prompting/extensions/ 内のファイル修正
  - [x] extension_models.md
- [x] prompting/providers/ 内のファイル修正
  - [x] anthropic_claude.md
  - [x] google_gemini.md
  - [x] meta_llama.md
  - [x] openai_gpt.md
- [ ] tools/editor/ 内のファイル修正
  - [ ] upps_editor/index.html
  - [ ] upps_editor/js/main.js
  - [ ] upps_editor/js/data.js
- [ ] tools/validator/ 内のファイル修正
  - [ ] upps_validator.py
  - [ ] upps_reference_validator.py
- [ ] tools/converter/ 内のファイル修正
  - [ ] upps-converter.py
- [ ] 全修正のテストと動作確認
- [ ] ドキュメント生成（必要に応じて）
- [x] すべてのコードブロックをバッククォート4つに変更（コア仕様書・テンプレート・ガイド・プロバイダードキュメント）

## 修正進捗状況

### 1. コア仕様書 - 完了 ✅
- [x] README.md
- [x] specification/upps_standard.md
- [x] specification/operational_guidelines.md
- [x] specification/schema/upps_schema.yaml

### 2. テンプレートとガイド - 完了 ✅
- [x] prompting/templates/basic_template.md
- [x] prompting/templates/upps-template.md
- [x] prompting/prompt_guide.md
- [x] prompting/extensions/extension_models.md

### 3. プロバイダー別ガイド - 完了 ✅
- [x] prompting/providers/anthropic_claude.md
- [x] prompting/providers/google_gemini.md
- [x] prompting/providers/meta_llama.md
- [x] prompting/providers/openai_gpt.md

### 4. ツールコード - 未完了
- [ ] tools/editor/upps_editor/（全ファイル）
- [ ] tools/validator/（全ファイル）
- [ ] tools/converter/（全ファイル）

### 5. その他のタスク - 進行中
- [ ] 修正後のすべてのスクリプトとツールの動作確認
- [ ] 必要に応じたドキュメント生成

## 修正完了項目の詳細

### ドキュメントとガイド
- prompting/prompt_guide.md: 用語を統一し、セクション1.1に用語説明を追加
- prompting/extensions/extension_models.md: タイトルを「ペルソナ拡張モデル活用」に変更し、「UPPSペルソナ」に統一
- prompting/templates/basic_template.md: タイトルを修正し、「UPPSペルソナ」に統一
- prompting/templates/upps-template.md: タイトルと冒頭を修正し、全体を「UPPSペルソナ」に統一

### プロバイダー別ガイド
- prompting/providers/anthropic_claude.md: タイトルを修正し、タグを`<persona>`に変更
- prompting/providers/google_gemini.md: タイトルを修正し、全体を「ペルソナ情報」に統一
- prompting/providers/meta_llama.md: タイトルを修正し、タグとプロファイル表現を変更
- prompting/providers/openai_gpt.md: タイトルを修正し、全体を「ペルソナ情報」に統一

### コードブロック表記
- すべての対象ファイルでコードブロックをバッククォート4つ（````）に変更

## 次のステップ
1. tools/ ディレクトリ内のファイル修正
2. 全修正の統合テストと動作確認
3. 必要に応じてドキュメント生成

---

© UPPS Consortium 2025