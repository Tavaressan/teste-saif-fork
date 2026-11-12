import { describe, expect, it, vi } from 'vitest'
import { HeatmapLoader } from './HeatmapLoader.js'
import { jsonResponse, validHeatmapPayload } from '../test/fixtures.js'

function mockFetch(body) {
    const fn = vi.fn().mockResolvedValue(jsonResponse(body))
    vi.stubGlobal('fetch', fn)
    return fn
}

describe('HeatmapLoader.loadPoints', () => {
    it('aceita o fixture válido', async () => {
        const payload = validHeatmapPayload()
        mockFetch(payload)

        const result = await new HeatmapLoader().loadPoints()

        expect(result.meta).toEqual(payload.meta)
        expect(result.count).toBe(payload.points.length)
        expect(result.points).toEqual(payload.points)
    })

    it('rejeita payload sem meta', async () => {
        const { meta, ...semMeta } = validHeatmapPayload()
        mockFetch(semMeta)

        await expect(new HeatmapLoader().loadPoints()).rejects.toThrow(/meta/)
    })

    it('rejeita payload sem points', async () => {
        const { points, ...semPoints } = validHeatmapPayload()
        mockFetch(semPoints)

        await expect(new HeatmapLoader().loadPoints()).rejects.toThrow(/points/)
    })
})

describe('HeatmapLoader.pathFor', () => {
    const loader = new HeatmapLoader({ heatmapBase: '/x/' })

    it('usa o artefato geral para tipo/período desconhecidos', () => {
        expect(loader.pathFor('foo', 'bar')).toBe('/x/heatmap_points.json')
    })

    it('monta a fatia tipo + período', () => {
        expect(loader.pathFor('furto', 'noite')).toBe('/x/heatmap_points__furto__noite.json')
    })
})
