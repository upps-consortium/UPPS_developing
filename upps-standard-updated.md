# Unified Personality Profile Standard (UPPS) 規格仕様書 改訂版2025.2

> *「人格モデルの標準化とペルソナ表現を通じてAIと人間の対話に一貫性と深みをもたらす」*

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
11. [サンプルペルソナ構造](#11-サンプルペルソナ構造)
12. [バージョン管理方針](#12-バージョン管理方針)
13. [実装上の注意事項](#13-実装上の注意事項)
14. [付録: 検証方法](#14-付録-検証方法)

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

UPPSペルソナの検証には以下の方法が推奨されます:

### 14.1 構文検証

YAMLの構文エラーを検出します:
````bash
# PyYAMLを使用した検証例
python -c "import yaml; yaml.safe_load(open('persona.yaml'))"
````

### 14.2 スキーマ検証

UPPSスキーマに準拠しているか検証します:
````python
# Python + pykwalifyを使用した検証例
from pykwalify.core import Core
c = Core(source_file="persona.yaml", schema_file="upps_schema.yaml")
c.validate(raise_exception=True)
````="upps_schema.yaml")
c.validate(raise_exception=True)
```

### 14.3 値の妥当性検証

数値範囲や必須フィールドを検証します:
````python
# 簡易検証スクリプトの例
def validate_upps(persona):
    # 必須フィールドの確認
    if 'personal_info' not in persona:
        return False, "personal_info missing"
    
    # 性格特性の値範囲確認
    traits = persona.get('personality', {}).get('traits', {})
    for trait, value in traits.items():
        if not 0.0 <= value <= 1.0:
            return False, f"Invalid trait value for {trait}: {value}"
    
    # 感情システムの検証
    if 'emotion_system' in persona:
        emotions = persona['emotion_system'].get('emotions', {})
        for emotion, data in emotions.items():
            baseline = data.get('baseline')
            if baseline is not None and not 0 <= baseline <= 100:
                return False, f"Invalid baseline for {emotion}: {baseline}"
    
    return True, "Valid"
````

### 14.4 関連性検証

関連性ネットワークの参照整合性を検証します:
````python
# 関連性の整合性検証例
def validate_associations(persona):
    # メモリIDのセット
    memory_ids = set()
    if 'memory_system' in persona:
        for memory in persona['memory_system'].get('memories', []):
            memory_ids.add(memory.get('id'))
    
    # 感情IDのセット
    emotion_ids = set()
    if 'emotion_system' in persona:
        emotion_ids.update(persona['emotion_system'].get('emotions', {}).keys())
        emotion_ids.update(persona['emotion_system'].get('additional_emotions', {}).keys())
    
    # 関連性の検証
    if 'association_system' in persona:
        for assoc in persona['association_system'].get('associations', []):
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
````

---

© UPPS Consortium 2025  
UPPSは個人・研究・教育目的での利用が無償で許可されています。商用利用には別途ライセンスが必要です。
