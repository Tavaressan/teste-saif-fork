# `tools/` — Dev scripts

| script | purpose |
|--------|---------|
| **`start.sh`** | Start the official React/Vite app at `:5173` and open the browser |
| `start-legacy.sh [port]` | Start the deprecated static web app at `:8000` |
| `dev-web.sh [port]` | Serve the repo root for the legacy web app and shared assets |
| `run-pipeline.sh` | Python pipeline (`saifen-pipeline update`; `--force` rebuilds) |

```bash
./tools/start.sh                 # official React app
./tools/start.sh --no-open        # skip browser launch
./tools/start-legacy.sh           # deprecated static app at /web/
./tools/dev-web.sh               # legacy/static server only
./tools/run-pipeline.sh --force  # pipeline only
npm run train                    # same as run-pipeline.sh
```

All scripts `cd` to the monorepo root automatically.
Heatmap training remains separate from app startup.

Agent playbook (verify source → update KDE heatmap → check artifacts): [docs/agents/heatmap-pipeline.md](../docs/agents/heatmap-pipeline.md)

Qualidade (pytest, ruff, CI): [docs/agents/quality.md](../docs/agents/quality.md)
