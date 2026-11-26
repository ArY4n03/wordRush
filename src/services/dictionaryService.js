import { GAME_CONFIG } from '../game/gameConfig.js'

export class DictionaryServiceError extends Error {
  constructor(message, code = 'DICTIONARY_UNAVAILABLE') {
    super(message)
    this.name = 'DictionaryServiceError'
    this.code = code
  }
}

/**
 * Default dictionary provider using the public Free Dictionary API.
 * Strictly distinguishes HTTP 404 (word does not exist) from network/API errors
 * so words are NEVER accepted simply because the API is down.
 */
export class FreeDictionaryApiProvider {
  constructor({ baseUrl = 'https://api.dictionaryapi.dev/api/v2/entries/en', fetchImpl = null } = {}) {
    this.baseUrl = baseUrl
    this.fetchImpl = fetchImpl
  }

  async lookup(word, { signal } = {}) {
    const fetchFn = this.fetchImpl || (typeof fetch !== 'undefined' ? fetch.bind(globalThis) : null)
    if (!fetchFn) {
      throw new DictionaryServiceError('Fetch API is unavailable in this environment.')
    }

    const url = `${this.baseUrl}/${encodeURIComponent(word.toLowerCase())}`
    let response
    try {
      response = await fetchFn(url, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal,
      })
    } catch (error) {
      if (error && error.name === 'AbortError') {
        throw new DictionaryServiceError('Dictionary lookup timed out. Please try again.')
      }
      throw new DictionaryServiceError('Unable to reach dictionary service. Check your connection.')
    }

    if (response.status === 404) {
      return { exists: false }
    }

    if (!response.ok) {
      throw new DictionaryServiceError(`Dictionary service returned status ${response.status}.`)
    }

    let data
    try {
      data = await response.json()
    } catch {
      throw new DictionaryServiceError('Dictionary service returned an invalid response.')
    }

    const exists = Array.isArray(data) && data.length > 0 && typeof data[0]?.word === 'string'
    const definition =
      exists && Array.isArray(data[0]?.meanings) && data[0].meanings[0]?.definitions?.[0]?.definition
        ? data[0].meanings[0].definitions[0].definition
        : undefined

    return { exists, definition }
  }
}

/**
 * Modular dictionary validation service with in-memory session caching
 * (caches definitive hits/misses only; never caches transient API errors).
 */
export class DictionaryService {
  constructor(provider = new FreeDictionaryApiProvider(), { timeoutMs = GAME_CONFIG.DICTIONARY_TIMEOUT_MS } = {}) {
    this.provider = provider
    this.timeoutMs = timeoutMs
    this.cache = new Map()
  }

  setProvider(provider) {
    this.provider = provider
    this.cache.clear()
  }

  async verifyWord(rawWord) {
    const word = String(rawWord || '').trim().toLowerCase()
    if (!word) {
      return { exists: false }
    }

    if (this.cache.has(word)) {
      return this.cache.get(word)
    }

    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null
    const timer =
      controller && this.timeoutMs > 0
        ? setTimeout(() => controller.abort(), this.timeoutMs)
        : null

    try {
      const result = await this.provider.lookup(word, { signal: controller?.signal })
      if (result && typeof result.exists === 'boolean') {
        this.cache.set(word, result)
        return result
      }
      throw new DictionaryServiceError('Unexpected response from dictionary provider.')
    } finally {
      if (timer) clearTimeout(timer)
    }
  }
}

export const dictionaryService = new DictionaryService()
