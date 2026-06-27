#!/usr/bin/env bash
# =============================================================================
# generate-api-client.sh
#
# 何を生成するか:
#   1. TypeScript クライアント (typescript-fetch)
#      → mobile/src/shared/api/ へ出力（モバイルアプリ向け）
#   2. Kotlin Spring Boot サーバースタブ (kotlin-spring, interfaceOnly)
#      → backend/build/generated/ へ出力（バックエンド向け）
#
# 前提ツール:
#   - Node.js / npx（openapi-generator-cli を npx 経由で実行）
#
# 出力先:
#   - mobile/src/shared/api/       ← .gitignore 対象（コミットしない）
#   - backend/build/generated/     ← .gitignore 対象（コミットしない）
#
# 再生成が必要なタイミング:
#   - api/openapi.yaml を変更したとき
# =============================================================================

set -euo pipefail

# スクリプトの場所からリポジトリルートを求める
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$SCRIPT_DIR/.."

OPENAPI_SPEC="$REPO_ROOT/api/openapi.yaml"

# ─── 事前チェック ───────────────────────────────────────────
if [[ ! -f "$OPENAPI_SPEC" ]]; then
  echo "[ERROR] OpenAPI スキーマが見つかりません: $OPENAPI_SPEC"
  exit 1
fi

echo "[INFO] 生成元スキーマ: $OPENAPI_SPEC"

# ─── ① TypeScript クライアント生成（モバイル向け） ─────────
TS_OUT="$REPO_ROOT/mobile/src/shared/api"

echo "[INFO] TypeScript クライアントを生成します → $TS_OUT"

# クリーンな状態にしてから生成
rm -rf "$TS_OUT"
mkdir -p "$TS_OUT"

npx --yes @openapitools/openapi-generator-cli generate \
  --input-spec "$OPENAPI_SPEC" \
  --generator-name typescript-fetch \
  --output "$TS_OUT" \
  --additional-properties=typescriptThreePlus=true

echo "[SUCCESS] TypeScript クライアント生成完了: $TS_OUT"

# ─── ② Kotlin Spring Boot サーバースタブ生成（バックエンド向け） ───
KT_OUT="$REPO_ROOT/backend/build/generated"

echo "[INFO] Kotlin Spring Boot サーバースタブを生成します → $KT_OUT"

# クリーンな状態にしてから生成
rm -rf "$KT_OUT"
mkdir -p "$KT_OUT"

npx --yes @openapitools/openapi-generator-cli generate \
  --input-spec "$OPENAPI_SPEC" \
  --generator-name kotlin-spring \
  --output "$KT_OUT" \
  --additional-properties=interfaceOnly=true,useSpringBoot3=true,reactive=false

echo "[SUCCESS] Kotlin Spring Boot サーバースタブ生成完了: $KT_OUT"

echo ""
echo "[DONE] すべての生成が完了しました。"
echo "       OpenAPI スキーマ変更時は再度このスクリプトを実行してください。"
