# UPPS プロンプトガイド & テンプレート

このディレクトリには、UPPSペルソナをLLMに適用するためのガイドとテンプレートが含まれています。UPPS（Unified Personality Profile Standard）2025.2に基づいたプロンプト手法を提供します。

## ディレクトリ構造

```
prompting/
├── README.md                     # このファイル
├── prompt_guide.md               # プロンプト実施ガイド（詳細）
├── templates/
│   ├── basic_template.md         # 基本テンプレート
│   └── upps_template.md          # 標準テンプレート（2025.2対応）
├── providers/
│   ├── openai_gpt.md             # OpenAI GPT用テンプレート
│   ├── anthropic_claude.md       # Anthropic Claude用テンプレート
│   ├── google_gemini.md          # Google Gemini用テンプレート
│   └── meta_llama.md             # Meta Llama用テンプレート
└── example/
    └── example_conversation.md   # 対話例
```

## ファイル説明

### ガイドとメインテンプレート

- **[prompt_guide.md](./prompt_guide.md)**: UPPSペルソナをLLMに適用するための包括的なガイド。感情システム、記憶システム、関連性ネットワーク、認知能力システムの詳細な説明と活用方法を含みます。

- **[templates/basic_template.md](./templates/basic_template.md)**: 最低限必要な要素だけを含む簡素なプロンプトテンプレート。基本的な使用例に適しています。

- **[templates/upps_template.md](./templates/upps_template.md)**: 2025.2標準に準拠した完全な機能を持つプロンプトテンプレート。感情システム、記憶システム、関連性ネットワーク、認知能力システムを含みます。

### プロバイダー別テンプレート

- **[providers/openai_gpt.md](./providers/openai_gpt.md)**: OpenAI GPTモデル（ChatGPT、GPT-4など）用に最適化されたテンプレート。システムメッセージとユーザーメッセージの分離を活用しています。

- **[providers/anthropic_claude.md](./providers/anthropic_claude.md)**: Anthropic Claudeモデル用に最適化されたテンプレート。XMLタグによる構造化を活用しています。

- **[providers/google_gemini.md](./providers/google_gemini.md)**: Google Geminiモデル用に最適化されたテンプレート。シンプルで明確な構造を特徴としています。

- **[providers/meta_llama.md](./providers/meta_llama.md)**: Meta Llamaモデル用に最適化されたテンプレート。タグによる区切りとコンテキストウィンドウの効率的な使用を特徴としています。

## クイックスタートガイド

1. **初めての利用者**: まず [prompt_guide.md](./prompt_guide.md) を読んでUPPSペルソナの基本概念と活用方法を理解してください。

2. **テンプレートの選択**:
   - 簡単な実験には [basic_template.md](./templates/basic_template.md) を使用
   - 完全な機能を活用するには [upps_template.md](./templates/upps_template.md) を使用
   - 特定のLLMに最適化されたテンプレートは [providers/](./providers/) ディレクトリを参照

3. **ペルソナデータの準備**:
   - ペルソナデータをYAML形式で準備
   - 選択したテンプレートの該当部分に挿入

4. **LLMに適用**:
   - 完成したプロンプトをLLMに適用して対話開始

## 使用例

```
# あなたのUPPSペルソナを準備
personal_info:
  name: "Jane Doe"
  age: 29
  ...

# テンプレートに挿入
# LLMに適用
# 対話を開始
```

詳細な使用例については [example/example_conversation.md](./example/example_conversation.md) を参照してください。

---

© UPPS Consortium 2025
