import { afterEach, describe, expect, it } from 'vitest'
import { ENV, isSupabaseConfigured } from './env.js'

const original = { ...ENV }
afterEach(() => Object.assign(ENV, original))

describe('isSupabaseConfigured', () => {
    it('é falso por padrão (fallback estático)', () => {
        expect(isSupabaseConfigured()).toBe(false)
    })

    it('exige flag, URL e anon key', () => {
        Object.assign(ENV, { USE_SUPABASE: true, SUPABASE_URL: 'https://x.supabase.co' })
        expect(isSupabaseConfigured()).toBe(false)

        ENV.SUPABASE_ANON_KEY = 'anon'
        expect(isSupabaseConfigured()).toBe(true)
    })
})
