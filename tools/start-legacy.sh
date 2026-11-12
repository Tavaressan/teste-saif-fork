#!/usr/bin/env bash
# Start the deprecated static web frontend. Use tools/start.sh for the official app.
set -euo pipefail

exec "$(dirname "${BASH_SOURCE[0]}")/dev-web.sh" "$@"
