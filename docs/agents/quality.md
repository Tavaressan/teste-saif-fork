# Playbook: qualidade (testes + CI)

> **Purpose:** o que um agente ou humano deve rodar para não regressar o SAIFEN.
> **Cwd:** raiz do monorepo, exceto quando o comando diz `cd`.

Cross-refs: [AGENTS.md](../../AGENTS.md) · [heatmap-pipeline.md](heatmap-pipeline.md)

## Ordem sugerida num PR

1. `mobile/` — typecheck, unit tests + cobertura, lint, paridade IMU
2. `pipeline/` — ruff + pytest + cobertura (inclui contrato `shared/`)
3. `pipeline/behavior/` — ruff + pytest + cobertura
4. `supabase/` — contrato estático das RPCs (`python3 supabase/tests/check_sql.py`)
5. `web/` — imports + contrato do heatmap + tidy (erros HTML)

Não treinar KDE só para validar schema: os JSON em `shared/` já estão versionados.

## Comandos locais

### Mobile (`cd mobile`, Node ≥ 22.13)

```bash
npm run typecheck
npm test                 # zone.ts, crimes.ts, profileStore.ts (sem Expo)
npm run test:coverage    # cobertura (node --experimental-test-coverage) + portão
npm run test:parity      # features/score vs fixture Python
npm run lint             # eslint-config-expo
```

Mocks de React Native ficam em `mobile/test/` (`register-cjs.cjs`). `zone-check.cjs` foi removido: as regras vivem em `src/services/zone.ts`.

Cobertura medida com `node --experimental-test-coverage`, com escopo nos serviços cobertos pelos testes unitários (`src/services/zone.ts`, `src/services/crimes.ts`, `src/services/profileStore.ts`). O CI publica o relatório de cobertura como artifact (`mobile-coverage`) e falha abaixo do piso (linhas >= 80%).

### Pipeline heatmap (`cd pipeline`)

```bash
pip install -e ".[test,dev]"
ruff check .
ruff format --check .
pytest -q --cov=saifen_pipeline --cov-report=term-missing --cov-report=xml:coverage.xml --cov-fail-under=70
```

`ruff` ignora `pipeline/behavior/` (pacote irmão). Behavior:

```bash
cd pipeline/behavior
pip install -e ".[test]"
ruff check --select E,F .
pytest -q --cov=behavior_pipeline --cov-report=term-missing --cov-report=xml:coverage.xml --cov-fail-under=60
```

### Web

O CI valida `web/index.html` (tidy, só exit ≥ 2), imports JS e `shared/heatmaps/heatmap_points.json` (`meta` + `points`). Local:

```bash
./tools/dev-web.sh
python3 -c "import json; p=json.load(open('shared/heatmaps/heatmap_points.json')); assert p['meta'] and p['points']"
```

### Supabase RPCs

Sem Docker. O CI e o check local leem o SQL versionado:

```bash
python3 supabase/tests/check_sql.py
```

Isso confirma `device_required`, clamp `[50, 2000]` e limiares iguais a `zone.ts`.
`supabase/tests/rpcs.sql` fica como script opcional para quando houver Postgres.

## Workflows GitHub

| Workflow | Quando | O que faz |
|----------|--------|-----------|
| `mobile-ci.yml` | push/PR em `mobile/**` | typecheck, `npm run test:coverage` (cobertura publicada + piso), parity, lint; `expo-doctor` não bloqueia |
| `pipeline-ci.yml` | push/PR em `pipeline/**` e schemas `shared/` | ruff + pytest-cov + contrato JSON; publica cobertura (`pipeline-coverage`) e falha abaixo do piso |
| `pipeline.yml` | `main` + xlsx/schedule/`workflow_dispatch` | pytest **antes** do treino; commit de `shared/` só em `main` |
| `behavior-ci.yml` | `pipeline/behavior/**` | ruff (E,F) + pytest-cov; publica cobertura (`behavior-coverage`) e falha abaixo do piso |
| `web-ci.yml` | `web/**` | tidy (erros), imports, contrato heatmap |
| `supabase-ci.yml` | `supabase/**` | contrato estático das RPCs (sem Docker) |
| `supabase-migrate.yml` | manual | `db push` em staging/prod |

## Cobertura e portões por módulo

O CI publica a cobertura dos três módulos e falha se algum ficar abaixo do piso configurado:

| Módulo | Medição | Piso atual | Artefato publicado |
|--------|---------|------------|--------------------|
| `mobile` | `node --experimental-test-coverage`, escopo em `zone.ts`, `crimes.ts`, `profileStore.ts` | linhas >= 80% | `mobile-coverage` (`coverage.txt`) |
| `pipeline` | `pytest --cov=saifen_pipeline` (term + xml) | `--cov-fail-under=70` | `pipeline-coverage` (`coverage.xml`) |
| `pipeline/behavior` | `pytest --cov=behavior_pipeline` (term + xml) | `--cov-fail-under=60` | `behavior-coverage` (`coverage.xml`) |

Meta: subir os pisos gradualmente conforme o resultado real medido em CI (o piso do `pipeline` foi elevado de 50% para 70%). Para validar o portão localmente ou em PR, reduza artificialmente a cobertura (ex.: exclua/skip testes ou baixe o `--cov-fail-under`/`--test-coverage-lines` abaixo do valor real) e confirme que o job falha.

## Contratos que não podem divergir

- JSON: [`shared/schema/*.schema.json`](../../shared/schema) · [shared/README.md](../../shared/README.md)
- Zona `low/medium/high/critical`: [`mobile/src/services/zone.ts`](../../mobile/src/services/zone.ts) e `zone_risk` na migration 006 (mesmos limiares; `check_sql.py` + `zone.test.ts`)
- `report_crime`: `p_device_id` obrigatório (rate limit). `SECURITY DEFINER` + `GRANT anon` é MVP sem login — não tratar UUID do app como identidade.
