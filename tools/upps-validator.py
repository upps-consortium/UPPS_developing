#!/usr/bin/env python3
"""
UPPS Schema Validator Tool (スキーマ検証ツール)
Version: 2025.2 v1.2.0

このスクリプトは、UPPSプロファイルがスキーマに準拠しているかを検証します。
また、感情と記憶の関連性を確認する参照整合性チェックも実行します。

使用方法:
  python upps_validator.py [プロファイルのパス]

必要なパッケージ:
  - pyyaml
  - jsonschema
"""

import sys
import os
import yaml
import json
import jsonschema
from jsonschema import validate
from pathlib import Path
from typing import Dict, List, Any, Tuple, Set

def load_yaml(file_path: str) -> Dict:
    """YAMLファイルを読み込む"""
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            return yaml.safe_load(file)
    except Exception as e:
        print(f"YAMLファイルの読み込みに失敗しました: {e}")
        sys.exit(1)

def validate_schema(profile: Dict, schema: Dict) -> bool:
    """JSONスキーマでプロファイルを検証する"""
    try:
        validate(instance=profile, schema=schema)
        print("✅ スキーマ検証: 成功")
        return True
    except jsonschema.exceptions.ValidationError as e:
        print(f"❌ スキーマ検証: 失敗\n{e}")
        return False

def validate_references(profile: Dict) -> bool:
    """参照整合性を検証する"""
    valid = True
    
    # 感情システムの存在確認
    if 'emotion_system' not in profile:
        print("⚠️ 感情システムがありません。参照整合性の完全チェックはスキップします。")
        return True
    
    # 記憶システムの存在確認
    if 'memory_system' not in profile:
        print("⚠️ 記憶システムがありません。参照整合性の完全チェックはスキップします。")
        return True
        
    # 関連性ネットワークの存在確認
    if 'association_system' not in profile:
        print("⚠️ 関連性ネットワークがありません。参照整合性のチェックはスキップします。")
        return True
    
    # 感情IDのセット作成
    emotion_ids = set()
    if 'emotion_system' in profile:
        emotion_ids.update(profile['emotion_system'].get('emotions', {}).keys())
        emotion_ids.update(profile['emotion_system'].get('additional_emotions', {}).keys())
        emotion_ids.update(profile['emotion_system'].get('compound_emotions', {}).keys())
    
    # 記憶IDのセット作成
    memory_ids = set()
    if 'memory_system' in profile:
        for memory in profile['memory_system'].get('memories', []):
            memory_ids.add(memory.get('id'))
    
    # 関連性の検証
    if 'association_system' in profile:
        for i, assoc in enumerate(profile['association_system'].get('associations', [])):
            # トリガー検証
            trigger = assoc.get('trigger', {})
            
            if 'type' in trigger:  # 単一トリガー
                if trigger['type'] == 'memory' and 'id' in trigger:
                    if trigger['id'] not in memory_ids:
                        print(f"❌ 関連性 #{i+1}: トリガーが存在しない記憶ID '{trigger['id']}' を参照しています")
                        valid = False
                
                elif trigger['type'] == 'emotion' and 'id' in trigger:
                    if trigger['id'] not in emotion_ids:
                        print(f"❌ 関連性 #{i+1}: トリガーが存在しない感情ID '{trigger['id']}' を参照しています")
                        valid = False
            
            elif 'operator' in trigger:  # 複合トリガー
                for j, condition in enumerate(trigger.get('conditions', [])):
                    if condition.get('type') == 'memory' and 'id' in condition:
                        if condition['id'] not in memory_ids:
                            print(f"❌ 関連性 #{i+1}, 条件 #{j+1}: 条件が存在しない記憶ID '{condition['id']}' を参照しています")
                            valid = False
                    
                    elif condition.get('type') == 'emotion' and 'id' in condition:
                        if condition['id'] not in emotion_ids:
                            print(f"❌ 関連性 #{i+1}, 条件 #{j+1}: 条件が存在しない感情ID '{condition['id']}' を参照しています")
                            valid = False
            
            # レスポンス検証
            response = assoc.get('response', {})
            
            if response.get('type') == 'memory' and 'id' in response:
                if response['id'] not in memory_ids:
                    print(f"❌ 関連性 #{i+1}: レスポンスが存在しない記憶ID '{response['id']}' を参照しています")
                    valid = False
            
            elif response.get('type') == 'emotion' and 'id' in response:
                if response['id'] not in emotion_ids:
                    print(f"❌ 関連性 #{i+1}: レスポンスが存在しない感情ID '{response['id']}' を参照しています")
                    valid = False
    
    if valid:
        print("✅ 参照整合性検証: 成功")
    
    return valid

def validate_consistency(profile: Dict) -> bool:
    """プロファイル内の一貫性を検証する"""
    valid = True
    
    # 感情値（current_emotion_state/state）と感情システムの一貫性確認
    emotion_ids = set()
    if 'emotion_system' in profile:
        emotion_ids.update(profile['emotion_system'].get('emotions', {}).keys())
        emotion_ids.update(profile['emotion_system'].get('additional_emotions', {}).keys())
        emotion_ids.update(profile['emotion_system'].get('compound_emotions', {}).keys())
    
    # current_emotion_stateの検証
    if 'current_emotion_state' in profile:
        for emotion_id in profile['current_emotion_state'].keys():
            if emotion_id not in emotion_ids and 'emotion_system' in profile:
                print(f"⚠️ current_emotion_stateの感情 '{emotion_id}' は感情システムで定義されていません")
                valid = False
    
    # stateの検証（レガシー形式）
    if 'state' in profile:
        if 'current_emotion_state' in profile:
            print("⚠️ stateとcurrent_emotion_stateの両方が定義されています。current_emotion_stateが優先されます")
    
    # 必須でないフィールドのいくつかがあるか確認して警告
    if 'likes' not in profile and 'dislikes' not in profile:
        print("⚠️ likesとdislikesのどちらも定義されていません。ユーザー体験の向上のために定義をお勧めします")
    
    # 基本的な一貫性チェック
    if 'personality' in profile and 'traits' in profile['personality']:
        traits = profile['personality']['traits']
        
        # 特性値の極端なチェック
        extreme_traits = []
        for trait, value in traits.items():
            if value >= 0.9:
                extreme_traits.append(f"{trait}が非常に高い ({value})")
            elif value <= 0.1:
                extreme_traits.append(f"{trait}が非常に低い ({value})")
        
        if extreme_traits:
            print("⚠️ 極端な性格特性値が見つかりました:")
            for trait in extreme_traits:
                print(f"  - {trait}")
            print("  これは意図的である場合は問題ありませんが、現実的な性格表現のために確認してください")
    
    # 認知能力値の一貫性チェック
    if 'cognitive_system' in profile and 'abilities' in profile['cognitive_system']:
        abilities = profile['cognitive_system']['abilities']
        
        # 極端な能力値をチェック
        extreme_abilities = []
        for ability_name, ability in abilities.items():
            if 'level' in ability:
                if ability['level'] >= 90:
                    extreme_abilities.append(f"{ability_name}が非常に高い ({ability['level']})")
                elif ability['level'] <= 10:
                    extreme_abilities.append(f"{ability_name}が非常に低い ({ability['level']})")
        
        if extreme_abilities:
            print("⚠️ 極端な認知能力値が見つかりました:")
            for ability in extreme_abilities:
                print(f"  - {ability}")
            print("  これは意図的である場合は問題ありませんが、現実的な能力表現のために確認してください")
        
        # general_abilityと個別能力の大きな差異をチェック
        if 'general_ability' in profile['cognitive_system'] and 'level' in profile['cognitive_system']['general_ability']:
            general_level = profile['cognitive_system']['general_ability']['level']
            for ability_name, ability in abilities.items():
                if 'level' in ability:
                    if abs(ability['level'] - general_level) > 30:
                        print(f"⚠️ '{ability_name}'の能力値({ability['level']})が全体的な能力値({general_level})と大きく異なります")
                        print("  これは意図的である場合は問題ありませんが、一貫性のために確認してください")
    
    # 記憶システムと感情システムの関連整合性
    if 'memory_system' in profile and 'emotion_system' in profile:
        for memory in profile['memory_system'].get('memories', []):
            if 'associated_emotions' in memory:
                for emotion in memory['associated_emotions']:
                    if emotion not in emotion_ids:
                        print(f"⚠️ 記憶 '{memory['id']}' の関連感情 '{emotion}' は感情システムで定義されていません")
                        valid = False
    
    if valid:
        print("✅ 一貫性検証: 成功")
    
    return valid

def convert_legacy_to_extended(profile: Dict) -> Dict:
    """レガシー形式から拡張モデル形式へ変換する"""
    new_profile = profile.copy()
    
    # stateからcurrent_emotion_stateへの変換
    if 'state' in profile and 'current_emotion_state' not in profile:
        new_profile['current_emotion_state'] = profile['state'].copy()
        print("✅ stateをcurrent_emotion_stateに変換しました")
    
    # memory_traceからmemory_systemへの変換
    if 'memory_trace' in profile and 'memory_system' not in profile:
        memory_system = {"memories": []}
        
        for i, memory in enumerate(profile['memory_trace'].get('memories', [])):
            # IDの生成
            memory_id = f"memory_{i}"
            if 'event' in memory:
                # スペースをアンダースコアに、小文字に変換し、特殊文字を削除
                event_words = ''.join(c for c in memory['event'].lower() if c.isalnum() or c.isspace())
                words = event_words.split()
                if len(words) > 0:
                    memory_id = '_'.join(words[:3])[:30]  # 最初の3語、30文字まで
            
            new_memory = {
                "id": memory_id,
                "type": "episodic",  # デフォルトはepisodic
                "content": memory.get('event', ''),
                "period": memory.get('period', '')
            }
            
            # 感情情報があれば関連付け
            if 'emotions' in memory:
                new_memory['associated_emotions'] = memory['emotions']
            
            # 重要度情報があれば追加
            if 'importance' in memory:
                new_memory['importance'] = memory['importance']
            
            memory_system['memories'].append(new_memory)
        
        new_profile['memory_system'] = memory_system
        print("✅ memory_traceをmemory_systemに変換しました")
    
    # cognitive_profileからcognitive_systemへの変換
    if 'cognitive_profile' in profile and 'cognitive_system' not in profile:
        cognitive_system = {
            "model": "WAIS-IV",
            "abilities": {
                "verbal_comprehension": {"level": 50},
                "perceptual_reasoning": {"level": 50},
                "working_memory": {"level": 50},
                "processing_speed": {"level": 50}
            },
            "general_ability": {"level": 50}
        }
        
        # レガシー形式から情報を抽出
        narrative = profile['cognitive_profile'].get('narrative', '')
        if narrative:
            cognitive_system['general_ability']['description'] = narrative
        
        # 検査結果があれば処理
        for test_result in profile['cognitive_profile'].get('test_results', []):
            if test_result.get('test_name') in ['WAIS-IV', 'WAIS-III', 'WISC']:
                scores = test_result.get('scores', {})
                # スコアがあれば対応する能力に変換
                for score_name, value in scores.items():
                    if 'verbal' in score_name.lower():
                        cognitive_system['abilities']['verbal_comprehension']['level'] = min(100, int(value))
                    elif 'perceptual' in score_name.lower() or 'visual' in score_name.lower():
                        cognitive_system['abilities']['perceptual_reasoning']['level'] = min(100, int(value))
                    elif 'memory' in score_name.lower() or 'working' in score_name.lower():
                        cognitive_system['abilities']['working_memory']['level'] = min(100, int(value))
                    elif 'processing' in score_name.lower() or 'speed' in score_name.lower():
                        cognitive_system['abilities']['processing_speed']['level'] = min(100, int(value))
                    elif 'fsiq' in score_name.lower() or 'full' in score_name.lower() or 'general' in score_name.lower():
                        cognitive_system['general_ability']['level'] = min(100, int(value))
        
        # 全体的な能力が設定されていなければ、平均を取る
        abilities = cognitive_system['abilities']
        ability_sum = sum(ability['level'] for ability in abilities.values())
        cognitive_system['general_ability']['level'] = ability_sum // 4
        
        new_profile['cognitive_system'] = cognitive_system
        print("✅ cognitive_profileをcognitive_systemに変換しました")
    
    # emotion_systemが無ければデフォルト作成
    if 'emotion_system' not in profile:
        # stateまたはcurrent_emotion_stateがあればそれを基に作成
        emotions = {}
        if 'current_emotion_state' in new_profile:
            for emotion, value in new_profile['current_emotion_state'].items():
                emotions[emotion] = {"baseline": value}
        elif 'state' in profile:
            for emotion, value in profile['state'].items():
                emotions[emotion] = {"baseline": value}
        
        # 基本的な感情が含まれていなければ追加
        if not emotions:
            emotions = {
                "joy": {"baseline": 50, "description": "喜び、幸福感"},
                "sadness": {"baseline": 30, "description": "悲しみ、失望感"},
                "anger": {"baseline": 25, "description": "怒り、いらだち"},
                "fear": {"baseline": 35, "description": "恐れ、不安"},
                "disgust": {"baseline": 20, "description": "嫌悪、不快感"},
                "surprise": {"baseline": 40, "description": "驚き、意外性への反応"}
            }
        
        new_profile['emotion_system'] = {
            "model": "Ekman",
            "emotions": emotions
        }
        print("✅ デフォルトのemotion_systemを作成しました")
    
    return new_profile

def main():
    """メイン処理"""
    if len(sys.argv) != 2:
        print(f"使用方法: {sys.argv[0]} profile.yaml")
        sys.exit(1)
    
    profile_path = sys.argv[1]
    schema_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "upps_schema.yaml")
    
    # スキーマファイルが見つからない場合は、カレントディレクトリか親ディレクトリから検索
    if not os.path.exists(schema_path):
        possible_paths = [
            "upps_schema.yaml",
            "../schema/upps_schema.yaml",
            "../specification/schema/upps_schema.yaml",
            "specification/schema/upps_schema.yaml"
        ]
        
        for path in possible_paths:
            if os.path.exists(path):
                schema_path = path
                break
        else:
            print("❌ UPPSスキーマファイル(upps_schema.yaml)が見つかりません")
            sys.exit(1)
    
    print(f"プロファイル: {profile_path}")
    print(f"スキーマ: {schema_path}")
    print("=" * 50)
    
    # ファイル読み込み
    profile = load_yaml(profile_path)
    schema = load_yaml(schema_path)
    
    # バージョン情報の表示
    print(f"UPPSスキーマ検証ツール v{schema.get('Version', '不明')}")
    print("=" * 50)
    
    # プロファイルの基本情報を表示
    if 'personal_info' in profile and 'name' in profile['personal_info']:
        print(f"プロファイル名: {profile['personal_info']['name']}")
    
    print("\n【検証開始】")
    
    # 構文検証
    print("\n1. 構文検証")
    print("-" * 30)
    # YAMLとして正常に読み込めているので構文は正常
    print("✅ YAML構文: 正常")
    
    # スキーマ検証
    print("\n2. スキーマ検証")
    print("-" * 30)
    schema_valid = validate_schema(profile, schema)
    
    # 参照整合性検証
    print("\n3. 参照整合性検証")
    print("-" * 30)
    ref_valid = validate_references(profile)
    
    # プロファイル一貫性検証
    print("\n4. 一貫性検証")
    print("-" * 30)
    consistency_valid = validate_consistency(profile)
    
    # レガシー形式から拡張モデルへの変換オプション
    is_legacy = ('state' in profile and 'current_emotion_state' not in profile) or \
                ('memory_trace' in profile and 'memory_system' not in profile) or \
                ('cognitive_profile' in profile and 'cognitive_system' not in profile)
    
    if is_legacy:
        print("\n5. レガシー形式の検出")
        print("-" * 30)
        print("⚠️ レガシー形式のフィールドが検出されました")
        print("レガシーフィールドを拡張モデル形式に変換しますか？ (y/n)")
        choice = input().strip().lower()
        
        if choice == 'y':
            new_profile = convert_legacy_to_extended(profile)
            new_file_path = profile_path.replace('.yaml', '_extended.yaml')
            
            with open(new_file_path, 'w', encoding='utf-8') as f:
                yaml.dump(new_profile, f, allow_unicode=True, sort_keys=False, default_flow_style=False)
            
            print(f"\n✅ 拡張モデル形式に変換し、{new_file_path}に保存しました")
    
    # 検証結果サマリー
    print("\n【検証結果サマリー】")
    print("=" * 50)
    if schema_valid and ref_valid and consistency_valid:
        print("✅ すべての検証に合格しました！")
    else:
        print("⚠️ 一部の検証で問題が見つかりました。上記の警告を確認してください。")

if __name__ == "__main__":
    main()

                    if abs(ability['level']