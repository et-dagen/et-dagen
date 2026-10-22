/**
 * Decides whether a request that changes data may have come from another website
 *
 * @remarks
 * Browsers mark every request with where it came from: `Sec-Fetch-Site` in all current browsers,
 * and `Origin` on every cross-origin `POST`, `PUT`, `PATCH` and `DELETE`. Requests without either
 * header come from scripts and servers, which cannot carry a user's cookie, so they are left to
 * the auth check. Bodies are limited to JSON and multipart, which is all our pages send: an HTML
 * form on another site can only send `application/x-www-form-urlencoded`, `multipart/form-data`
 * or `text/plain`, and multipart is covered by the origin checks.
 */

const CHANGES_DATA = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])
const SAME_SITE = new Set(['same-origin', 'none'])
const ACCEPTED_BODIES = ['application/json', 'multipart/form-data']

export interface RequestFacts {
  method: string
  path: string
  /** The host the request was sent to, as the browser saw it */
  host: string
  headers: {
    origin?: string
    secFetchSite?: string
    contentType?: string
    contentLength?: string
  }
}

export type Refusal = { status: 403 | 415; code: string } | null

export function refuseCrossSite(request: RequestFacts): Refusal {
  if (!request.path.startsWith('/api/')) return null
  if (!CHANGES_DATA.has(request.method.toUpperCase())) return null

  const { origin, secFetchSite, contentType, contentLength } = request.headers

  // The browser's own verdict comes first: it does not depend on how a proxy rewrites the host.
  // Browsers too old to send it still send Origin on these methods.
  const fromElsewhere = secFetchSite
    ? !SAME_SITE.has(secFetchSite)
    : origin !== undefined && hostOf(origin) !== request.host.toLowerCase()
  if (fromElsewhere) return { status: 403, code: 'request/cross-site' }

  const hasBody = Boolean(contentType) || Number(contentLength ?? 0) > 0
  const type = contentType?.split(';')[0].trim().toLowerCase() ?? ''
  if (hasBody && !ACCEPTED_BODIES.includes(type)) {
    return { status: 415, code: 'request/unsupported-body' }
  }
  return null
}

function hostOf(origin: string): string | null {
  try {
    return new URL(origin).host.toLowerCase()
  } catch {
    return null
  }
}
