import { describe, expect, it } from 'vitest'
import {
  DictionaryService,
  DictionaryServiceError,
  FreeDictionaryApiProvider,
} from '../src/services/dictionaryService.js'

describe('DictionaryService', () => {
  it('returns exists: true for HTTP 200 and caches valid words', async () => {
    let calls = 0
    const provider = new FreeDictionaryApiProvider({
      fetchImpl: async () => {
        calls += 1
        return {
          status: 200,
          ok: true,
          async json() {
            return [{ word: 'fern', meanings: [{ definitions: [{ definition: 'A flowerless plant.' }] }] }]
          },
        }
      },
    })
    const service = new DictionaryService(provider)

    const r1 = await service.verifyWord('fern')
    const r2 = await service.verifyWord('FERN')
    expect(r1.exists).toBe(true)
    expect(r2.exists).toBe(true)
    expect(calls).toBe(1)
  })

  it('returns exists: false for HTTP 404', async () => {
    const provider = new FreeDictionaryApiProvider({
      fetchImpl: async () => ({ status: 404, ok: false }),
    })
    const service = new DictionaryService(provider)
    const res = await service.verifyWord('zzzzqwert')
    expect(res.exists).toBe(false)
  })

  it('throws DictionaryServiceError on 500 or network error and does not cache failures', async () => {
    let shouldFail = true
    const provider = new FreeDictionaryApiProvider({
      fetchImpl: async () => {
        if (shouldFail) {
          return { status: 503, ok: false }
        }
        return {
          status: 200,
          ok: true,
          async json() {
            return [{ word: 'moss' }]
          },
        }
      },
    })
    const service = new DictionaryService(provider)

    await expect(service.verifyWord('moss')).rejects.toThrow(DictionaryServiceError)

    shouldFail = false
    const recovered = await service.verifyWord('moss')
    expect(recovered.exists).toBe(true)
  })
})
