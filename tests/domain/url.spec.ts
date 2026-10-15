import { describe, expect, it } from 'vitest'
import { HttpUrl } from '~/domain/url'

describe('validation', () => {
  it('accepts http and https', () => {
    expect(HttpUrl.is('https://acme.no')).toBe(true)
    expect(HttpUrl.is('http://acme.no')).toBe(true)
  })

  it('rejects the schemes that turn a stored link into an attack', () => {
    expect(HttpUrl.is('javascript:alert(1)')).toBe(false)
    expect(HttpUrl.is('data:text/html,<script>alert(1)</script>')).toBe(false)
    expect(HttpUrl.is('file:///etc/passwd')).toBe(false)
  })

  it('rejects anything that is not an absolute address', () => {
    expect(HttpUrl.is('acme.no')).toBe(false)
    expect(HttpUrl.is('/about')).toBe(false)
    expect(HttpUrl.is('')).toBe(false)
    expect(HttpUrl.is(42)).toBe(false)
    expect(HttpUrl.is(null)).toBe(false)
  })
})

describe('canonicalisation', () => {
  it('supplies the empty path and lowercases the host', () => {
    expect(HttpUrl.parse('https://ACME.no')).toBe('https://acme.no/')
  })

  it('makes links that differ only in spelling compare equal', () => {
    expect(HttpUrl.parse('https://acme.no')).toBe(
      HttpUrl.parse('https://ACME.no/'),
    )
  })

  it('leaves path, query and fragment alone', () => {
    const url = 'https://acme.no/careers?ref=etd#open'
    expect(HttpUrl.parse(url)).toBe(url)
  })
})

describe('parse and tryParse', () => {
  it('throws on parse and returns null on tryParse', () => {
    expect(() => HttpUrl.parse('nonsense')).toThrow(RangeError)
    expect(HttpUrl.tryParse('nonsense')).toBeNull()
    expect(HttpUrl.tryParse('https://acme.no')).toBe('https://acme.no/')
  })

  it('guarantees new URL() cannot throw on a parsed value', () => {
    expect(new URL(HttpUrl.parse('https://acme.no/careers')).hostname).toBe(
      'acme.no',
    )
  })
})

describe('the brand', () => {
  it('cannot be satisfied by a bare string', () => {
    // @ts-expect-error an unvalidated literal is not an HttpUrl
    const bad: HttpUrl = 'https://acme.no/'
    expect(typeof bad).toBe('string')
  })

  it('is still usable anywhere a string is wanted, such as a component prop', () => {
    const webpage: string = HttpUrl.parse('https://acme.no')
    expect(webpage).toBe('https://acme.no/')
  })
})
