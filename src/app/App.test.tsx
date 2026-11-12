import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { jsonResponse, validHeatmapPayload } from '../test/fixtures.js'

// Leaflet não roda em jsdom: o wrapper imperativo do mapa é substituído por um
// dublê que aceita qualquer chamada (init, applyFilters, camadas...).
vi.mock('../map/CrimeMap.js', () => {
  const noop: any = new Proxy(function () {}, {
    get: () => noop,
    apply: () => undefined,
  })
  class CrimeMap {
    constructor() {
      return new Proxy(this, { get: (t, p) => (p in t ? (t as any)[p] : noop) })
    }
  }
  return { CrimeMap }
})

import App from './App'

describe('<App /> smoke', () => {
  beforeEach(() => {
    // jsdom não implementa ResizeObserver (usado pelo layout do HUD).
    vi.stubGlobal(
      'ResizeObserver',
      class { observe() {} unobserve() {} disconnect() {} },
    )
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse(validHeatmapPayload())),
    )
  })

  it('renderiza sem erro com o heatmap mockado e mostra a navegação do HUD', () => {
    render(<App />)

    expect(screen.getByText('MAPA')).toBeInTheDocument()
    expect(screen.getByText('PONTOS')).toBeInTheDocument()
    expect(screen.getByText('STATS')).toBeInTheDocument()
  })
})
