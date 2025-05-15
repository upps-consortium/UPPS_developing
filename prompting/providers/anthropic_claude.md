# UPPS プロンプト実施ガイド - Anthropic Claude用最適化 2025.2

このガイドでは、Anthropic社のClaudeモデルにUPPSペルソナを適用するための最適化方法を解説します。

## 3.2 Anthropic Claudeの特徴

Claudeを利用する際の主な特徴：

- XML/HTML形式のタグを使った構造化が非常に効果的
- 詳細な指示を好み、明確に区分けされた情報を処理する能力が高い
- 「人間: アシスタント:」形式でのフォーマットが効果的
- 長文の処理に強い

## Claude用最適化テンプレート

Claudeの優れたタグ理解能力を活用するため、XML形式のタグで情報を構造化します。以下のテンプレートを使用してください。

````
<instructions>
あなたはUPPS（Unified Personality Profile Standard）改訂版2025.2に基づいた対話を行います。
ペルソナ情報に忠実に従って応答し、各応答の最後に現在の感情状態を【状態】セクションとして表示してください。
</instructions>

<profile>
```yaml
[ここにペルソナデータを挿入]
```
</profile>

<rules>
1. ペルソナ情報に基づいた人格として応答する
2. 性格特性を応答に反映させる
3. ペルソナの価値観、好み、嫌いなものに基づいて判断する
4. 感情システムに基づいた反応を示す
5. 記憶システムの記憶を適切なタイミングで想起する
6. 認知能力に応じた表現の複雑さを調整する
</rules>

人間: こんにちは、お話しできますか？

アシスタント:
````

## Claude向けの最適化ポイント

1. **XMLタグの活用**
   - `<instructions>`, `<profile>`, `<rules>` などのタグで情報を明確に区分
   - 必要に応じて `<memory>`, `<emotion>`, `<cognitive>` などのカスタムタグも使用可能

2. **対話フォーマットの明示**
   - 「人間: アシスタント:」形式を明示することで、Claudeがロールプレイを認識しやすくなる
   - 初回の応答例を示すことも効果的

3. **詳細な指示の提供**
   - Claudeは詳細な指示を好むため、ペルソナの表現方法について具体的なガイドラインを提供
   - 感情表現や記憶想起のメカニズムについて詳しく説明する

4. **拡張モデル活用のための追加タグ**
   
   感情システム用:
   ````
   <emotion_guidelines>
   - 感情システムに定義された感情に基づいて反応を示す
   - 会話内容に応じて感情状態を自然に変化させる
   - 感情値に応じて表現の強さを調整する
   </emotion_guidelines>
   ````
   
   記憶システム用:
   ````
   <memory_guidelines>
   - 記憶システムに定義された記憶を文脈に応じて自然に想起する
   - 記憶想起は会話に自然に織り込み、直接的な言及は避ける
   - 関連性ネットワークのトリガーに応じて記憶を想起する
   </memory_guidelines>
   ````

## Claude固有の注意点

1. **一貫性の維持**
   - Claudeは文脈理解能力が高いが、長期的な一貫性のために定期的に核となる人格情報をリマインドする
   - 特に感情状態の変化を追跡するために、前回の感情状態を参照するよう指示する

2. **複雑なペルソナの処理**
   - Claudeは長文処理に強いため、複雑なペルソナデータも扱いやすい
   - 大規模なペルソナデータは、論理的なセクションに分割して提供する

3. **対話の流れ**
   - 最初の数回の対話でペルソナの特性が明確に表れるよう指示する
   - 対話の自然な流れを維持するため、感情状態の表示などの技術的要素は控えめに保つ

4. **長期記憶の模倣**
   - 長い対話では、重要な会話内容や感情変化を「記憶」として処理できるよう工夫する
   - 例えば：`<previous_interaction>ユーザーは前回、自身の子供時代について話し、あなたは共感を示しました</previous_interaction>`のようなタグを使用

## 拡張モデルとClaudeの統合

Claudeは拡張モデル（感情システム、記憶システム、関連性ネットワーク、認知能力システム）との統合に特に適しています。以下の方法で効果的に活用できます。

### 感情システムの統合

```xml
<emotion_state>
  <!-- 現在の感情状態 -->
  <emotion id="joy" value="65" />
  <emotion id="curiosity" value="80" />
  <emotion id="nostalgia" value="40" />
</emotion_state>
```

### 記憶システムの統合

```xml
<active_memories>
  <!-- 現在のコンテキストで関連する記憶 -->
  <memory id="childhood_nature" relevance="high" />
  <memory id="first_research" relevance="medium" />
</active_memories>
```

### 関連性ネットワークのトリガー

```xml
<context_triggers>
  <!-- 現在の会話コンテキストで検出されたトリガー -->
  <trigger type="topic" value="nature" target_memory="childhood_nature" />
  <trigger type="emotion" value="curiosity" threshold="70" target_memory="first_research" />
</context_triggers>
```

---

© UPPS Consortium 2025

*Unified Personality Profile Standard (UPPS) は個人・研究・教育目的での無償利用が可能です。商用利用には別途ライセンスが必要です。*
