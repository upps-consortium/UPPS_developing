#!/usr/bin/env python3
"""UPPS Validator CLI.

This script validates UPPS persona profiles. By default it performs
schema validation and reference integrity checks. Specific modes can be
selected with command line flags.
"""

import argparse
from typing import Dict

from validator_utils import (
    load_yaml,
    load_schema,
    validate_schema,
    validate_references,
)

def run_schema_validation(profile: Dict, schema_path: str | None) -> bool:
    schema, resolved_path = load_schema(schema_path)
    print(f"スキーマ: {resolved_path}")
    return validate_schema(profile, schema)

def run_reference_validation(profile: Dict) -> bool:
    return validate_references(profile)

def main() -> None:
    parser = argparse.ArgumentParser(description="UPPS Validator")
    parser.add_argument("profile", help="Path to UPPS profile YAML")
    parser.add_argument("--schema", action="store_true", help="Run only schema validation")
    parser.add_argument(
        "--reference",
        action="store_true",
        help="Run only reference integrity validation",
    )
    parser.add_argument("--all", action="store_true", help="Run all validations")
    parser.add_argument("--schema-path", help="Path to UPPS schema file")

    args = parser.parse_args()

    if not (args.schema or args.reference or args.all):
        args.all = True

    profile = load_yaml(args.profile)

    success = True
    if args.schema or args.all:
        success = run_schema_validation(profile, args.schema_path) and success
    if args.reference or args.all:
        success = run_reference_validation(profile) and success

    if success:
        print("✅ すべての検証に合格しました！")
    else:
        print("⚠️ 一部の検証で問題が見つかりました。上記の警告を確認してください。")

if __name__ == "__main__":
    main()
