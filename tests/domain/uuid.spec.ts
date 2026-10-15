import { describe, expect, it } from 'vitest'
import { UUIDv4 } from '~/domain/uuid'

const V4 = '038e776a-46dd-4194-bc74-5d84d1a18700'

describe('validation', () => {
  it('accepts a version 4 UUID', () => {
    expect(UUIDv4.is(V4)).toBe(true)
  })

  it('rejects the other versions, which differ only in one nibble', () => {
    expect(UUIDv4.is('038e776a-46dd-1194-bc74-5d84d1a18700')).toBe(false) // v1
    expect(UUIDv4.is('038e776a-46dd-3194-bc74-5d84d1a18700')).toBe(false) // v3
    expect(UUIDv4.is('038e776a-46dd-5194-bc74-5d84d1a18700')).toBe(false) // v5
    expect(UUIDv4.is('038e776a-46dd-7194-bc74-5d84d1a18700')).toBe(false) // v7
  })

  it('rejects the nil UUID', () => {
    expect(UUIDv4.is('00000000-0000-0000-0000-000000000000')).toBe(false)
  })

  it('rejects a wrong RFC 4122 variant', () => {
    // The variant nibble must be 8, 9, a or b.
    expect(UUIDv4.is('038e776a-46dd-4194-0c74-5d84d1a18700')).toBe(false)
    expect(UUIDv4.is('038e776a-46dd-4194-cc74-5d84d1a18700')).toBe(false)
    expect(UUIDv4.is('038e776a-46dd-4194-bc74-5d84d1a18700')).toBe(true)
  })

  it('rejects anything the template literal type would have let through', () => {
    expect(UUIDv4.is('a-b-c-d-e')).toBe(false)
    expect(UUIDv4.is('038e776a46dd4194bc745d84d1a18700')).toBe(false) // unhyphenated
    expect(UUIDv4.is(`${V4} `)).toBe(false)
    expect(UUIDv4.is(`{${V4}}`)).toBe(false) // braced form
    expect(UUIDv4.is('038e776a-46dd-4194-bc74-5d84d1a1870g')).toBe(false) // non-hex
    expect(UUIDv4.is('')).toBe(false)
    expect(UUIDv4.is(42)).toBe(false)
    expect(UUIDv4.is(null)).toBe(false)
  })
})

describe('canonicalisation', () => {
  it('accepts either case but stores lowercase', () => {
    expect(UUIDv4.parse(V4.toUpperCase())).toBe(V4)
    expect(UUIDv4.tryParse(V4.toUpperCase())).toBe(V4)
  })

  it('makes the same id compare equal however it was spelled', () => {
    expect(UUIDv4.parse(V4)).toBe(UUIDv4.parse(V4.toUpperCase()))
  })
})

describe('parse and tryParse', () => {
  it('throws on parse and returns null on tryParse', () => {
    expect(() => UUIDv4.parse('nope')).toThrow(RangeError)
    expect(UUIDv4.tryParse('nope')).toBeNull()
  })
})

describe('random', () => {
  it('mints values that pass its own validation', () => {
    for (let i = 0; i < 100; i++) expect(UUIDv4.is(UUIDv4.random())).toBe(true)
  })

  it('does not repeat', () => {
    const minted = new Set(Array.from({ length: 1000 }, () => UUIDv4.random()))
    expect(minted.size).toBe(1000)
  })
})

describe('the brand', () => {
  it('cannot be satisfied by a bare string', () => {
    // @ts-expect-error a literal has not been validated, so it is not a UUIDv4
    const bad: UUIDv4 = '038e776a-46dd-4194-bc74-5d84d1a18700'
    expect(typeof bad).toBe('string')
  })

  it('is still usable anywhere a string is wanted', () => {
    const id: UUIDv4 = UUIDv4.parse(V4)
    const asString: string = id
    expect(asString).toBe(V4)
  })
})
