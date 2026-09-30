import type { Brand } from '@/domain/brand'

/**
 * A navigation service an event may be linked to
 *
 * @remarks
 * MazeMap covers NTNU's indoor campus, which is where most events are; the other two are for
 * venues off campus. Which one a link belongs to is derived from the link itself rather than
 * stored alongside it, so the two can never disagree.
 */
export type MapProvider = 'mazemap' | 'googleMaps' | 'appleMaps'

/**
 * A validated deep link into a supported navigation service
 *
 * @remarks
 * A branded string rather than a `URL`, because this value is persisted: `URL` does not
 * survive a Firestore round trip, coming back as a plain string while the type still claims
 * otherwise. The raw text is kept exactly as entered — MazeMap's long form carries the
 * coordinates in the fragment, so normalising or trimming a link can silently move the venue.
 */
export type MapLink = Brand<string, 'MapLink'>

/**
 * Somewhere an event takes place
 */
export interface Location {
  /** What to show a reader, e.g. "Realfagbygget, R1" */
  name: string
  map?: MapLink
}

/**
 * Capability of taking place somewhere
 *
 * @remarks
 * Lives here rather than in `domain/traits.ts` so it sits beside the {@link Location} it names.
 * Both events and job listings carry one.
 */
export interface HasLocation {
  location: Location
}

interface HostRule {
  provider: MapProvider
  hosts: string[]
  /** Required when the host also serves unrelated pages */
  path?: RegExp
}

const HOST_RULES: readonly HostRule[] = [
  // Short links from the share dialog, and the long form the web app produces.
  { provider: 'mazemap', hosts: ['link.mazemap.com', 'use.mazemap.com'] },
  { provider: 'googleMaps', hosts: ['maps.google.com', 'maps.app.goo.gl'] },
  { provider: 'googleMaps', hosts: ['goo.gl'], path: /^\/maps\// },
  {
    provider: 'googleMaps',
    hosts: ['google.com', 'www.google.com'],
    path: /^\/maps(\/|$)/,
  },
  { provider: 'appleMaps', hosts: ['maps.apple.com'] },
]

/**
 * Identify which service a link points at
 *
 * @remarks
 * Hosts are compared for equality, never by substring: `evil-mazemap.com.attacker.io` contains
 * `mazemap.com` and must not be mistaken for it. Only `https` is accepted, since these links
 * are rendered for people to follow.
 *
 * @returns The provider, or null when the link is not one this app will link out to
 */
const providerFor = (value: string): MapProvider | null => {
  let url: URL
  try {
    url = new URL(value)
  } catch {
    return null
  }

  if (url.protocol !== 'https:') return null

  const host = url.hostname.toLowerCase()
  const rule = HOST_RULES.find(
    (candidate) =>
      candidate.hosts.includes(host) &&
      (!candidate.path || candidate.path.test(url.pathname)),
  )

  return rule?.provider ?? null
}

/**
 * Links into supported navigation services
 */
export const MapLink = {
  is: (value: unknown): value is MapLink =>
    typeof value === 'string' && providerFor(value) !== null,

  /**
   * @throws RangeError when the link is malformed or points at an unsupported service
   */
  parse: (value: string): MapLink => {
    if (providerFor(value) === null) {
      throw new RangeError(`Not a supported map link: ${value}`)
    }
    return value as MapLink
  },

  /**
   * @returns The link, or null when it is not one this app will link out to
   */
  tryParse: (value: string): MapLink | null =>
    MapLink.is(value) ? value : null,

  /**
   * Which service a validated link belongs to
   */
  providerOf: (link: MapLink): MapProvider => providerFor(link) as MapProvider,
} as const
