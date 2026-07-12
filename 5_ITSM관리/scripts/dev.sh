#!/usr/bin/env bash
# ITSM_CURSOR 개발 기동 (백엔드 :8000 + 프론트 :5173)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
BACKEND="$ROOT/5_ITSM관리/backend"
FRONTEND="$ROOT/5_ITSM관리/frontend"
export MGMT_PASSWORD="${MGMT_PASSWORD:-7587}"

cleanup() {
  [[ -n "${UV_PID:-}" ]] && kill "$UV_PID" 2>/dev/null || true
  [[ -n "${VT_PID:-}" ]] && kill "$VT_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

echo "[dev] backend :8000 (MGMT_PASSWORD set)"
cd "$BACKEND"
python3 -m uvicorn app:app --host 0.0.0.0 --port 8000 --reload &
UV_PID=$!

echo "[dev] frontend :5173"
cd "$FRONTEND"
npm run dev -- --host 0.0.0.0 --port 5173 &
VT_PID=$!

echo "[dev] open http://localhost:5173"
wait
