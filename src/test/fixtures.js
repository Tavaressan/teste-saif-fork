// Fixtures de teste do web. Lê o artefato real do pipeline (contrato em
// shared/heatmaps/) e o reduz, para os testes não dependerem de 500 KB.
import fs from 'node:fs'
import path from 'node:path'

const HEATMAP = path.resolve(__dirname, '../../shared/heatmaps/heatmap_points.json')

export function validHeatmapPayload(nPoints = 5) {
    const full = JSON.parse(fs.readFileSync(HEATMAP, 'utf8'))
    const points = full.points.slice(0, nPoints)
    return { meta: full.meta, count: points.length, points }
}

// Resposta mínima compatível com o que o loader usa de `fetch`.
export function jsonResponse(body, { ok = true, status = 200 } = {}) {
    return { ok, status, json: async () => body }
}
