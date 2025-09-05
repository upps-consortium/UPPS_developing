#!/usr/bin/env python3
"""Utility functions for UPPS validators."""

from __future__ import annotations

import os
from typing import Dict, Set, Tuple

import yaml
import jsonschema
from jsonschema import validate


def load_yaml(file_path: str) -> Dict:
    """Load YAML file and return dictionary."""
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            return yaml.safe_load(f)
    except Exception as e:
        raise RuntimeError(f"YAMLファイルの読み込みに失敗しました: {e}")


def load_schema(schema_path: str | None = None) -> Tuple[Dict, str]:
    """Load UPPS schema. If schema_path is None, search common locations."""
    possible_paths = []
    if schema_path:
        possible_paths.append(schema_path)
    possible_paths.extend(
        [
            os.path.join(os.path.dirname(__file__), "upps_schema.yaml"),
            "upps_schema.yaml",
            "../schema/upps_schema.yaml",
            "../specification/schema/upps_schema.yaml",
            "specification/schema/upps_schema.yaml",
        ]
    )
    for path in possible_paths:
        if os.path.exists(path):
            return load_yaml(path), path
    raise FileNotFoundError("UPPSスキーマファイル(upps_schema.yaml)が見つかりません")


def validate_schema(profile: Dict, schema: Dict) -> bool:
    """Validate profile against JSON schema."""
    try:
        validate(instance=profile, schema=schema)
        print("✅ スキーマ検証: 成功")
        return True
    except jsonschema.exceptions.ValidationError as e:
        print(f"❌ スキーマ検証: 失敗\n{e}")
        return False


def collect_emotion_ids(profile: Dict) -> Set[str]:
    ids: Set[str] = set()
    if "emotion_system" in profile:
        es = profile["emotion_system"]
        ids.update(es.get("emotions", {}).keys())
        ids.update(es.get("additional_emotions", {}).keys())
        ids.update(es.get("compound_emotions", {}).keys())
    return ids


def collect_memory_ids(profile: Dict) -> Set[str]:
    ids: Set[str] = set()
    if "memory_system" in profile:
        for memory in profile["memory_system"].get("memories", []):
            if "id" in memory:
                ids.add(memory["id"])
    return ids


def validate_emotion_references(profile: Dict) -> bool:
    valid = True
    if "emotion_system" not in profile:
        print("⚠️ emotion_systemフィールドが見つかりません。感情参照検証をスキップします")
        return True
    emotion_ids = collect_emotion_ids(profile)
    if "current_emotion_state" in profile:
        for emotion_id in profile["current_emotion_state"].keys():
            if emotion_id not in emotion_ids:
                print(
                    f"❌ current_emotion_stateで参照されている感情 '{emotion_id}' はemotion_systemで定義されていません"
                )
                valid = False
    if "memory_system" in profile:
        for i, memory in enumerate(profile["memory_system"].get("memories", [])):
            if "associated_emotions" in memory:
                for emotion_id in memory["associated_emotions"]:
                    if emotion_id not in emotion_ids:
                        mem_id = memory.get("id", f"memory_{i}")
                        print(
                            f"❌ 記憶ID '{mem_id}' の関連感情 '{emotion_id}' はemotion_systemで定義されていません"
                        )
                        valid = False
    if valid:
        print("✅ 感情参照の検証: 成功")
    return valid


def validate_memory_references(profile: Dict) -> bool:
    valid = True
    if "memory_system" not in profile:
        print("⚠️ memory_systemフィールドが見つかりません。記憶参照検証をスキップします")
        return True
    id_counts: Dict[str, int] = {}
    for memory in profile["memory_system"].get("memories", []):
        mem_id = memory.get("id")
        if mem_id:
            id_counts[mem_id] = id_counts.get(mem_id, 0) + 1
    for mem_id, count in id_counts.items():
        if count > 1:
            print(f"❌ 記憶ID '{mem_id}' が複数回（{count}回）定義されています")
            valid = False
    if valid:
        print("✅ 記憶参照の検証: 成功")
    return valid


def validate_association_references(profile: Dict) -> bool:
    valid = True
    if "association_system" not in profile:
        print("⚠️ association_systemフィールドが見つかりません。関連性参照検証をスキップします")
        return True
    emotion_ids = collect_emotion_ids(profile)
    memory_ids = collect_memory_ids(profile)
    for i, assoc in enumerate(profile["association_system"].get("associations", [])):
        trigger = assoc.get("trigger", {})
        if "type" in trigger:
            if trigger["type"] == "memory" and "id" in trigger:
                if trigger["id"] not in memory_ids:
                    print(
                        f"❌ 関連性 #{i+1}: トリガーが存在しない記憶ID '{trigger['id']}' を参照しています"
                    )
                    valid = False
            elif trigger["type"] == "emotion" and "id" in trigger:
                if trigger["id"] not in emotion_ids:
                    print(
                        f"❌ 関連性 #{i+1}: トリガーが存在しない感情ID '{trigger['id']}' を参照しています"
                    )
                    valid = False
        elif "operator" in trigger:
            for j, condition in enumerate(trigger.get("conditions", [])):
                if condition.get("type") == "memory" and "id" in condition:
                    if condition["id"] not in memory_ids:
                        print(
                            f"❌ 関連性 #{i+1}, 条件 #{j+1}: 条件が存在しない記憶ID '{condition['id']}' を参照しています"
                        )
                        valid = False
                elif condition.get("type") == "emotion" and "id" in condition:
                    if condition["id"] not in emotion_ids:
                        print(
                            f"❌ 関連性 #{i+1}, 条件 #{j+1}: 条件が存在しない感情ID '{condition['id']}' を参照しています"
                        )
                        valid = False
        response = assoc.get("response", {})
        if response.get("type") == "memory" and "id" in response:
            if response["id"] not in memory_ids:
                print(
                    f"❌ 関連性 #{i+1}: レスポンスが存在しない記憶ID '{response['id']}' を参照しています"
                )
                valid = False
        elif response.get("type") == "emotion" and "id" in response:
            if response["id"] not in emotion_ids:
                print(
                    f"❌ 関連性 #{i+1}: レスポンスが存在しない感情ID '{response['id']}' を参照しています"
                )
                valid = False
    if valid:
        print("✅ 関連性参照の検証: 成功")
    return valid


def validate_cognitive_system(profile: Dict) -> bool:
    valid = True
    if "cognitive_system" not in profile:
        print("⚠️ cognitive_systemフィールドが見つかりません。認知能力検証をスキップします")
        return True
    if "model" not in profile["cognitive_system"]:
        print("❌ cognitive_systemにmodelフィールドがありません")
        valid = False
    if "abilities" not in profile["cognitive_system"]:
        print("❌ cognitive_systemにabilitiesフィールドがありません")
        return False
    required_abilities = [
        "verbal_comprehension",
        "perceptual_reasoning",
        "working_memory",
        "processing_speed",
    ]
    for ability in required_abilities:
        if ability not in profile["cognitive_system"]["abilities"]:
            print(f"❌ cognitive_systemのabilities内に'{ability}'能力がありません")
            valid = False
        elif "level" not in profile["cognitive_system"]["abilities"][ability]:
            print(f"❌ cognitive_systemの'{ability}'能力にlevelフィールドがありません")
            valid = False
    if "general_ability" in profile["cognitive_system"]:
        if "level" not in profile["cognitive_system"]["general_ability"]:
            print("❌ cognitive_systemのgeneral_abilityにlevelフィールドがありません")
            valid = False
    else:
        print("⚠️ cognitive_systemにgeneral_abilityフィールドがありません")
    if valid:
        print("✅ 認知能力システムの検証: 成功")
    return valid


def validate_references(profile: Dict) -> bool:
    emotion_valid = validate_emotion_references(profile)
    memory_valid = validate_memory_references(profile)
    association_valid = validate_association_references(profile)
    cognitive_valid = validate_cognitive_system(profile)
    return emotion_valid and memory_valid and association_valid and cognitive_valid
