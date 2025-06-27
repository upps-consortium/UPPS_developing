#!/usr/bin/env python3
"""
UPPS Reference Validator Tool (リファレンス整合性検証ツール)
Version: 2025.3 v1.0.0

このスクリプトは、UPPSプロファイル内の参照整合性を検証します。
- emotion_systemとcurrent_emotion_stateの整合性
- memory_systemとassociation_systemの整合性
- 関連性ネットワークのID参照の有効性

使用方法:
  python upps_reference_validator.py [プロファイルのパス]

必要なパッケージ:
  - pyyaml
"""

import sys
import os
import yaml
from typing import Dict, List, Any, Tuple, Set

def load_yaml(file_path: str) -> Dict:
    """YAMLファイルを読み込む"""
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            return yaml.safe_load(file)
    except Exception as e:
        print(f"エラー: YAMLファイルの読み込みに失敗しました: {e}")
        sys.exit(1)

def validate_emotion_references(profile: Dict) -> bool:
    """感情参照の整合性を検証"""
    valid = True
    
    # 感情システムの確認
    if 'emotion_system' not in profile:
        print("⚠️ emotion_systemフィールドが見つかりません。感情参照検証をスキップします")
        return True
    
    # 感情IDの収集
    emotion_ids = set()
    emotion_ids.update(profile['emotion_system'].get('emotions', {}).keys())
    emotion_ids.update(profile['emotion_system'].get('additional_emotions', {}).keys())
    emotion_ids.update(profile['emotion_system'].get('compound_emotions', {}).keys())
    
    # current_emotion_stateの検証
    if 'current_emotion_state' in profile:
        for emotion_id in profile['current_emotion_state'].keys():
            if emotion_id not in emotion_ids:
                print(f"❌ current_emotion_stateで参照されている感情 '{emotion_id}' はemotion_systemで定義されていません")
                valid = False
    
    # 記憶システムの感情参照の検証
    if 'memory_system' in profile:
        for i, memory in enumerate(profile['memory_system'].get('memories', [])):
            if 'associated_emotions' in memory:
                for emotion_id in memory['associated_emotions']:
                    if emotion_id not in emotion_ids:
                        print(f"❌ 記憶ID '{memory.get('id', f'memory_{i}')}' の関連感情 '{emotion_id}' はemotion_systemで定義されていません")
                        valid = False
    
    if valid:
        print("✅ 感情参照の検証: 成功")
    
    return valid

def validate_memory_references(profile: Dict) -> bool:
    """記憶参照の整合性を検証"""
    valid = True
    
    # 記憶システムの確認
    if 'memory_system' not in profile:
        print("⚠️ memory_systemフィールドが見つかりません。記憶参照検証をスキップします")
        return True
    
    # 記憶IDの収集
    memory_ids = set()
    for memory in profile['memory_system'].get('memories', []):
        if 'id' in memory:
            memory_ids.add(memory['id'])
    
    # 記憶IDの重複チェック
    id_counts = {}
    for memory in profile['memory_system'].get('memories', []):
        if 'id' in memory:
            id_counts[memory['id']] = id_counts.get(memory['id'], 0) + 1
    
    for memory_id, count in id_counts.items():
        if count > 1:
            print(f"❌ 記憶ID '{memory_id}' が複数回（{count}回）定義されています")
            valid = False
    
    if valid:
        print("✅ 記憶参照の検証: 成功")
    
    return valid

def validate_association_references(profile: Dict) -> bool:
    """関連性ネットワークの参照整合性を検証"""
    valid = True
    
    # 関連性ネットワークの確認
    if 'association_system' not in profile:
        print("⚠️ association_systemフィールドが見つかりません。関連性参照検証をスキップします")
        return True
    
    # 感情IDと記憶IDの収集
    emotion_ids = set()
    if 'emotion_system' in profile:
        emotion_ids.update(profile['emotion_system'].get('emotions', {}).keys())
        emotion_ids.update(profile['emotion_system'].get('additional_emotions', {}).keys())
        emotion_ids.update(profile['emotion_system'].get('compound_emotions', {}).keys())
    
    memory_ids = set()
    if 'memory_system' in profile:
        for memory in profile['memory_system'].get('memories', []):
            if 'id' in memory:
                memory_ids.add(memory['id'])
    
    # 関連性の検証
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
        print("✅ 関連性参照の検証: 成功")
    
    return valid

def validate_cognitive_system(profile: Dict) -> bool:
    """認知能力システムの整合性を検証"""
    valid = True
    
    # 認知能力システムの確認
    if 'cognitive_system' not in profile:
        print("⚠️ cognitive_systemフィールドが見つかりません。認知能力検証をスキップします")
        return True
    
    # 必須フィールドの確認
    if 'model' not in profile['cognitive_system']:
        print("❌ cognitive_systemにmodelフィールドがありません")
        valid = False
    
    if 'abilities' not in profile['cognitive_system']:
        print("❌ cognitive_systemにabilitiesフィールドがありません")
        valid = False
        return valid  # abilitiesがなければこれ以上検証できない
    
    # 必須能力の確認
    required_abilities = ['verbal_comprehension', 'perceptual_reasoning', 'working_memory', 'processing_speed']
    for ability in required_abilities:
        if ability not in profile['cognitive_system']['abilities']:
            print(f"❌ cognitive_systemのabilities内に'{ability}'能力がありません")
            valid = False
        elif 'level' not in profile['cognitive_system']['abilities'][ability]:
            print(f"❌ cognitive_systemの'{ability}'能力にlevelフィールドがありません")
            valid = False
    
    # general_abilityフィールドの確認
    if 'general_ability' in profile['cognitive_system']:
        if 'level' not in profile['cognitive_system']['general_ability']:
            print("❌ cognitive_systemのgeneral_abilityにlevelフィールドがありません")
            valid = False
        
        # 値の一貫性の検証
        if 'level' in profile['cognitive_system']['general_ability']:
            general_level = profile['cognitive_system']['general_ability']['level']
            ability_levels = []
            
            for ability in required_abilities:
                if ability in profile['cognitive_system']['abilities'] and 'level' in profile['cognitive_system']['abilities'][ability]:
                    ability_level = profile['cognitive_system']['abilities'][ability]['level']
                    ability_levels.append(ability_level)
                    
                    # 極端な不一致の確認（30以上の差）
                    if abs(general_level - ability_level) > 30:
                        print(f"⚠️ general_ability ({general_level})と{ability} ({ability_level})の値に大きな差があります")
            
            # 平均との比較
            if ability_levels:
                avg_level = sum(ability_levels) / len(ability_levels)
                if abs(general_level - avg_level) > 20:
                    print(f"⚠️ general_ability ({general_level})が個別能力の平均値 ({avg_level:.1f})と大きく異なります")
    else:
        print("⚠️ cognitive_systemにgeneral_abilityフィールドがありません")
    
    if valid:
        print("✅ 認知能力システムの検証: 成功")
    
    return valid

def main():
    """メイン処理"""
    if len(sys.argv) != 2:
        print(f"使用方法: {sys.argv[0]} profile.yaml")
        sys.exit(1)
    
    profile_path = sys.argv[1]
    
    print(f"プロファイル: {profile_path}")
    print("=" * 50)
    
    # ファイル読み込み
    profile = load_yaml(profile_path)
    
    print("UPPSリファレンス整合性検証ツール v2025.3 v1.0.0")
    print("=" * 50)
    
    # プロファイルの基本情報を表示
    if 'personal_info' in profile and 'name' in profile['personal_info']:
        print(f"プロファイル名: {profile['personal_info']['name']}")
    
    print("\n【検証開始】")
    
    # 感情参照の検証
    print("\n1. 感情参照の検証")
    print("-" * 30)
    emotion_valid = validate_emotion_references(profile)
    
    # 記憶参照の検証
    print("\n2. 記憶参照の検証")
    print("-" * 30)
    memory_valid = validate_memory_references(profile)
    
    # 関連性参照の検証
    print("\n3. 関連性参照の検証")
    print("-" * 30)
    association_valid = validate_association_references(profile)
    
    # 認知能力システムの検証
    print("\n4. 認知能力システムの検証")
    print("-" * 30)
    cognitive_valid = validate_cognitive_system(profile)
    
    # 検証結果サマリー
    print("\n【検証結果サマリー】")
    print("=" * 50)
    if emotion_valid and memory_valid and association_valid and cognitive_valid:
        print("✅ すべての参照整合性検証に合格しました！")
    else:
        print("⚠️ 一部の検証で問題が見つかりました。上記の警告を確認してください。")
    
    # 統計情報の表示
    print("\n【プロファイル統計】")
    print("-" * 30)
    
    if 'emotion_system' in profile:
        emotions_count = len(profile['emotion_system'].get('emotions', {}))
        additional_count = len(profile['emotion_system'].get('additional_emotions', {}))
        compound_count = len(profile['emotion_system'].get('compound_emotions', {}))
        print(f"感情: {emotions_count}個の基本感情、{additional_count}個の追加感情、{compound_count}個の複合感情")
    
    if 'memory_system' in profile:
        memories_count = len(profile['memory_system'].get('memories', []))
        episodic_count = sum(1 for m in profile['memory_system'].get('memories', []) if m.get('type') == 'episodic')
        semantic_count = sum(1 for m in profile['memory_system'].get('memories', []) if m.get('type') == 'semantic')
        procedural_count = sum(1 for m in profile['memory_system'].get('memories', []) if m.get('type') == 'procedural')
        autobiographical_count = sum(1 for m in profile['memory_system'].get('memories', []) if m.get('type') == 'autobiographical')
        print(f"記憶: 合計{memories_count}個（エピソード記憶: {episodic_count}、意味記憶: {semantic_count}、手続き記憶: {procedural_count}、自伝的記憶: {autobiographical_count}）")
    
    if 'association_system' in profile:
        associations_count = len(profile['association_system'].get('associations', []))
        memory_to_emotion = sum(1 for a in profile['association_system'].get('associations', []) 
                               if a.get('trigger', {}).get('type') == 'memory' and a.get('response', {}).get('type') == 'emotion')
        emotion_to_memory = sum(1 for a in profile['association_system'].get('associations', []) 
                               if a.get('trigger', {}).get('type') == 'emotion' and a.get('response', {}).get('type') == 'memory')
        external_triggers = sum(1 for a in profile['association_system'].get('associations', []) 
                               if a.get('trigger', {}).get('type') == 'external')
        compound_triggers = sum(1 for a in profile['association_system'].get('associations', []) 
                               if 'operator' in a.get('trigger', {}))
        print(f"関連性: 合計{associations_count}個（記憶→感情: {memory_to_emotion}、感情→記憶: {emotion_to_memory}、外部トリガー: {external_triggers}、複合トリガー: {compound_triggers}）")
    
    if 'cognitive_system' in profile:
        abilities = profile['cognitive_system'].get('abilities', {})
        if all(ability in abilities and 'level' in abilities[ability] for ability in ['verbal_comprehension', 'perceptual_reasoning', 'working_memory', 'processing_speed']):
            vc = abilities['verbal_comprehension']['level']
            pr = abilities['perceptual_reasoning']['level']
            wm = abilities['working_memory']['level']
            ps = abilities['processing_speed']['level']
            print(f"認知能力: VC: {vc}, PR: {pr}, WM: {wm}, PS: {ps}")
            
            if 'general_ability' in profile['cognitive_system'] and 'level' in profile['cognitive_system']['general_ability']:
                general = profile['cognitive_system']['general_ability']['level']
                print(f"全体的能力: {general}")

if __name__ == "__main__":
    main()
