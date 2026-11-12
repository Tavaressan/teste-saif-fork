#!/usr/bin/env bash
# Start the official React/Vite app.
set -euo pipefail

PORT="${PORT:-5173}"
OPEN_BROWSER=1

while [[ $# -gt 0 ]]; do
    case "$1" in
        --no-open) OPEN_BROWSER=0; shift ;;
        --port)
            [[ $# -ge 2 ]] || { echo "Missing value for --port" >&2; exit 1; }
            PORT="$2"
            shift 2
            ;;
        -h|--help)
            echo "Usage: ./tools/start.sh [--port PORT] [--no-open]"
            exit 0
            ;;
        *) echo "Unknown option: $1 (try --help)" >&2; exit 1 ;;
    esac
done

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
APP_URL="http://localhost:${PORT}/"

printf "Starting the official SAIFEN app at %s\n" "$APP_URL"
npm run dev -- --host 0.0.0.0 --port "$PORT" &
SERVER_PID=$!

cleanup() {
    kill "$SERVER_PID" 2>/dev/null || true
    wait "$SERVER_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

for _ in $(seq 1 40); do
    if curl -sf -o /dev/null "$APP_URL"; then
        if [[ "$OPEN_BROWSER" -eq 1 ]]; then
            if command -v open >/dev/null 2>&1; then
                open "$APP_URL"
            elif command -v xdg-open >/dev/null 2>&1; then
                xdg-open "$APP_URL" >/dev/null 2>&1 &
            fi
        fi
        wait "$SERVER_PID"
        exit $?
    fi
    if ! kill -0 "$SERVER_PID" 2>/dev/null; then
        wait "$SERVER_PID"
        exit $?
    fi
    sleep 0.25
done

echo "Vite did not become available at $APP_URL" >&2
exit 1
