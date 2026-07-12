#!/usr/bin/env bash
# ITSM_CURSOR 프로덕션 기동: 프론트 빌드 후 FastAPI 단일 포트(:8000) 서빙
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
BACKEND="$ROOT/5_ITSM관리/backend"
FRONTEND="$ROOT/5_ITSM관리/frontend"
PORT="${PORT:-8000}"
export MGMT_PASSWORD="${MGMT_PASSWORD:-7587}"

echo "[prod] build frontend → dist"
cd "$FRONTEND"
npm install --silent
npm run build

echo "[prod] serve API + SPA on :$PORT"
cd "$BACKEND"
exec python3 -m uvicorn app:app --host 0.0.0.0 --port "$PORT"
