import { describe, expect, it } from 'vitest'
import { MapLink, type Location } from '~/domain/event/location'

const SHORT_MAZEMAP = 'https://link.mazemap.com/ZeSbeB2Q'
const LONG_MAZEMAP =
  'https://use.mazemap.com/?utm_medium=longurl' +
  '#v=1&zlevel=1&center=10.401621,63.419237' +
  '&zoom=18.6&campusid=1&sharepoitype=poi&sharepoi=923533'

describe('MazeMap', () => {
  it('accepts both the short and the long share form', () => {
    expect(MapLink.providerOf(MapLink.parse(SHORT_MAZEMAP))).toBe('mazemap')
    expect(MapLink.providerOf(MapLink.parse(LONG_MAZEMAP))).toBe('mazemap')
  })

  it('keeps the fragment, which is where the long form names the room', () => {
    // `sharepoitype=poi` with a poi id points at a mapped room, rather than dropping a pin at
    // a coordinate outside the building. Normalising or trimming the hash loses the room and
    // leaves a link to the campus with nothing marked on it.
    const parsed = MapLink.parse(LONG_MAZEMAP)

    expect(parsed).toContain('sharepoitype=poi')
    expect(parsed).toContain('sharepoi=923533')
    expect(parsed).toBe(LONG_MAZEMAP)
  })
})

describe('the other services', () => {
  it('recognises Google Maps in its several shapes', () => {
    expect(
      MapLink.providerOf(MapLink.parse('https://maps.app.goo.gl/abc123')),
    ).toBe('googleMaps')
    expect(
      MapLink.providerOf(MapLink.parse('https://maps.google.com/?q=NTNU')),
    ).toBe('googleMaps')
    expect(
      MapLink.providerOf(
        MapLink.parse('https://www.google.com/maps/place/NTNU'),
      ),
    ).toBe('googleMaps')
    expect(MapLink.providerOf(MapLink.parse('https://goo.gl/maps/abc'))).toBe(
      'googleMaps',
    )
  })

  it('recognises Apple Maps', () => {
    expect(
      MapLink.providerOf(MapLink.parse('https://maps.apple.com/?ll=63.4,10.4')),
    ).toBe('appleMaps')
  })

  it('refuses a supported host serving an unrelated page', () => {
    expect(MapLink.is('https://www.google.com/search?q=NTNU')).toBe(false)
    expect(MapLink.is('https://goo.gl/abc')).toBe(false)
  })
})

describe('rejection', () => {
  it('compares hosts for equality, never by substring', () => {
    expect(MapLink.is('https://evil-mazemap.com.attacker.io/ZeSbeB2Q')).toBe(
      false,
    )
    expect(MapLink.is('https://mazemap.com.attacker.io/')).toBe(false)
    expect(MapLink.is('https://notmaps.apple.com/')).toBe(false)
  })

  it('requires https, since these links are handed to people to follow', () => {
    expect(MapLink.is('http://link.mazemap.com/ZeSbeB2Q')).toBe(false)
    expect(MapLink.is('javascript:alert(1)')).toBe(false)
  })

  it('rejects unsupported services and malformed input', () => {
    expect(MapLink.is('https://www.openstreetmap.org/#map=17/63.4/10.4')).toBe(
      false,
    )
    expect(MapLink.is('link.mazemap.com/ZeSbeB2Q')).toBe(false)
    expect(MapLink.is('')).toBe(false)
    expect(MapLink.is(42)).toBe(false)
    expect(MapLink.tryParse('nonsense')).toBeNull()
    expect(() => MapLink.parse('nonsense')).toThrow(RangeError)
  })
})

describe('Location', () => {
  it('pairs a readable name with the link', () => {
    const map = MapLink.parse(SHORT_MAZEMAP)
    const location: Location = { name: 'Realfagbygget, R1', map }

    expect(location.name).toBe('Realfagbygget, R1')
    expect(MapLink.providerOf(map)).toBe('mazemap')
  })

  it('carries a name on its own, for a venue with nothing to link to', () => {
    const location: Location = { name: 'Realfagbygget, R1' }

    expect(location.name).toBe('Realfagbygget, R1')
    expect(location.map).toBeUndefined()
  })
})
