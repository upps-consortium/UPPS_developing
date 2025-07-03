# UPPS プロンプトガイド & テンプレート

このディレクトリには、UPPSペルソナをLLMに適用するためのガイドとテンプレートが含まれています。UPPS（Unified Personality Profile Standard）2025.3に基づいたプロンプト手法を提供します。

## ディレクトリ構成

```
prompting/
├── README.md                            # このファイル
├── prompt_guide.md                      # プロンプト実施ガイド（詳細）
├── templates/
│   ├── basic_template.md                # 基本テンプレート
│   └── standard_template.md             # 標準テンプレート（例示付き）
├── providers/
│   ├── openai_gpt_template.md           # OpenAI GPT用テンプレート
│   ├── anthropic_claude_template.md     # Anthropic Claude用テンプレート
│   ├── google_gemini_template.md        # Google Gemini用テンプレート
│   └── meta_llama_template.md           # Meta Llama用テンプレート
└── examples/
    └── example_conversation.md          # 対話例
```

## ファイル説明

- **[prompt_guide.md](./prompt_guide.md)**: UPPSペルソナをLLMに適用するための包括的なガイド。感情システム、記憶システム、関連性ネットワーク、認知能力システム、対話実行指示、動的人格変容システムの詳細な説明と活用方法を含みます。

- **[templates/basic_template.md](./templates/basic_template.md)**: 基本的なプロンプトテンプレート。

- **[templates/standard_template.md](./templates/standard_template.md)**: 例示付きの標準テンプレート。UPPS 2025.3の全機能を含みます。

- **[providers/](./providers/)**: 各LLMプロバイダー用に最適化されたテンプレート。

- **[examples/example_conversation.md](./examples/example_conversation.md)**: UPPS機能を活用した実際の対話例。

## クイックスタートガイド

### 1. 初めての利用者
[prompt_guide.md](./prompt_guide.md) でUPPS 2025.3の基本概念を理解してください。

### 2. テンプレートの選択

**基本的な使用**
- [basic_template.md](./templates/basic_template.md) を使用

**例示を参考にしたい場合**
- [standard_template.md](./templates/standard_template.md) を使用

**特定のLLMに最適化**
- [providers/](./providers/) ディレクトリの各LLM用テンプレートを使用

### 3. 使用手順

1. **ペルソナデータの準備**: UPPSペルソナをYAML形式で準備
2. **テンプレートに挿入**: 選択したテンプレートの該当部分にペルソナデータを貼り付け
3. **LLMに適用**: 完成したプロンプトをLLMに送信
4. **対話開始**: 自然な対話を楽しむ

### 4. 実装例

実際の動作例は [examples/example_conversation.md](./examples/example_conversation.md) を参照してください。

---

© UPPS Consortium 2025