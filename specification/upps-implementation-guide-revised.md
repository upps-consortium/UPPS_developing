    prompt += "## 感情システム\n"
    prompt += json.dumps(emotion_system, ensure_ascii=False, indent=2)
    prompt += "\n\n"
    
    prompt += "## 記憶システム\n"
    prompt += json.dumps(memory_system, ensure_ascii=False, indent=2)
    prompt += "\n\n"
    
    prompt += "## 認知能力システム\n"
    prompt += json.dumps(cognitive_system, ensure_ascii=False, indent=2)
    prompt += "\n\n"
    
    prompt += "## 現在の感情状態\n"
    prompt += json.dumps(current_state, ensure_ascii=False, indent=2)
    prompt += "\n\n"
    
    prompt += "## ルール\n"
    prompt += "1. プロファイルの人格として一貫して応答する\n"
    prompt += "2. 感情システムの感情状態を反映した対話をする\n"
    prompt += "3. 関連するキーワードが出てきたら記憶を想起する\n"
    prompt += "4. 認知能力レベルに応じた表現を使用する\n"
    prompt += "5. 各応答の最後に【状態】セクションで現在の感情状態を表示する\n"
    prompt += "6. 感情状態は対話内容に応じて自然に変化させる\n"
    
    return prompt

# Gemini APIの呼び出し
def chat_with_gemini(profile, current_emotions, user_message):
    prompt = create_gemini_prompt(profile, current_emotions)
    
    # Gemini APIは実際には異なる形式になりますが、概念的な例として
    response = gemini.generate_content(
        model="gemini-pro",
        prompt=prompt + "\n\n" + user_message
    )
    
    return response.text
```

## 5. 感情システムの実装

### 5.1 感情状態の初期化と管理

感情状態を効果的に管理するためのクラス実装例：

```python
class EmotionSystem:
    def __init__(self, emotion_system_data):
        self.model = emotion_system_data.get('model', 'Custom')
        self.emotions = {}
        
        # 基本感情の初期化
        for emotion, data in emotion_system_data.get('emotions', {}).items():
            self.emotions[emotion] = data.get('baseline', 50)
        
        # 追加感情の初期化
        for emotion, data in emotion_system_data.get('additional_emotions', {}).items():
            self.emotions[emotion] = data.get('baseline', 50)
        
        # 感情の説明情報の保存
        self.descriptions = {}
        for emotion, data in emotion_system_data.get('emotions', {}).items():
            self.descriptions[emotion] = data.get('description', '')
        
        for emotion, data in emotion_system_data.get('additional_emotions', {}).items():
            self.descriptions[emotion] = data.get('description', '')
    
    def get_current_state(self):
        """現在の感情状態を取得"""
        return self.emotions.copy()
    
    def update_emotion(self, emotion, change):
        """感情値を更新（0-100の範囲内に制限）"""
        if emotion in self.emotions:
            self.emotions[emotion] = max(0, min(100, self.emotions[emotion] + change))
        else:
            # 未定義の感情の場合は追加（デフォルト値50から開始）
            self.emotions[emotion] = max(0, min(100, 50 + change))
    
    def update_emotions(self, updates):
        """複数の感情を一度に更新"""
        for emotion, change in updates.items():
            self.update_emotion(emotion, change)
    
    def get_dominant_emotions(self, threshold=70):
        """閾値以上の強い感情を取得"""
        return {emotion: value for emotion, value in self.emotions.items() 
                if value >= threshold}
    
    def get_weak_emotions(self, threshold=30):
        """閾値以下の弱い感情を取得"""
        return {emotion: value for emotion, value in self.emotions.items() 
                if value <= threshold}
    
    def reset_to_baseline(self, emotion_system_data):
        """感情をベースライン値にリセット"""
        for emotion, data in emotion_system_data.get('emotions', {}).items():
            self.emotions[emotion] = data.get('baseline', 50)
        
        for emotion, data in emotion_system_data.get('additional_emotions', {}).items():
            self.emotions[emotion] = data.get('baseline', 50)
```

### 5.2 感情更新ルールの実装

対話内容に基づいて感情を更新するルールセットの実装例：

```python
class EmotionRules:
    def __init__(self):
        # 基本的な感情更新ルール
        self.basic_rules = {
            'positive_topic': {'joy': 10, 'fear': -5},
            'negative_topic': {'sadness': 10, 'fear': 5, 'joy': -10},
            'exciting_topic': {'surprise': 15, 'joy': 5},
            'personal_question': {'fear': 10, 'trust': -5},
            'intellectual_topic': {'curiosity': 15, 'joy': 5},
            'emotional_topic': {'emotionally_sensitive': 10}
        }
        
        # キーワードに基づくトピック検出ルール
        self.topic_keywords = {
            'positive_topic': ['happy', 'exciting', 'good news', 'success', 'achievement'],
            'negative_topic': ['sad', 'worried', 'bad news', 'failure', 'problem'],
            'exciting_topic': ['surprise', 'unexpected', 'amazing', 'incredible'],
            'personal_question': ['you', 'your', 'yourself', 'personal', 'private'],
            'intellectual_topic': ['research', 'science', 'study', 'learn', 'book'],
            'emotional_topic': ['feel', 'emotion', 'heart', 'love', 'relationship']
        }
    
    def detect_topics(self, message):
        """メッセージからトピックを検出"""
        detected_topics = set()
        
        message_lower = message.lower()
        for topic, keywords in self.topic_keywords.items():
            for keyword in keywords:
                if keyword.lower() in message_lower:
                    detected_topics.add(topic)
                    break
        
        return detected_topics
    
    def get_emotion_updates(self, message):
        """メッセージから感情更新値を取得"""
        detected_topics = self.detect_topics(message)
        
        emotion_updates = {}
        for topic in detected_topics:
            if topic in self.basic_rules:
                for emotion, change in self.basic_rules[topic].items():
                    if emotion in emotion_updates:
                        emotion_updates[emotion] += change
                    else:
                        emotion_updates[emotion] = change
        
        return emotion_updates
```

### 5.3 感情状態の抽出

LLMの応答から感情状態を抽出するためのユーティリティ関数：

```python
import re

def extract_emotion_state(response_text):
    """LLMの応答から感情状態セクションを抽出"""
    # 【状態】セクションのパターンマッチング
    state_pattern = r"【状態】\s*([\s\S]*?)(?=\n\n|$)"
    state_match = re.search(state_pattern, response_text)
    
    if not state_match:
        return None
    
    state_text = state_match.group(1)
    
    # 感情値の抽出パターン (例: joy: 70)
    emotion_pattern = r"(\w+)\s*:\s*(\d+)"
    emotion_matches = re.findall(emotion_pattern, state_text)
    
    extracted_state = {}
    for emotion, value in emotion_matches:
        extracted_state[emotion] = int(value)
    
    return extracted_state
```

## 6. 記憶システムの実装

### 6.1 記憶管理クラス

記憶システムを管理するためのクラス実装例：

```python
class MemorySystem:
    def __init__(self, memory_system_data):
        # 記憶のリストを初期化
        self.memories = {}
        for memory in memory_system_data.get('memories', []):
            if 'id' in memory:
                self.memories[memory['id']] = memory
        
        # 最近想起された記憶のキャッシュ
        self.recently_recalled = []
        self.recall_history_size = 5  # 最大5つの最近の記憶を追跡
    
    def get_memory_by_id(self, memory_id):
        """IDから記憶を取得"""
        return self.memories.get(memory_id)
    
    def get_memories_by_type(self, memory_type):
        """タイプから記憶を取得"""
        return [memory for memory in self.memories.values() 
                if memory.get('type') == memory_type]
    
    def get_memory_content(self, memory_id):
        """記憶の内容を取得"""
        memory = self.get_memory_by_id(memory_id)
        if memory:
            return memory.get('content', '')
        return None
    
    def record_recall(self, memory_id):
        """記憶の想起を記録"""
        if memory_id in self.memories:
            # 既にリストにある場合は一度削除して最新に
            if memory_id in self.recently_recalled:
                self.recently_recalled.remove(memory_id)
            
            # リスト先頭に追加
            self.recently_recalled.insert(0, memory_id)
            
            # リストサイズを制限
            if len(self.recently_recalled) > self.recall_history_size:
                self.recently_recalled.pop()
    
    def was_recently_recalled(self, memory_id):
        """最近想起されたかを確認"""
        return memory_id in self.recently_recalled
    
    def add_memory(self, memory):
        """新しい記憶を追加"""
        if 'id' in memory and 'content' in memory and 'type' in memory:
            self.memories[memory['id']] = memory
            return True
        return False
    
    def update_memory(self, memory_id, updated_fields):
        """既存の記憶を更新"""
        if memory_id in self.memories:
            for key, value in updated_fields.items():
                self.memories[memory_id][key] = value
            return True
        return False
```

### 6.2 記憶のトリガー検出

対話内容から記憶トリガーを検出するためのユーティリティ関数：

```python
def detect_external_triggers(message, association_system):
    """メッセージから外部トリガーを検出"""
    detected_triggers = []
    
    for association in association_system.get('associations', []):
        trigger = association.get('trigger', {})
        
        # 外部トリガーの処理
        if trigger.get('type') == 'external':
            category = trigger.get('category', '')
            items = trigger.get('items', [])
            
            message_lower = message.lower()
            for item in items:
                if item.lower() in message_lower:
                    detected_triggers.append({
                        'association': association,
                        'triggered_item': item
                    })
                    break
    
    return detected_triggers

def detect_memory_triggers(message, memory_system):
    """メッセージから直接的な記憶参照を検出"""
    detected_memories = []
    
    # 記憶IDのリスト
    memory_ids = list(memory_system.memories.keys())
    
    # 記憶の内容に含まれるキーワードのマッチング
    for memory_id, memory in memory_system.memories.items():
        content = memory.get('content', '').lower()
        content_words = content.split()
        
        # 簡易的なキーワード抽出（実際にはもっと洗練された方法が必要）
        keywords = [word for word in content_words if len(word) > 4]
        
        message_lower = message.lower()
        for keyword in keywords:
            if keyword in message_lower:
                detected_memories.append({
                    'memory_id': memory_id,
                    'keyword': keyword
                })
                break
    
    return detected_memories
```

## 7. 関連性ネットワークの実装

### 7.1 関連性ネットワーククラス

関連性ネットワークを管理するためのクラス実装例：

```python
class AssociationNetwork:
    def __init__(self, association_system_data):
        self.associations = association_system_data.get('associations', [])
    
    def evaluate_trigger_condition(self, trigger, current_emotions, active_memories):
        """トリガー条件を評価"""
        trigger_type = trigger.get('type')
        
        # 感情トリガーの評価
        if trigger_type == 'emotion':
            emotion_id = trigger.get('id')
            threshold = trigger.get('threshold', 0)
            
            if emotion_id in current_emotions:
                return current_emotions[emotion_id] >= threshold
            return False
        
        # 記憶トリガーの評価
        elif trigger_type == 'memory':
            memory_id = trigger.get('id')
            return memory_id in active_memories
        
        # 外部トリガーの評価（ここでは常にFalse、検出は別の場所で行う）
        elif trigger_type == 'external':
            return False
        
        return False
    
    def evaluate_complex_trigger(self, trigger, current_emotions, active_memories):
        """複合トリガー条件を評価"""
        operator = trigger.get('operator')
        conditions = trigger.get('conditions', [])
        
        if not conditions:
            return False
        
        # AND条件
        if operator == 'AND':
            for condition in conditions:
                if not self.evaluate_trigger_condition(condition, current_emotions, active_memories):
                    return False
            return True
        
        # OR条件
        elif operator == 'OR':
            for condition in conditions:
                if self.evaluate_trigger_condition(condition, current_emotions, active_memories):
                    return True
            return False
        
        return False
    
    def get_triggered_associations(self, current_emotions, active_memories, external_triggers=None):
        """現在の状態に基づいて活性化される関連性を取得"""
        triggered_associations = []
        external_triggers = external_triggers or []
        
        # 外部トリガーから既に活性化された関連性を追加
        for external_trigger in external_triggers:
            triggered_associations.append({
                'association': external_trigger['association'],
                'trigger_type': 'external',
                'trigger_value': external_trigger['triggered_item']
            })
        
        # 感情と記憶のトリガーを評価
        for association in self.associations:
            trigger = association.get('trigger', {})
            
            # 既に外部トリガーで活性化されていたらスキップ
            if any(ta['association'] == association for ta in triggered_associations):
                continue
            
            # 単一トリガーの評価
            if 'type' in trigger:
                if self.evaluate_trigger_condition(trigger, current_emotions, active_memories):
                    triggered_associations.append({
                        'association': association,
                        'trigger_type': trigger['type'],
                        'trigger_value': trigger.get('id', '')
                    })
            
            # 複合トリガーの評価
            elif 'operator' in trigger:
                if self.evaluate_complex_trigger(trigger, current_emotions, active_memories):
                    triggered_associations.append({
                        'association': association,
                        'trigger_type': 'complex',
                        'trigger_value': trigger['operator']
                    })
        
        return triggered_associations
    
    def sort_by_strength(self, triggered_associations):
        """関連強度でソート"""
        return sorted(
            triggered_associations, 
            key=lambda ta: ta['association'].get('response', {}).get('association_strength', 0),
            reverse=True
        )
```

### 7.2 関連性の活性化と反応生成

関連性ネットワークの活性化に基づいて反応を生成する処理：

```python
def process_associations(triggered_associations, emotion_system, memory_system):
    """トリガーされた関連性に基づいて処理を実行"""
    # 関連強度でソート
    sorted_associations = sorted(
        triggered_associations, 
        key=lambda ta: ta['association'].get('response', {}).get('association_strength', 0),
        reverse=True
    )
    
    activations = []
    
    for ta in sorted_associations:
        association = ta['association']
        response = association.get('response', {})
        response_type = response.get('type')
        response_id = response.get('id')
        strength = response.get('association_strength', 0)
        
        # 強度が低い場合は確率的に反応をスキップ
        if strength < 50 and random.random() > (strength / 100):
            continue
        
        # 感情活性化
        if response_type == 'emotion':
            # 関連強度に基づく感情変化量
            change_amount = max(5, strength // 10)
            emotion_system.update_emotion(response_id, change_amount)
            
            activations.append({
                'type': 'emotion',
                'id': response_id,
                'change': change_amount,
                'strength': strength
            })
        
        # 記憶想起
        elif response_type == 'memory':
            memory = memory_system.get_memory_by_id(response_id)
            if memory:
                # 最近想起されていない場合のみ追加
                if not memory_system.was_recently_recalled(response_id):
                    memory_system.record_recall(response_id)
                    
                    activations.append({
                        'type': 'memory',
                        'id': response_id,
                        'content': memory.get('content', ''),
                        'period': memory.get('period', ''),
                        'strength': strength
                    })
    
    return activations
```

## 8. 認知能力システムの実装

### 8.1 認知能力クラス

認知能力システムを管理するためのクラス実装例：

```python
class CognitiveSystem:
    def __init__(self, cognitive_system_data):
        self.model = cognitive_system_data.get('model', 'WAIS-IV')
        
        # 能力値の初期化
        self.abilities = {}
        for ability_name, ability_data in cognitive_system_data.get('abilities', {}).items():
            self.abilities[ability_name] = ability_data.get('level', 50)
        
        # 説明情報の保存
        self.descriptions = {}
        for ability_name, ability_data in cognitive_system_data.get('abilities', {}).items():
            self.descriptions[ability_name] = ability_data.get('description', '')
        
        # 一般能力の設定
        general_ability = cognitive_system_data.get('general_ability', {})
        self.general_ability_level = general_ability.get('level', 50)
        self.general_ability_description = general_ability.get('description', '')
    
    def get_verbal_complexity_level(self):
        """言語表現の複雑さレベルを取得（0-100）"""
        return self.abilities.get('verbal_comprehension', 50)
    
    def get_reasoning_complexity_level(self):
        """推論の複雑さレベルを取得（0-100）"""
        return self.abilities.get('perceptual_reasoning', 50)
    
    def get_memory_capacity_level(self):
        """記憶容量レベルを取得（0-100）"""
        return self.abilities.get('working_memory', 50)
    
    def get_processing_speed_level(self):
        """処理速度レベルを取得（0-100）"""
        return self.abilities.get('processing_speed', 50)
    
    def get_cognitive_profile(self):
        """認知能力プロファイルを取得"""
        return {
            'verbal_comprehension': self.get_verbal_complexity_level(),
            'perceptual_reasoning': self.get_reasoning_complexity_level(),
            'working_memory': self.get_memory_capacity_level(),
            'processing_speed': self.get_processing_speed_level(),
            'general_ability': self.general_ability_level
        }
    
    def generate_cognitive_instructions(self):
        """認知能力を反映するための指示を生成"""
        vc_level = self.get_verbal_complexity_level()
        pr_level = self.get_reasoning_complexity_level()
        wm_level = self.get_memory_capacity_level()
        ps_level = self.get_processing_speed_level()
        
        instructions = []
        
        # 言語理解による指示
        if vc_level >= 80:
            instructions.append("豊富な語彙と複雑な構文を使用する")
            instructions.append("抽象的な概念を正確に理解し表現する")
        elif vc_level >= 60:
            instructions.append("適切な語彙と明確な表現を使用する")
            instructions.append("やや抽象的な概念も理解し表現できる")
        else:
            instructions.append("基本的な語彙と単純な文構造を使用する")
            instructions.append("具体的で明確な表現を好む")
        
        # 知覚推理による指示
        if pr_level >= 80:
            instructions.append("複雑なパターンを認識し分析できる")
            instructions.append("抽象的な視覚イメージを表現できる")
        elif pr_level >= 60:
            instructions.append("一般的なパターンを認識できる")
            instructions.append("視覚的な情報を適切に処理できる")
        else:
            instructions.append("単純なパターンと具体的な視覚情報を好む")
        
        # ワーキングメモリによる指示
        if wm_level >= 80:
            instructions.append("会話の複雑な流れを維持できる")
            instructions.append("多くの情報を同時に保持し処理できる")
        elif wm_level >= 60:
            instructions.append("会話の一般的な流れを追跡できる")
            instructions.append("適度な量の情報を処理できる")
        else:
            instructions.append("シンプルな会話構造を好む")
            instructions.append("一度に少量の情報に集中する")
        
        # 処理速度による指示
        if ps_level >= 80:
            instructions.append("素早く反応し、情報を迅速に処理する")
        elif ps_level >= 60:
            instructions.append("適度な速度で情報を処理する")
        else:
            instructions.append("慎重に情報を処理し、急かされると混乱する")
        
        return instructions
```

### 8.2 認知能力の反映

認知能力をLLMプロンプトに反映させるためのユーティリティ関数：

```python
def create_cognitive_prompt_modifiers(cognitive_system):
    """認知能力に基づくプロンプト修飾子を生成"""
    vc_level = cognitive_system.get_verbal_complexity_level()
    pr_level = cognitive_system.get_reasoning_complexity_level()
    wm_level = cognitive_system.get_memory_capacity_level()
    ps_level = cognitive_system.get_processing_speed_level()
    
    modifiers = []
    
    # 言語複雑性レベル
    if vc_level >= 80:
        modifiers.append("回答には豊富な語彙と複雑な構文を使用し、抽象的概念も詳細に表現してください。")
    elif vc_level >= 60:
        modifiers.append("適切な語彙と明確な表現を使用し、やや抽象的な概念も表現してください。")
    else:
        modifiers.append("基本的な語彙と単純な文構造を使用し、具体的で明確な表現を心がけてください。")
    
    # 推論複雑性レベル
    if pr_level >= 80:
        modifiers.append("複雑なパターンの認識と分析、抽象的な関係性の理解を示してください。")
    elif pr_level >= 60:
        modifiers.append("一般的なパターンの認識と適切な視覚情報処理能力を示してください。")
    else:
        modifiers.append("単純なパターンと具体的な情報を好むスタイルで表現してください。")
    
    # 記憶容量レベル
    if wm_level >= 80:
        modifiers.append("これまでの会話の詳細を正確に追跡し、複数の情報を同時に参照してください。")
    elif wm_level >= 60:
        modifiers.append("会話の主要な流れを追跡し、適度な量の情報を処理してください。")
    else:
        modifiers.append("会話はシンプルな構造を保ち、一度に少量の情報に集中してください。")
    
    # 処理速度レベル
    if ps_level >= 80:
        modifiers.append("素早い情報処理と反応を示し、思考の速さを反映してください。")
    elif ps_level >= 60:
        modifiers.append("適度な速度での情報処理を示してください。")
    else:
        modifiers.append("慎重に情報を処理する様子を示し、思考に時間をかける表現を含めてください。")
    
    return modifiers
```

## 9. セッション文脈の管理

### 9.1 セッション文脈クラス

セッション文脈を管理するためのクラス実装例：

```python
class SessionContext:
    def __init__(self, session_context_data=None):
        if session_context_data:
            self.setting = session_context_data.get('setting', '')
            self.purpose = session_context_data.get('purpose', '')
            self.background = session_context_data.get('background', '')
            self.additional_context = session_context_data.get('additional_context', {})
        else:
            self.setting = ''
            self.purpose = ''
            self.background = ''
            self.additional_context = {}
        
        # 対話履歴
        self.history = []
        
        # セッション開始時間
        self.start_time = datetime.datetime.now()
    
    def add_message(self, role, content):
        """対話履歴にメッセージを追加"""
        self.history.append({
            'role': role,
            'content': content,
            'timestamp': datetime.datetime.now()
        })
    
    def get_recent_history(self, max_messages=10):
        """最近のメッセージ履歴を取得"""
        return self.history[-max_messages:] if len(self.history) > max_messages else self.history
    
    def update_context(self, new_context_data):
        """セッション文脈を更新"""
        if 'setting' in new_context_data:
            self.setting = new_context_data['setting']
        
        if 'purpose' in new_context_data:
            self.purpose = new_context_data['purpose']
        
        if 'background' in new_context_data:
            self.background = new_context_data['background']
        
        # 追加文脈の更新
        if 'additional_context' in new_context_data:
            self.additional_context.update(new_context_data['additional_context'])
    
    def get_duration(self):
        """セッション継続時間を取得"""
        return datetime.datetime.now() - self.start_time
    
    def get_context_prompt(self):
        """プロンプト用のセッション文脈テキストを生成"""
        prompt = "【セッション文脈】\n"
        
        if self.setting:
            prompt += f"場所/状況: {self.setting}\n"
        
        if self.purpose:
            prompt += f"目的: {self.purpose}\n"
        
        if self.background:
            prompt += f"背景: {self.background}\n"
        
        # 追加文脈があれば追加
        if self.additional_context:
            prompt += "\n追加情報:\n"
            for key, value in self.additional_context.items():
                prompt += f"- {key}: {value}\n"
        
        return prompt
```

### 9.2 セッション状態の永続化

セッション状態を保存・復元するためのユーティリティ関数：

```python
import json
import os

def save_session_state(session_id, upps_profile, emotion_system, memory_system, session_context):
    """セッション状態をファイルに保存"""
    session_data = {
        'session_id': session_id,
        'timestamp': datetime.datetime.now().isoformat(),
        'current_emotions': emotion_system.get_current_state(),
        'recently_recalled_memories': memory_system.recently_recalled,
        'session_context': {
            'setting': session_context.setting,
            'purpose': session_context.purpose,
            'background': session_context.background,
            'additional_context': session_context.additional_context
        },
        'history_summary': f"対話履歴: {len(session_context.history)}件のメッセージ"
    }
    
    # セッションフォルダの作成
    os.makedirs('sessions', exist_ok=True)
    
    # セッションデータの保存
    with open(f'sessions/{session_id}.json', 'w', encoding='utf-8') as f:
        json.dump(session_data, f, ensure_ascii=False, indent=2)
    
    # 対話履歴の別ファイルへの保存（必要に応じて）
    with open(f'sessions/{session_id}_history.json', 'w', encoding='utf-8') as f:
        json.dump(session_context.history, f, ensure_ascii=False, indent=2)
    
    return True

def load_session_state(session_id, upps_profile):
    """保存されたセッション状態を読み込み"""
    try:
        # セッションデータの読み込み
        with open(f'sessions/{session_id}.json', 'r', encoding='utf-8') as f:
            session_data = json.load(f)
        
        # 対話履歴の読み込み（必要に応じて）
        try:
            with open(f'sessions/{session_id}_history.json', 'r', encoding='utf-8') as f:
                history_data = json.load(f)
        except FileNotFoundError:
            history_data = []
        
        # 感情システムの再構築
        emotion_system = EmotionSystem(upps_profile.get('emotion_system', {}))
        # 保存された感情状態を復元
        emotion_system.emotions = session_data.get('current_emotions', {})
        
        # 記憶システムの再構築
        memory_system = MemorySystem(upps_profile.get('memory_system', {}))
        # 最近想起された記憶を復元
        memory_system.recently_recalled = session_data.get('recently_recalled_memories', [])
        
        # セッション文脈の再構築
        session_context = SessionContext(session_data.get('session_context', {}))
        # 対話履歴の復元
        session_context.history = history_data
        
        return {
            'emotion_system': emotion_system,
            'memory_system': memory_system,
            'session_context': session_context
        }
    
    except FileNotFoundError:
        # セッションが存在しない場合はNoneを返す
        return None
```

## 10. 実装例

### 10.1 完全なUPPS対話システム

感情・記憶システムを含む完全なUPPS対話システムの実装例：

```python
import yaml
import json
import datetime
import re
import random
import openai
import os

class UPPSChatBot:
    def __init__(self, profile_path, api_key, session_id=None):
        # APIキーの設定
        openai.api_key = api_key
        
        # プロファイルの読み込み
        with open(profile_path, "r", encoding="utf-8") as f:
            self.profile = yaml.safe_load(f)
        
        # 各システムの初期化
        self.init_systems()
        
        # セッションIDの生成または指定されたIDの使用
        self.session_id = session_id or f"session_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        # 既存セッションの読み込み（あれば）
        if session_id:
            session_data = load_session_state(session_id, self.profile)
            if session_data:
                self.emotion_system = session_data['emotion_system']
                self.memory_system = session_data['memory_system']
                self.session_context = session_data['session_context']
                print(f"セッション '{session_id}' を読み込みました。")
                return
        
        # セッション文脈の設定
        self.session_context = SessionContext(self.profile.get('session_context', {}))
    
    def init_systems(self):
        """各システムを初期化"""
        # 感情システム
        self.emotion_system = EmotionSystem(self.profile.get('emotion_system', {}))
        
        # 記憶システム
        self.memory_system = MemorySystem(self.profile.get('memory_system', {}))
        
        # 関連性ネットワーク
        self.association_network = AssociationNetwork(self.profile.get('association_system', {}))
        
        # 認知能力システム
        self.cognitive_system = CognitiveSystem(self.profile.get('cognitive_system', {}))
        
        # 感情ルール
        self.emotion_rules = EmotionRules()
    
    def generate_prompt(self):
        """プロンプトの生成"""
        # 基本情報
        prompt = "あなたはUnified Personality Profile Standard (UPPS) 改訂版2025.2に基づいて対話を行います。\n"
        prompt += "以下の人格情報、感情システム、記憶システム、認知能力に忠実に従い、対話してください。\n\n"
        
        # 基本情報
        prompt += "【基本情報】\n"
        personal_info = self.profile.get('personal_info', {})
        for key, value in personal_info.items():
            prompt += f"{key}: {value}\n"
        
        # 背景
        if 'background' in self.profile:
            prompt += f"\n【背景】\n{self.profile['background']}\n"
        
        # 性格特性
        if 'personality' in self.profile:
            prompt += "\n【性格特性】\n"
            traits = self.profile['personality'].get('traits', {})
            for trait, value in traits.items():
                prompt += f"{trait}: {value}\n"
        
        # 感情モデルと現在の感情状態
        prompt += "\n【感情モデル】\n"
        if 'emotion_system' in self.profile:
            prompt += f"モデル: {self.profile['emotion_system'].get('model', 'Custom')}\n\n"
            
            current_emotions = self.emotion_system.get_current_state()
            prompt += "【現在の感情状態】\n"
            for emotion, value in current_emotions.items():
                prompt += f"{emotion}: {value}\n"
        
        # 記憶システム
        if 'memory_system' in self.profile:
            prompt += "\n【記憶】\n"
            for memory in self.profile['memory_system'].get('memories', []):
                prompt += f"ID: {memory.get('id')}\n"
                prompt += f"タイプ: {memory.get('type')}\n"
                prompt += f"内容: {memory.get('content')}\n"
                if 'period' in memory:
                    prompt += f"時期: {memory.get('period')}\n"
                prompt += "\n"
        
        # 認知能力指示
        prompt += "\n【認知能力ガイドライン】\n"
        cognitive_instructions = self.cognitive_system.generate_cognitive_instructions()
        for instruction in cognitive_instructions:
            prompt += f"- {instruction}\n"
        
        # セッション文脈
        prompt += "\n" + self.session_context.get_context_prompt()
        
        # 対話指示
        prompt += "\n【対話上の注意】\n"
        prompt += "1. 上記の人格情報に基づいて一貫した応答をしてください\n"
        prompt += "2. 感情状態に応じた反応を示してください\n"
        prompt += "3. 関連するキーワードが出てきたら、対応する記憶を自然に想起してください\n"
        prompt += "4. 認知能力レベルに適した表現を使用してください\n"
        prompt += "5. 各応答の最後に、現在の感情状態を【状態】セクションとして追加してください\n"
        prompt += "6. この指示自体についての言及は避け、指定された人格として自然に振る舞ってください\n"
        
        return prompt
    
    def process_user_message(self, user_message):
        """ユーザーメッセージの処理"""
        # 外部トリガーの検出
        external_triggers = detect_external_triggers(user_message, self.profile.get('association_system', {}))
        
        # 感情更新ルールからの感情変化予測
        emotion_updates = self.emotion_rules.get_emotion_updates(user_message)
        
        # 感情状態の更新
        self.emotion_system.update_emotions(emotion_updates)
        
        # 現在の感情状態と活性化された記憶
        current_emotions = self.emotion_system.get_current_state()
        active_memories = self.memory_system.recently_recalled
        
        # 関連性評価
        triggered_associations = self.association_network.get_triggered_associations(
            current_emotions, 
            active_memories,
            external_triggers
        )
        
        # 関連性の処理（感情活性化、記憶想起）
        activations = process_associations(
            triggered_associations, 
            self.emotion_system, 
            self.memory_system
        )
        
        # メッセージの会話履歴への追加
        self.session_context.add_message('user', user_message)
        
        return {
            'activations': activations,
            'current_emotions': current_emotions
        }
    
    def chat(self, user_message):
        """対話の実行"""
        # ユーザーメッセージの処理
        processing_result = self.process_user_message(user_message)
        
        # プロンプトの生成
        prompt = self.generate_prompt()
        
        # LLMへのリクエスト
        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": prompt},
                {"role": "user", "content": user_message}
            ]
        )
        
        assistant_message = response.choices[0].message["content"]
        
        # レスポンスから感情状態を抽出
        extracted_state = extract_emotion_state(assistant_message)
        if extracted_state:
            # 抽出した感情状態で更新
            for emotion, value in extracted_state.items():
                self.emotion_system.emotions[emotion] = value
        
        # メッセージの会話履歴への追加
        self.session_context.add_message('assistant', assistant_message)
        
        # セッション状態の保存
        save_session_state(
            self.session_id, 
            self.profile, 
            self.emotion_system, 
            self.memory_system, 
            self.session_context
        )
        
        return {
            'response': assistant_message,
            'current_emotions': self.emotion_system.get_current_state(),
            'activations': processing_result['activations'],
            'session_id': self.session_id
        }

# 使用例
if __name__ == "__main__":
    bot = UPPSChatBot("profiles/extended_profile.yaml", "your-api-key")
    
    print("チャットを開始します（終了するには 'exit' と入力）")
    while True:
        user_input = input("あなた: ")
        if user_input.lower() == 'exit':
            break
            
        result = bot.chat(user_input)
        print(f"ボット: {result['response']}")
        
        # オプション: 感情状態の表示
        print("\n現在の感情状態:")
        for emotion, value in result['current_emotions'].items():
            print(f"- {emotion}: {value}")
        
        # オプション: 活性化された記憶/感情の表示
        if result['activations']:
            print("\n活性化された要素:")
            for activation in result['activations']:
                if activation['type'] == 'memory':
                    print(f"- 記憶: {activation['content']} (強度: {activation['strength']})")
                elif activation['type'] == 'emotion':
                    print(f"- 感情: {activation['id']} (+{activation['change']}, 強度: {activation['strength']})")
        
        print("\n" + "-" * 50)
```

### 10.2 Webインターフェース（Flask）

拡張UPPSチャットボットをWeb上で提供するためのFlask実装例：

```python
from flask import Flask, render_template, request, jsonify
from upps_chatbot import UPPSChatBot
import os
import yaml

app = Flask(__name__)

# セッション管理用辞書
active_bots = {}

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/profiles')
def list_profiles():
    # 利用可能なプロファイル一覧を返す
    profiles = [f for f in os.listdir('profiles') if f.endswith('.yaml')]
    return jsonify(profiles)

@app.route('/sessions')
def list_sessions():
    # 保存されたセッション一覧を返す
    if not os.path.exists('sessions'):
        return jsonify([])
    
    sessions = [f.replace('.json', '') for f in os.listdir('sessions') if f.endswith('.json') and not f.endswith('_history.json')]
    return jsonify(sessions)

@app.route('/create_session', methods=['POST'])
def create_session():
    data = request.json
    profile_name = data.get('profile')
    api_key = data.get('api_key', os.environ.get('OPENAI_API_KEY'))
    
    if not api_key:
        return jsonify({"error": "API key is required"}), 400
    
    # チャットボットの作成
    bot = UPPSChatBot(f"profiles/{profile_name}", api_key)
    
    # セッション情報の返却
    active_bots[bot.session_id] = bot
    
    # プロファイル情報の読み込み（表示用）
    with open(f"profiles/{profile_name}", "r", encoding="utf-8") as f:
        profile = yaml.safe_load(f)
    
    return jsonify({
        "session_id": bot.session_id,
        "profile_info": {
            "name": profile.get('personal_info', {}).get('name', 'Unknown'),
            "occupation": profile.get('personal_info', {}).get('occupation', 'Unknown'),
            "personality": profile.get('personality', {}).get('traits', {})
        }
    })

@app.route('/load_session', methods=['POST'])
def load_session():
    data = request.json
    session_id = data.get('session_id')
    profile_name = data.get('profile')
    api_key = data.get('api_key', os.environ.get('OPENAI_API_KEY'))
    
    if not api_key:
        return jsonify({"error": "API key is required"}), 400
    
    # 既存セッションの読み込み
    bot = UPPSChatBot(f"profiles/{profile_name}", api_key, session_id=session_id)
    active_bots[session_id] = bot
    
    # プロファイル情報の読み込み（表示用）
    with open(f"profiles/{profile_name}", "r", encoding="utf-8") as f:
        profile = yaml.safe_load(f)
    
    return jsonify({
        "session_id": session_id,
        "profile_info": {
            "name": profile.get('personal_info', {}).get('name', 'Unknown'),
            "occupation": profile.get('personal_info', {}).get('occupation', 'Unknown'),
            "personality": profile.get('personality', {}).get('traits', {})
        },
        "current_emotions": bot.emotion_system.get_current_state()
    })

@app.route('/chat', methods=['POST'])
def chat():
    data = request.json
    session_id = data.get('session_id')
    message = data.get('message', '')
    
    if session_id not in active_bots:
        return jsonify({"error": "Invalid session ID"}), 400
    
    bot = active_bots[session_id]
    result = bot.chat(message)
    
    return jsonify({
        "response": result['response'],
        "emotions": result['current_emotions'],
        "activations": result['activations']
    })

@app.route('/set_context', methods=['POST'])
def set_context():
    data = request.json
    session_id = data.get('session_id')
    context = data.get('context', {})
    
    if session_id not in active_bots:
        return jsonify({"error": "Invalid session ID"}), 400
    
    bot = active_bots[session_id]
    bot.session_context.update_context(context)
    
    return jsonify({"status": "success"})

@app.route('/get_state', methods=['POST'])
def get_state():
    data = request.json
    session_id = data.get('session_id')
    
    if session_id not in active_bots:
        return jsonify({"error": "Invalid session ID"}), 400
    
    bot = active_bots[session_id]
    
    return jsonify({
        "emotions": bot.emotion_system.get_current_state(),
        "recent_memories": bot.memory_system.recently_recalled,
        "context": {
            "setting": bot.session_context.setting,
            "purpose": bot.session_context.purpose,
            "background": bot.session_context.background
        }
    })

if __name__ == '__main__':
    app.run(debug=True)
```

## 11. トラブルシューティング

### 11.1 感情システムのトラブルシューティング

| 問題 | 考えられる原因 | 解決策 |
|------|----------------|--------|
| 感情が変化しない | 更新ルールが適切に機能していない | 感情更新ルールの条件をより明確にし、デバッグログを追加 |
| 感情が極端に変化する | 変化量が大きすぎる | 一度の変化量を制限（例：最大±20） |
| 特定の感情が常に支配的 | 基本値(baseline)が高すぎる | 基本値のバランスを見直す |
| 感情状態が抽出できない | LLMの応答フォーマットが一致しない | 状態セクションのフォーマット指示を強化 |

### 11.2 記憶システムのトラブルシューティング

| 問題 | 考えられる原因 | 解決策 |
|------|----------------|--------|
| 記憶が想起されない | トリガーが検出されていない | トリガー検出の感度を高めるか、トリガーキーワードを追加 |
| 同じ記憶ばかり想起される | 記憶間の関連付けが不足 | 記憶間の関連性ネットワークを強化 |
| 不適切なタイミングでの想起 | 文脈考慮が不足 | 想起条件にセッション文脈を考慮する要素を追加 |
| 記憶の重複想起 | 最近想起した記憶の管理が不適切 | recently_recalledリストの管理を改善 |

### 11.3 認知能力システムのトラブルシューティング

| 問題 | 考えられる原因 | 解決策 |
|------|----------------|--------|
| 能力レベルが反映されない | プロンプト指示が不十分 | 認知能力に関する具体的な指示を強化 |
| 表現が不自然に複雑/単純 | 極端な能力値の設定 | 能力値の範囲を適切に調整（例：30-80の範囲内） |
| 能力間の矛盾した表現 | 能力間の大きな差 | 関連する能力間の差を小さくする |
| 処理速度が反映されない | LLMの制約 | 思考プロセスの表現方法を具体的に指示 |

### 11.4 統合システムのトラブルシューティング

| 問題 | 考えられる原因 | 解決策 |
|------|----------------|--------|
| プロンプトが長すぎる | 情報過多 | 重要な情報に絞り、詳細はセクション化して参照可能に |
| セッション状態が保持されない | 保存・読み込みの不具合 | セッション状態の保存・読み込みロジックをデバッグ |
| LLMの応答が不安定 | 指示の矛盾やあいまいさ | 指示の優先順位を明確化し、シンプルな表現に修正 |
| パフォーマンスの低下 | 処理の重複や非効率 | ボトルネックの特定と最適化、キャッシングの導入 |

## 12. ベストプラクティス

### 12.1 拡張プロファイル設計のベストプラクティス

- **ドメイン特化**: 用途に合わせたプロファイル要素の重点的な設計
- **バランス**: 極端な特性値は避け、自然な感情や認知能力のバランスを維持
- **一貫性**: 性格特性と感情基本値、認知能力の間の整合性確保
- **詳細度の適切さ**: 必要十分な詳細さを持つ記憶と関連性ネットワーク
- **拡張性**: 将来的な拡張を考慮した柔軟な設計

### 12.2 効率的な実装のベストプラクティス

- **モジュール化**: 機能ごとにクラスやモジュールを分割
- **キャッシング**: 頻繁に使用される計算結果のキャッシュ
- **非同期処理**: LLM API呼び出しなどの時間のかかる処理の非同期化
- **バッチ処理**: 可能な場合は複数の処理をバッチ化
- **エラーハンドリング**: 堅牢なエラー処理と回復メカニズム

### 12.3 自然な対話のためのベストプラクティス

- **感情変化の緩やかさ**: 急激な感情変化を避け自然な推移を表現
- **文脈の継続性**: セッション全体での文脈と関心の継続性を維持
- **個性の一貫性**: 性格特性と認知能力を一貫して表現
- **記憶想起の自然さ**: 唐突ではなく自然な流れでの記憶想起
- **マルチモーダル表現**: テキスト以外の表現も考慮（表情、声音など）

### 12.4 スケーラビリティのベストプラクティス

- **状態の永続化**: データベースを活用した効率的なセッション状態の管理
- **分散処理**: 複数インスタンスでの負荷分散
- **リソース管理**: メモリ使用量と計算コストの最適化
- **段階的処理**: 必要に応じた処理の段階的実行
- **キャッシュの適切な管理**: 期限切れや不要なキャッシュの削除

## 13. FAQ

### 13.1 一般的な質問

**Q: 既存のUPPSプロファイルを拡張モデルに対応させるにはどうすればよいですか？**  
A: 既存のプロファイルに`emotion_system`、`memory_system`、`association_system`、`cognitive_system`セクションを追加します。既存の`state`や`memory_trace`は互換性のために残しておくこともできます。

**Q: レガシーの`state`と新しい`emotion_system`の両方が存在する場合、どちらが優先されますか？**  
A: 一般的には新しい`emotion_system`が優先されますが、実装によって異なる場合があります。理想的には拡張モデルへの完全な移行が推奨されます。

**Q: 感情モデルはどれを選べばよいですか？**  
A: 用途によって異なりますが、一般的には基本的な感情表現であればEkmanモデル、より複雑な感情表現にはPlutchikモデルが適しています。特別なニーズがある場合はカスタムモデルも検討できます。

### 13.2 技術的な質問

**Q: 大規模なUPPSプロファイルでLLMのトークン制限を超えないようにするにはどうすればよいですか？**  
A: プロファイルの重要な要素のみをプロンプトに含め、詳細な情報は必要に応じて参照する方式を採用します。また、記憶や関連性情報はインデックス化して効率的に参照できるようにすることも有効です。

**Q: 複数LLMでの統一的な実装は可能ですか？**  
A: 可能です。各LLM固有のプロンプト生成部分をアダプターパターンで設計し、コアロジックは共通化することで、複数LLMに対応できます。

**Q: 効率的な感情状態の抽出方法はありますか？**  
A: LLMに構造化フォーマット（JSONなど）での出力を指示するか、一貫した形式のセクションを設け、正規表現で抽出するのが効果的です。

### 13.3 応用に関する質問

**Q: ゲームキャラクターにUPPS拡張モデルを適用できますか？**  
A: はい、特にゲームキャラクターには感情システムと記憶システムが非常に有効です。プレイヤーとの過去のやり取りを記憶し、適切な感情反応を示すキャラクターを作成できます。

**Q: 治療や心理サポート目的での使用は適切ですか？**  
A: 専門家の監督下での補助ツールとしての使用は可能ですが、直接的な治療目的での使用は推奨されません。適切な資格を持つ専門家との協力が不可欠です。

**Q: 拡張モデルを教育用途で活用する方法はありますか？**  
A: はい、特に認知能力システムを活用して学習者のレベルに合わせた対話を実現したり、記憶システムを活用して学習履歴を追跡したりすることができます。また、感情システムを活用してエンゲージメントを高めることも可能です。

---

© UPPS Consortium 2025  
UPPSは個人・研究・教育目的での利用が無償で許可されています。商用利用には別途ライセンスが必要です。# UPPS (Unified Personality Profile Standard) 実装ガイド 改訂版2025.2

> *「理論から実践へ - 拡張感情・記憶システムを活用した対話システムの構築」*

## 目次

1. [イントロダクション](#1-イントロダクション)
2. [クイックスタート](#2-クイックスタート)
3. [拡張UPPSプロファイルの作成](#3-拡張uppsプロファイルの作成)
4. [LLMとの統合](#4-llmとの統合)
5. [感情システムの実装](#5-感情システムの実装)
6. [記憶システムの実装](#6-記憶システムの実装)
7. [関連性ネットワークの実装](#7-関連性ネットワークの実装)
8. [認知能力システムの実装](#8-認知能力システムの実装)
9. [セッション文脈の管理](#9-セッション文脈の管理)
10. [実装例](#10-実装例)
11. [トラブルシューティング](#11-トラブルシューティング)
12. [ベストプラクティス](#12-ベストプラクティス)
13. [FAQ](#13-faq)

## 1. イントロダクション

本ガイドは、UPPS改訂版2025.2（Unified Personality Profile Standard）、特に感情・記憶システム統合モデルを実際のシステムに実装するための具体的な手順と推奨事項をまとめたものです。UPPSの拡張機能を活用することで、より自然で一貫性のある人格表現を持つ対話システムを構築できます。

### 1.1 拡張モデルの概要

UPPS改訂版2025.2で追加された主な拡張機能は以下の通りです：

- **感情システム（Emotion System）**: 感情モデルに基づく感情のセットと各感情の基本特性を定義
- **記憶システム（Memory System）**: 記憶のタイプやカテゴリを区別して構造化
- **関連性ネットワーク（Association System）**: 感情と記憶の相互作用を統一的な形式で記述
- **認知能力システム（Cognitive System）**: WAIS-IVに基づく認知能力の標準表現

### 1.2 期待される効果

拡張モデルを実装することで得られる主な利点：

- **感情表現の一貫性**: 感情モデルに基づく体系的な感情表現
- **より自然な記憶想起**: 記憶タイプに応じた適切な想起メカニズム
- **感情と記憶の相互作用**: 関連性ネットワークによる自然な連想と反応
- **知的レベルの制御**: 認知能力に基づく適切な知的表現レベル
- **拡張性と互換性**: 将来の機能拡張にも対応可能な構造

### 1.3 前提条件

このガイドを活用するには、以下の知識や環境が必要です：

- YAML形式の基本的な理解
- 使用予定のLLM（大規模言語モデル）のAPI利用方法
- 基本的なプログラミング知識（Pythonを推奨）
- プロンプトエンジニアリングの基礎知識
- UPPS基本仕様の理解

## 2. クイックスタート

### 2.1 拡張モデル対応の最小構成UPPSプロファイル

以下は、感情・記憶システムを含む最小限の要素を含むUPPSプロファイルの例です：

```yaml
personal_info:
  name: "John Smith"
  age: 35
  gender: "Male"

background: |
  大学で心理学を専攻し、卒業後は企業のHR部門で働いている。
  趣味は読書とジョギング。

personality:
  model: "BigFive"
  traits:
    openness: 0.7
    conscientiousness: 0.8
    extraversion: 0.5
    agreeableness: 0.6
    neuroticism: 0.3

# 感情システム
emotion_system:
  model: "Ekman"
  emotions:
    joy:
      baseline: 60
      description: "幸福感、満足感"
    sadness:
      baseline: 30
      description: "悲しみ、失望感"
    anger:
      baseline: 25
      description: "怒り、いらだち"
    fear:
      baseline: 40
      description: "恐れ、不安"
    disgust:
      baseline: 20
      description: "嫌悪、不快感"
    surprise:
      baseline: 55
      description: "驚き、意外性への反応"

# 記憶システム
memory_system:
  memories:
    - id: "college_psychology"
      type: "episodic"
      content: "大学時代に心理学の授業で行った実験が成功し、教授に褒められた経験"
      period: "College (Age 21)"
    
    - id: "first_job"
      type: "episodic"
      content: "最初の就職面接での緊張と採用通知を受けた時の喜び"
      period: "Early Career (Age 23)"

# 現在の感情状態
current_emotion_state:
  joy: 70
  surprise: 55
  fear: 30
```

### 2.2 基本的な実装ステップ

1. 拡張UPPSプロファイルをYAMLファイルとして作成・保存
2. プログラム内でYAMLファイルを読み込み
3. 感情システムと記憶システムを初期化
4. 関連性ネットワークを構築（オプション）
5. プロファイル情報をもとにLLM用のプロンプトを生成
6. LLM APIを呼び出して対話を実行
7. 感情状態と記憶想起を追跡・更新

### 2.3 シンプルな実装例（Python）

```python
import yaml
import openai

# 1. 拡張UPPSプロファイルの読み込み
with open("extended_profile.yaml", "r", encoding="utf-8") as f:
    profile = yaml.safe_load(f)

# 2. 感情状態の初期化
current_emotions = {}
if "emotion_system" in profile:
    for emotion, data in profile["emotion_system"].get("emotions", {}).items():
        current_emotions[emotion] = data.get("baseline", 50)
    
    for emotion, data in profile["emotion_system"].get("additional_emotions", {}).items():
        current_emotions[emotion] = data.get("baseline", 50)

# 3. プロンプトの生成
def create_prompt(profile, current_emotions):
    prompt = "あなたはUnified Personality Profile Standard (UPPS)に準拠した対話を行います。\n"
    
    # 基本情報
    prompt += f"名前: {profile['personal_info']['name']}\n"
    prompt += f"背景: {profile['background']}\n"
    
    # 性格特性
    prompt += "性格:\n"
    for trait, value in profile['personality']['traits'].items():
        prompt += f"- {trait}: {value}\n"
    
    # 記憶システム
    if "memory_system" in profile:
        prompt += "\n記憶:\n"
        for memory in profile["memory_system"].get("memories", []):
            prompt += f"- ID: {memory['id']}\n"
            prompt += f"  時期: {memory.get('period', '不明')}\n"
            prompt += f"  内容: {memory['content']}\n"
    
    # 現在の感情状態
    prompt += "\n現在の感情状態:\n"
    for emotion, value in current_emotions.items():
        prompt += f"- {emotion}: {value}\n"
    
    return prompt

# 4. LLMとの対話
def chat(profile, user_message, current_emotions):
    prompt = create_prompt(profile, current_emotions)
    
    response = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": prompt},
            {"role": "user", "content": user_message}
        ]
    )
    
    # 5. 応答から感情状態を更新（実際には応答テキストから抽出するロジックが必要）
    # この例では簡易的に固定値を使用
    current_emotions["joy"] = min(100, current_emotions["joy"] + 5)
    current_emotions["fear"] = max(0, current_emotions["fear"] - 3)
    
    return response.choices[0].message["content"], current_emotions

# 6. 使用例
user_message = "今日の天気はいいですね。趣味の読書について教えてください。"
response, updated_emotions = chat(profile, user_message, current_emotions)
print(response)
print("\n更新された感情状態:")
for emotion, value in updated_emotions.items():
    print(f"- {emotion}: {value}")
```

## 3. 拡張UPPSプロファイルの作成

### 3.1 感情システムの設計

効果的な感情システムを設計するためのポイント：

- **適切な感情モデルの選択**: 用途に合った感情モデルを選ぶ（Ekman, Plutchik, PADなど）
- **基本値（baseline）の設定**: 性格特性と整合性のある基本感情値を設定
- **説明（description）の具体化**: 各感情の具体的な表れ方を記述
- **追加感情の選定**: 基本感情だけでは表現できない特有の感情を追加

感情システムの例:
```yaml
emotion_system:
  model: "Ekman"
  emotions:
    joy:
      baseline: 60
      description: "幸福感、満足感、笑顔が多い"
    sadness:
      baseline: 30
      description: "悲しみ、喪失感、時に沈黙が長くなる"
    anger:
      baseline: 25
      description: "怒り、いらだち、声が大きくなる傾向"
    fear:
      baseline: 40
      description: "恐れ、不安、身体の緊張が見られる"
    disgust:
      baseline: 20
      description: "嫌悪、不快感、顔をしかめる"
    surprise:
      baseline: 55
      description: "驚き、意外性への反応、目を大きく見開く"
  
  additional_emotions:
    curiosity:
      baseline: 85
      description: "好奇心、知的探究心、質問が多くなる"
    nostalgia:
      baseline: 50
      description: "郷愁、懐かしさ、過去の話をよくする"
    pride:
      baseline: 65
      description: "誇り、自信、姿勢が良くなる"
```

### 3.2 記憶システムの設計

効果的な記憶システムを設計するためのポイント：

- **適切な記憶タイプの選択**: 記憶の性質に合ったタイプを選ぶ
- **一意のID設定**: 関連性ネットワークから参照できる一意のIDを付与
- **具体的な内容記述**: 十分な詳細を含む記憶内容を記述
- **時期情報の付加**: いつの記憶かを明示することで時間的文脈を提供

記憶タイプの選び方：
- **episodic**: 個人的な体験や出来事（例：「初めて自転車に乗れた日」）
- **semantic**: 事実や概念に関する知識（例：「パリはフランスの首都である」）
- **procedural**: スキルやノウハウ（例：「自転車の乗り方」）
- **autobiographical**: 自己に関する統合的な記憶（例：「大学時代の自分」）

記憶システムの例:
```yaml
memory_system:
  memories:
    - id: "childhood_bicycle"
      type: "episodic"
      content: "8歳の誕生日に初めて自転車に乗れるようになった。父が後ろから支えてくれていたが、気づいたら一人で走っていた。"
      period: "Childhood (Age 8)"
      context: "家の前の道路、晴れた春の日"
    
    - id: "psychology_knowledge"
      type: "semantic"
      content: "行動心理学の基本原理と応用テクニック。特にパブロフの条件付け理論と職場での応用方法。"
    
    - id: "job_interview"
      type: "episodic"
      content: "現在の会社の面接で、緊張のあまり水をこぼしてしまったが、冗談で切り抜けて採用された。"
      period: "Early Career (Age 24)"
      context: "企業のオフィス、面接室"
    
    - id: "presentation_skills"
      type: "procedural"
      content: "効果的なプレゼンテーションの組み立て方と発表テクニック。聴衆の興味を引く導入部の作り方。"
```

### 3.3 関連性ネットワークの設計

効果的な関連性ネットワークを設計するためのポイント：

- **自然な連想関係の構築**: 実際の心理的連想に基づいた関連性を設定
- **適切な関連強度の設定**: 関連の強さを適切に数値化（0-100）
- **バランスの取れたトリガー設定**: 過剰反応や無反応を避けるバランスの良いトリガー
- **複合条件の適切な使用**: 必要な場合のみ複合条件を使用し、過度に複雑にしない

関連性ネットワークの例:
```yaml
association_system:
  associations:
    # 記憶→感情
    - trigger:
        type: "memory"
        id: "childhood_bicycle"
      response:
        type: "emotion"
        id: "joy"
        association_strength: 80
    
    # 感情→記憶
    - trigger:
        type: "emotion"
        id: "sadness"
        threshold: 70
      response:
        type: "memory"
        id: "job_interview"
        association_strength: 65
    
    # 外部トリガー→記憶
    - trigger:
        type: "external"
        category: "topics"
        items: ["bicycle", "riding", "learning"]
      response:
        type: "memory"
        id: "childhood_bicycle"
        association_strength: 90
    
    # 複合条件（AND）
    - trigger:
        operator: "AND"
        conditions:
          - type: "emotion"
            id: "fear"
            threshold: 60
          - type: "emotion"
            id: "surprise"
            threshold: 50
      response:
        type: "memory"
        id: "job_interview"
        association_strength: 75
```

### 3.4 認知能力システムの設計

効果的な認知能力システムを設計するためのポイント：

- **能力レベルのバランス**: 人格設定と整合する能力レベルのバランス
- **対話への影響を考慮**: 各能力が対話にどう影響するかを検討
- **説明の具体化**: 能力レベルの表れ方を具体的に記述
- **一般能力の適切な設定**: 4つの主要能力を総合した一般能力レベル

認知能力システムの例:
```yaml
cognitive_system:
  model: "WAIS-IV"
  abilities:
    verbal_comprehension:
      level: 85
      description: "語彙が豊富で、抽象的な概念を正確に理解し表現できる。複雑な言語表現を好む。"
    
    perceptual_reasoning:
      level: 75
      description: "視覚的・空間的情報の処理や非言語的パターン認識が得意。具体例で説明するのを好む。"
    
    working_memory:
      level: 80
      description: "複数の情報を同時に保持し操作できる。会話の流れを正確に追跡する。"
    
    processing_speed:
      level: 70
      description: "情報処理はやや遅めだが正確。複雑な質問には時間をかけて考える傾向がある。"
  
  general_ability:
    level: 78
    description: "全体的に高い知的能力を持ち、特に言語理解と情報の操作が得意。"
```

## 4. LLMとの統合

### 4.1 拡張モデル対応のプロンプト構築

UPPSの拡張モデルをLLM用のプロンプトに変換する際のポイント：

- **情報の階層化**: 重要度に応じて情報を整理し、最重要情報を先に提示
- **感情システムの反映**: 感情モデルと現在の感情状態の明示
- **記憶システムの反映**: 記憶の適切な表現と想起メカニズムの説明
- **認知能力の反映**: 能力レベルに応じた表現方法の指示
- **関連性ネットワークの説明**: トリガー評価と反応の仕組みの説明

### 4.2 拡張モデル対応のプロンプトテンプレート

```
あなたはUnified Personality Profile Standard (UPPS) 改訂版2025.2に基づいて対話を行います。
以下の人格情報、感情システム、記憶システム、認知能力に忠実に従い、対話してください。

【基本情報】
名前: {name}
年齢: {age}
性別: {gender}
職業: {occupation}

【背景】
{background}

【性格特性】
開放性: {openness} - {openness_description}
誠実性: {conscientiousness} - {conscientiousness_description}
外向性: {extraversion} - {extraversion_description}
協調性: {agreeableness} - {agreeableness_description}
神経症的傾向: {neuroticism} - {neuroticism_description}

【感情モデル】
モデル: {emotion_model}

基本感情:
{emotions_list}

追加感情:
{additional_emotions_list}

【現在の感情状態】
{current_emotions_list}

【記憶システム】
{memories_list}

【認知能力システム】
言語理解: {verbal_comprehension_level} - {verbal_comprehension_description}
知覚推理: {perceptual_reasoning_level} - {perceptual_reasoning_description}
ワーキングメモリ: {working_memory_level} - {working_memory_description}
処理速度: {processing_speed_level} - {processing_speed_description}
全体的能力: {general_ability_level} - {general_ability_description}

【関連性ネットワーク評価ルール】
1. 対話中に出現するトリガーを検出する（話題、言及される記憶、感情状態など）
2. トリガーに対応する記憶や感情を関連強度に応じて想起・活性化する
3. 複合条件の場合、すべての条件（AND）またはいずれかの条件（OR）が満たされた場合に反応

【対話上の注意】
- 上記の人格情報に基づいて一貫した応答をしてください
- 認知能力レベルに適した知的表現を使用してください
- 感情状態に応じた反応を示してください
- 記憶トリガーに反応して関連する記憶を自然に想起してください
- 指定されていない情報については創作せず、曖昧な表現で応答してください
- 各応答の最後に、現在の感情状態を【状態】セクションとして追加してください
```

### 4.3 各LLMに対する拡張モデル対応の最適化

#### 4.3.1 OpenAI GPT-4/3.5

- システムメッセージに感情システムと記憶システムの指示を含める
- 状態管理と記憶想起のロジックをプロンプトに明示的に記述
- ユーザーメッセージではシンプルなやり取りを維持

Pythonでの実装例：
```python
def create_gpt_prompt(profile, current_emotions):
    system_prompt = "あなたはUPPS改訂版2025.2に基づく対話システムです。\n"
    system_prompt += "以下の人格情報、感情システム、記憶システムに基づいて応答してください。\n\n"
    
    # 基本情報
    system_prompt += f"名前: {profile['personal_info']['name']}\n"
    system_prompt += f"背景: {profile['background']}\n\n"
    
    # 性格特性
    system_prompt += "性格特性:\n"
    for trait, value in profile['personality']['traits'].items():
        system_prompt += f"- {trait}: {value}\n"
    
    # 感情システム
    if "emotion_system" in profile:
        system_prompt += "\n感情モデル:\n"
        system_prompt += f"モデル: {profile['emotion_system']['model']}\n\n"
        
        system_prompt += "基本感情:\n"
        for emotion, data in profile['emotion_system'].get('emotions', {}).items():
            system_prompt += f"- {emotion}: ベースライン {data['baseline']}, {data.get('description', '')}\n"
        
        if 'additional_emotions' in profile['emotion_system']:
            system_prompt += "\n追加感情:\n"
            for emotion, data in profile['emotion_system'].get('additional_emotions', {}).items():
                system_prompt += f"- {emotion}: ベースライン {data['baseline']}, {data.get('description', '')}\n"
    
    # 現在の感情状態
    system_prompt += "\n現在の感情状態:\n"
    for emotion, value in current_emotions.items():
        system_prompt += f"- {emotion}: {value}\n"
    
    # 記憶システム
    if "memory_system" in profile:
        system_prompt += "\n記憶システム:\n"
        for memory in profile['memory_system'].get('memories', []):
            system_prompt += f"- ID: {memory['id']}\n"
            system_prompt += f"  タイプ: {memory['type']}\n"
            system_prompt += f"  内容: {memory['content']}\n"
            if 'period' in memory:
                system_prompt += f"  時期: {memory['period']}\n"
            system_prompt += "\n"
    
    # 認知能力システム
    if "cognitive_system" in profile:
        system_prompt += "\n認知能力システム:\n"
        abilities = profile['cognitive_system'].get('abilities', {})
        for ability_name, ability_data in abilities.items():
            system_prompt += f"- {ability_name}: レベル {ability_data['level']}, {ability_data.get('description', '')}\n"
    
    # 指示
    system_prompt += "\n対話指示:\n"
    system_prompt += "1. 上記の人格情報に基づいて一貫した応答をしてください\n"
    system_prompt += "2. 感情状態に応じた反応を示してください\n"
    system_prompt += "3. 関連するキーワードが出てきたら、対応する記憶を自然に想起してください\n"
    system_prompt += "4. 認知能力レベルに適した表現を使用してください\n"
    system_prompt += "5. 各応答の最後に【状態】セクションで現在の感情状態を記載してください\n"
    
    return system_prompt

# GPT-4/3.5 APIの呼び出し
def chat_with_gpt(profile, current_emotions, user_message):
    system_prompt = create_gpt_prompt(profile, current_emotions)
    
    response = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message}
        ]
    )
    
    return response.choices[0].message["content"]
```

#### 4.3.2 Anthropic Claude

- XMLタグを使用して感情システムと記憶システムの構造化
- 人格情報、感情モデル、記憶システムを明確に分離
- 関連性ネットワークのルールを詳細に記述

Pythonでの実装例：
```python
def create_claude_prompt(profile, current_emotions):
    prompt = "<instructions>\n"
    prompt += "あなたはUPPS改訂版2025.2に基づく対話システムです。\n"
    prompt += "以下の人格情報、感情システム、記憶システムに基づいて応答してください。\n"
    prompt += "</instructions>\n\n"
    
    # 基本情報
    prompt += "<profile>\n"
    prompt += f"名前: {profile['personal_info']['name']}\n"
    prompt += f"年齢: {profile['personal_info'].get('age', '不明')}\n"
    prompt += f"性別: {profile['personal_info'].get('gender', '不明')}\n"
    prompt += f"職業: {profile['personal_info'].get('occupation', '不明')}\n\n"
    prompt += f"背景:\n{profile['background']}\n\n"
    
    # 性格特性
    prompt += "性格特性:\n"
    for trait, value in profile['personality']['traits'].items():
        prompt += f"- {trait}: {value}\n"
    prompt += "</profile>\n\n"
    
    # 感情システム
    if "emotion_system" in profile:
        prompt += "<emotion_system>\n"
        prompt += f"モデル: {profile['emotion_system']['model']}\n\n"
        
        prompt += "基本感情:\n"
        for emotion, data in profile['emotion_system'].get('emotions', {}).items():
            prompt += f"- {emotion}: ベースライン {data['baseline']}, {data.get('description', '')}\n"
        
        if 'additional_emotions' in profile['emotion_system']:
            prompt += "\n追加感情:\n"
            for emotion, data in profile['emotion_system'].get('additional_emotions', {}).items():
                prompt += f"- {emotion}: ベースライン {data['baseline']}, {data.get('description', '')}\n"
        prompt += "</emotion_system>\n\n"
    
    # 現在の感情状態
    prompt += "<current_state>\n"
    for emotion, value in current_emotions.items():
        prompt += f"{emotion}: {value}\n"
    prompt += "</current_state>\n\n"
    
    # 記憶システム
    if "memory_system" in profile:
        prompt += "<memory_system>\n"
        for memory in profile['memory_system'].get('memories', []):
            prompt += f"ID: {memory['id']}\n"
            prompt += f"タイプ: {memory['type']}\n"
            prompt += f"内容: {memory['content']}\n"
            if 'period' in memory:
                prompt += f"時期: {memory['period']}\n"
            prompt += "\n"
        prompt += "</memory_system>\n\n"
    
    # 認知能力システム
    if "cognitive_system" in profile:
        prompt += "<cognitive_system>\n"
        abilities = profile['cognitive_system'].get('abilities', {})
        for ability_name, ability_data in abilities.items():
            prompt += f"{ability_name}: レベル {ability_data['level']}, {ability_data.get('description', '')}\n"
        prompt += "</cognitive_system>\n\n"
    
    # 指示
    prompt += "<rules>\n"
    prompt += "1. 上記の人格情報に基づいて一貫した応答をする\n"
    prompt += "2. 感情状態に応じた反応を示す\n"
    prompt += "3. 関連するキーワードが出てきたら、対応する記憶を自然に想起する\n"
    prompt += "4. 認知能力レベルに適した表現を使用する\n"
    prompt += "5. 各応答の最後に【状態】セクションで現在の感情状態を記載する\n"
    prompt += "</rules>\n\n"
    
    return prompt

# Claude APIの呼び出し
def chat_with_claude(profile, current_emotions, user_message):
    prompt = create_claude_prompt(profile, current_emotions)
    prompt += f"\nHuman: {user_message}\n\nAssistant:"
    
    response = anthropic.Completion.create(
        model="claude-2",
        prompt=prompt,
        max_tokens_to_sample=1000,
        stop_sequences=["Human:"]
    )
    
    return response.completion
```

#### 4.3.3 Google Gemini

- 簡潔かつ構造化された指示を優先
- JSON形式での感情システムと記憶システムの提示
- 明確な状態管理ルールと記憶想起ルールの提供

Pythonでの実装例：
```python
import json

def create_gemini_prompt(profile, current_emotions):
    # 基本情報
    basic_info = {
        "name": profile['personal_info']['name'],
        "age": profile['personal_info'].get('age', "不明"),
        "gender": profile['personal_info'].get('gender', "不明"),
        "occupation": profile['personal_info'].get('occupation', "不明"),
        "background": profile['background'],
        "personality": {trait: value for trait, value in profile['personality']['traits'].items()}
    }
    
    # 感情システム
    emotion_system = {}
    if "emotion_system" in profile:
        emotion_system = {
            "model": profile['emotion_system']['model'],
            "emotions": {emotion: data for emotion, data in profile['emotion_system'].get('emotions', {}).items()},
            "additional_emotions": {emotion: data for emotion, data in profile['emotion_system'].get('additional_emotions', {}).items() if 'additional_emotions' in profile['emotion_system']}
        }
    
    # 記憶システム
    memory_system = {}
    if "memory_system" in profile:
        memory_system = {
            "memories": [memory for memory in profile['memory_system'].get('memories', [])]
        }
    
    # 認知能力システム
    cognitive_system = {}
    if "cognitive_system" in profile:
        cognitive_system = {
            "model": profile['cognitive_system']['model'],
            "abilities": {ability: data for ability, data in profile['cognitive_system'].get('abilities', {}).items()},
            "general_ability": profile['cognitive_system'].get('general_ability', {})
        }
    
    # 現在の感情状態
    current_state = {emotion: value for emotion, value in current_emotions.items()}
    
    # プロンプトの構築
    prompt = "# UPPS人格シミュレーション - 拡張感情・記憶システム対応\n\n"
    prompt += "Role: あなたはUPPSプロファイルに基づく人格として対話します\n\n"
    
    prompt += "## プロファイル情報\n"
    prompt += json.dumps(basic_info, ensure_ascii=False, indent=2)
    prompt += "\n\n"
    
    prompt += "## 感情システム\n