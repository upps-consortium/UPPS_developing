#!/usr/bin/env python3
"""
UPPS Converter Tool (レガシー→拡張モデル変換ツール)
Version: 2025.3 v1.0.0

このスクリプトは、レガシー形式のUPPSプロファイルを拡張モデル形式に変換します。
- state → current_emotion_state + emotion_system
- memory_trace → memory_system
- cognitive_profile → cognitive_system

使用方法:
  python upps_converter.py [プロファイルのパス]

必要なパッケージ:
  - pyyaml
"""

import sys
import os
import yaml
import re
from pathlib import Path
from typing import Dict, List, Any, Tuple, Set

def load_yaml(file_path: str) -> Dict:
    """YAMLファイルを読み込む"""
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            return yaml.safe_load(file)
    except Exception as e:
        print(f"エラー: YAMLファイルの読み込みに失敗しました: {e}")
        sys.exit(1)

def save_yaml(file_path: str, data: Dict) -> None:
    """YAMLファイルに保存する"""
    try:
        with open(file_path, 'w', encoding='utf-8') as file:
            yaml.dump(data, file, allow_unicode=True, sort_keys=False, default_flow_style=False)
        print(f"✅ ファイルを保存しました: {file_path}")
    except Exception as e:
        print(f"エラー: YAMLファイルの保存に失敗しました: {e}")
        sys.exit(1)

def slugify(text: str) -> str:
    """文字列をスラッグ化（URL friendly IDに変換）する"""
    # 英数字以外を削除し、スペースをアンダースコアに置換
    slug = re.sub(r'[^\w\s]', '', text.lower())
    slug = re.sub(r'\s+', '_', slug.strip())
    # 先頭が数字の場合は'id_'を付ける
    if slug and slug[0].isdigit():
        slug = 'id_' + slug
    return slug[:30]  # 30文字までに制限

def convert_state_to_emotion_system(profile: Dict) -> Dict:
    """stateをemotion_systemとcurrent_emotion_stateに変換"""
    new_profile = profile.copy()
    
    # stateがあるか確認
    if 'state' not in profile:
        print("⚠️ stateフィールドが見つかりません")
        return new_profile
    
    # current_emotion_stateが既に存在するか確認
    if 'current_emotion_state' in profile:
        print("⚠️ current_emotion_stateフィールドが既に存在します。変換をスキップします")
        return new_profile
    
    # stateをcurrent_emotion_stateにコピー
    new_profile['current_emotion_state'] = profile['state'].copy()
    
    # emotion_systemが既に存在するか確認
    if 'emotion_system' in profile:
        print("⚠️ emotion_systemフィールドが既に存在します。既存の定義を使用します")
        return new_profile
    
    # stateからemotion_systemを作成
    emotions = {}
    for emotion, value in profile['state'].items():
        emotions[emotion] = {
            "baseline": value,
            "description": get_emotion_description(emotion)
        }
    
    # 基本的なEkman感情が含まれていなければ追加
    ekman_emotions = {
        "joy": "喜び、幸福感",
        "sadness": "悲しみ、失望感",
        "anger": "怒り、いらだち",
        "fear": "恐れ、不安",
        "disgust": "嫌悪、不快感",
        "surprise": "驚き、意外性への反応"
    }
    
    for emotion, description in ekman_emotions.items():
        if emotion not in emotions:
            # 既存の感情からbaselineを推測
            if 'happy' in profile['state'] and emotion == 'joy':
                baseline = profile['state']['happy']
            elif 'sad' in profile['state'] and emotion == 'sadness':
                baseline = profile['state']['sad']
            elif 'angry' in profile['state'] and emotion == 'anger':
                baseline = profile['state']['angry']
            elif 'fearful' in profile['state'] and emotion == 'fear':
                baseline = profile['state']['fearful']
            elif 'disgusted' in profile['state'] and emotion == 'disgust':
                baseline = profile['state']['disgusted']
            elif 'surprised' in profile['state'] and emotion == 'surprise':
                baseline = profile['state']['surprised']
            else:
                # デフォルト値
                baseline = 50 if emotion == 'joy' else 30
            
            emotions[emotion] = {
                "baseline": baseline,
                "description": description
            }
    
    # emotion_systemの作成
    new_profile['emotion_system'] = {
        "model": "Ekman",
        "emotions": emotions
    }
    
    print("✅ stateをemotion_systemとcurrent_emotion_stateに変換しました")
    return new_profile

def get_emotion_description(emotion: str) -> str:
    """感情名から説明文を生成する"""
    emotion_descriptions = {
        "joy": "喜び、幸福感",
        "happiness": "幸福感、満足感",
        "happy": "幸福感、満足感",
        "sadness": "悲しみ、失望感",
        "sad": "悲しみ、失望感",
        "anger": "怒り、いらだち",
        "angry": "怒り、いらだち",
        "fear": "恐れ、不安",
        "fearful": "恐れ、不安",
        "afraid": "恐れ、不安",
        "disgust": "嫌悪、不快感",
        "disgusted": "嫌悪、不快感",
        "surprise": "驚き、意外性への反応",
        "surprised": "驚き、意外性への反応",
        "calm": "落ち着き、平静さ",
        "excited": "興奮、高揚感",
        "anxious": "不安、心配",
        "anxiety": "不安、心配",
        "tired": "疲労感、倦怠感",
        "fatigue": "疲労感、消耗",
        "curious": "好奇心、興味",
        "curiosity": "好奇心、知的探究心",
        "proud": "誇り、達成感",
        "pride": "誇り、プライド",
        "ashamed": "恥じらい、羞恥心",
        "shame": "恥辱感、罪悪感",
        "guilty": "罪悪感、自責の念",
        "guilt": "罪の意識、後悔",
        "jealous": "嫉妬、羨望",
        "jealousy": "嫉妬心、羨望",
        "love": "愛情、親愛の情",
        "hate": "憎しみ、敵意",
        "nostalgic": "懐かしさ、郷愁",
        "nostalgia": "郷愁、過去への思慕",
        "confused": "混乱、当惑",
        "confusion": "混乱、理解の欠如",
        "grateful": "感謝の気持ち、謝意",
        "gratitude": "感謝の念、恩義",
        "hopeful": "希望、期待感",
        "hope": "希望、期待",
        "disappointed": "失望、落胆",
        "disappointment": "失望感、期待外れ",
        "satisfied": "満足感、充足感",
        "satisfaction": "満足、充足",
        "frustrated": "欲求不満、いらだち",
        "frustration": "欲求不満、挫折感"
    }
    
    return emotion_descriptions.get(emotion.lower(), f"{emotion}の感情")

def convert_memory_trace_to_memory_system(profile: Dict) -> Dict:
    """memory_traceをmemory_systemに変換"""
    new_profile = profile.copy()
    
    # memory_traceがあるか確認
    if 'memory_trace' not in profile:
        print("⚠️ memory_traceフィールドが見つかりません")
        return new_profile
    
    # memory_systemが既に存在するか確認
    if 'memory_system' in profile:
        print("⚠️ memory_systemフィールドが既に存在します。変換をスキップします")
        return new_profile
    
    # memory_systemの作成
    memory_system = {"memories": []}
    
    for i, memory in enumerate(profile['memory_trace'].get('memories', [])):
        # memory_idの生成
        if 'event' in memory and memory['event']:
            memory_id = slugify(memory['event'])
            if not memory_id:
                memory_id = f"memory_{i+1}"
        else:
            memory_id = f"memory_{i+1}"
        
        # 新しい記憶オブジェクトの作成
        new_memory = {
            "id": memory_id,
            "type": "episodic",  # デフォルトタイプ
            "content": memory.get('event', '')
        }
        
        # 期間情報があれば追加
        if 'period' in memory:
            new_memory["period"] = memory['period']
        
        # 感情情報があれば変換
        if 'emotions' in memory:
            new_memory["associated_emotions"] = memory['emotions']
            
            # 感情的価値の判定（ポジティブかネガティブか）
            positive_emotions = ['joy', 'happy', 'happiness', 'calm', 'excited', 'curious', 'proud', 'love', 'grateful', 'hopeful', 'satisfied']
            negative_emotions = ['sadness', 'sad', 'anger', 'angry', 'fear', 'fearful', 'afraid', 'disgust', 'disgusted', 'anxious', 'tired', 'ashamed', 'guilty', 'jealous', 'hate', 'confused', 'disappointed', 'frustrated']
            
            pos_count = sum(1 for e in memory['emotions'] if e.lower() in positive_emotions)
            neg_count = sum(1 for e in memory['emotions'] if e.lower() in negative_emotions)
            
            if pos_count > neg_count:
                new_memory["emotional_valence"] = "positive"
            elif neg_count > pos_count:
                new_memory["emotional_valence"] = "negative"
            elif pos_count > 0 and neg_count > 0:
                new_memory["emotional_valence"] = "mixed"
            else:
                new_memory["emotional_valence"] = "neutral"
        
        # 重要度があれば追加
        if 'importance' in memory:
            new_memory["importance"] = memory['importance']
        
        # 関連記憶があれば追加
        if 'related_memories' in memory:
            # ここでは関連記憶の変換は行わない（IDが変わるため）
            pass
        
        memory_system['memories'].append(new_memory)
    
    new_profile['memory_system'] = memory_system
    print(f"✅ memory_traceを{len(memory_system['memories'])}件の記憶を持つmemory_systemに変換しました")
    
    return new_profile

def convert_cognitive_profile_to_cognitive_system(profile: Dict) -> Dict:
    """cognitive_profileをcognitive_systemに変換"""
    new_profile = profile.copy()
    
    # cognitive_profileがあるか確認
    if 'cognitive_profile' not in profile:
        print("⚠️ cognitive_profileフィールドが見つかりません")
        return new_profile
    
    # cognitive_systemが既に存在するか確認
    if 'cognitive_system' in profile:
        print("⚠️ cognitive_systemフィールドが既に存在します。変換をスキップします")
        return new_profile
    
    # デフォルトのcognitive_systemを作成
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
    
    # 説明文があれば追加
    if 'narrative' in profile['cognitive_profile']:
        cognitive_system['general_ability']['description'] = profile['cognitive_profile']['narrative']
    
    # 検査結果があれば処理
    if 'test_results' in profile['cognitive_profile']:
        for test in profile['cognitive_profile']['test_results']:
            if 'test_name' in test and 'scores' in test:
                # WAISタイプの検査結果を探す
                if any(wais in test['test_name'].upper() for wais in ['WAIS', 'WISC', 'IQ']):
                    scores = test['scores']
                    
                    # スコアを対応する能力に変換
                    for score_name, value in scores.items():
                        score_name_lower = score_name.lower()
                        
                        # 適切な変換先を決定
                        if any(verbal in score_name_lower for verbal in ['vci', 'verbal', 'comprehension', 'vocabulary']):
                            cognitive_system['abilities']['verbal_comprehension']['level'] = min(100, int(value))
                        
                        elif any(perceptual in score_name_lower for perceptual in ['pri', 'psi', 'perceptual', 'reasoning', 'visual', 'spatial']):
                            cognitive_system['abilities']['perceptual_reasoning']['level'] = min(100, int(value))
                        
                        elif any(memory in score_name_lower for memory in ['wmi', 'working', 'memory']):
                            cognitive_system['abilities']['working_memory']['level'] = min(100, int(value))
                        
                        elif any(speed in score_name_lower for speed in ['psi', 'processing', 'speed']):
                            cognitive_system['abilities']['processing_speed']['level'] = min(100, int(value))
                        
                        elif any(general in score_name_lower for general in ['fsiq', 'full', 'global', 'general', 'iq']):
                            cognitive_system['general_ability']['level'] = min(100, int(value))
    
    # 平均値の計算
    abilities = cognitive_system['abilities']
    ability_levels = [ability['level'] for ability in abilities.values()]
    average_level = sum(ability_levels) // len(ability_levels)
    
    # general_abilityが設定されていなければ、平均を設定
    if cognitive_system['general_ability']['level'] == 50:
        cognitive_system['general_ability']['level'] = average_level
    
    # 各能力に説明を追加
    descriptions = {
        "verbal_comprehension": "言語的概念の理解と表現能力",
        "perceptual_reasoning": "視覚的・空間的情報の処理と分析能力",
        "working_memory": "情報の短期的保持と操作能力",
        "processing_speed": "単純な視覚情報の迅速な処理能力"
    }
    
    for ability, desc in descriptions.items():
        if 'description' not in cognitive_system['abilities'][ability]:
            cognitive_system['abilities'][ability]['description'] = desc
    
    new_profile['cognitive_system'] = cognitive_system
    print("✅ cognitive_profileをcognitive_systemに変換しました")
    
    return new_profile

def create_association_system(profile: Dict) -> Dict:
    """memory_systemとemotion_systemから基本的なassociation_systemを作成"""
    new_profile = profile.copy()
    
    # 必要なシステムが揃っているか確認
    if 'memory_system' not in new_profile or 'emotion_system' not in new_profile:
        print("⚠️ memory_systemまたはemotion_systemがありません。association_systemの作成をスキップします")
        return new_profile
    
    # association_systemが既に存在するか確認
    if 'association_system' in new_profile:
        print("⚠️ association_systemフィールドが既に存在します。作成をスキップします")
        return new_profile
    
    # メモリと感情のIDを収集
    memory_ids = []
    for memory in new_profile['memory_system']['memories']:
        if 'id' in memory:
            memory_ids.append(memory['id'])
    
    emotion_ids = []
    emotion_ids.extend(new_profile['emotion_system'].get('emotions', {}).keys())
    emotion_ids.extend(new_profile['emotion_system'].get('additional_emotions', {}).keys())
    
    if not memory_ids or not emotion_ids:
        print("⚠️ メモリまたは感情のIDが見つかりません。association_systemの作成をスキップします")
        return new_profile
    
    # 基本的な関連性を作成
    associations = []
    
    # 各記憶に対して処理
    for memory in new_profile['memory_system']['memories']:
        # 関連する感情があれば処理
        if 'associated_emotions' in memory and memory['associated_emotions']:
            for emotion in memory['associated_emotions']:
                if emotion in emotion_ids:
                    # 記憶→感情の関連
                    associations.append({
                        "trigger": {
                            "type": "memory",
                            "id": memory['id']
                        },
                        "response": {
                            "type": "emotion",
                            "id": emotion,
                            "association_strength": 70  # デフォルト強度
                        }
                    })
                    
                    # 感情→記憶の関連（閾値付き）
                    associations.append({
                        "trigger": {
                            "type": "emotion",
                            "id": emotion,
                            "threshold": 60  # デフォルト閾値
                        },
                        "response": {
                            "type": "memory",
                            "id": memory['id'],
                            "association_strength": 65  # デフォルト強度
                        }
                    })
        
        # 外部トリガー→記憶の関連
        if 'content' in memory and memory['content']:
            # 記憶内容から重要な単語を抽出（単純な方法）
            content = memory['content']
            words = re.findall(r'\b\w{4,}\b', content.lower())  # 4文字以上の単語を抽出
            
            # ストップワードの除外
            stopwords = ['this', 'that', 'these', 'those', 'when', 'where', 'which', 'while', 'with', 'would', 'could', 'should']
            filtered_words = [word for word in words if word not in stopwords]
            
            # 最大5単語を選択
            selected_words = filtered_words[:5] if filtered_words else []
            
            if selected_words:
                associations.append({
                    "trigger": {
                        "type": "external",
                        "category": "topics",
                        "items": selected_words
                    },
                    "response": {
                        "type": "memory",
                        "id": memory['id'],
                        "association_strength": 75  # デフォルト強度
                    }
                })
    
    # 少なくとも一つの関連が作成されていれば追加
    if associations:
        new_profile['association_system'] = {
            "associations": associations
        }
        print(f"✅ {len(associations)}件の関連を持つassociation_systemを作成しました")
    else:
        print("⚠️ 関連を作成できませんでした。association_systemの作成をスキップします")
    
    return new_profile

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
    
    print("UPPSレガシー→拡張モデル変換ツール v2025.3 v1.0.0")
    print("=" * 50)
    
    # プロファイルの基本情報を表示
    if 'personal_info' in profile and 'name' in profile['personal_info']:
        print(f"プロファイル名: {profile['personal_info']['name']}")
    
    print("\n【変換開始】")
    
    # 変換処理
    print("\n1. stateの変換")
    print("-" * 30)
    profile = convert_state_to_emotion_system(profile)
    
    print("\n2. memory_traceの変換")
    print("-" * 30)
    profile = convert_memory_trace_to_memory_system(profile)
    
    print("\n3. cognitive_profileの変換")
    print("-" * 30)
    profile = convert_cognitive_profile_to_cognitive_system(profile)
    
    print("\n4. association_systemの作成")
    print("-" * 30)
    profile = create_association_system(profile)
    
    # 変換結果の保存
    print("\n【変換完了】")
    print("=" * 50)
    
    output_path = profile_path.replace('.yaml', '_extended.yaml')
    if output_path == profile_path:
        output_path = os.path.splitext(profile_path)[0] + '_extended.yaml'
    
    save_yaml(output_path, profile)
    
    print("\n変換サマリー:")
    if 'emotion_system' in profile:
        emotions_count = len(profile['emotion_system'].get('emotions', {}))
        additional_count = len(profile['emotion_system'].get('additional_emotions', {}))
        print(f"- emotion_system: {emotions_count}個の基本感情と{additional_count}個の追加感情")
    
    if 'memory_system' in profile:
        memories_count = len(profile['memory_system'].get('memories', []))
        print(f"- memory_system: {memories_count}個の記憶")
    
    if 'association_system' in profile:
        associations_count = len(profile['association_system'].get('associations', []))
        print(f"- association_system: {associations_count}個の関連性")
    
    if 'cognitive_system' in profile:
        print(f"- cognitive_system: 4つの能力と全体的な能力レベル")
    
    print("\n完了しました！")

if __name__ == "__main__":
    main()
