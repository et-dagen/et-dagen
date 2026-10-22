import { describe, expect, it } from 'vitest'
import { refuseCrossSite, type RequestFacts } from '@/server/security/crossSite'

const request = (
  overrides: Partial<Omit<RequestFacts, 'headers'>> & {
    headers?: RequestFacts['headers']
  } = {},
): RequestFacts => ({
  method: 'POST',
  path: '/api/v1/event/register',
  host: 'etdagen.no',
  ...overrides,
  headers: { contentType: 'application/json', ...overrides.headers },
})

const crossSite = { status: 403, code: 'request/cross-site' }

describe('refuseCrossSite', () => {
  it('lets our own pages change data', () => {
    expect(
      refuseCrossSite(
        request({
          headers: {
            origin: 'https://etdagen.no',
            secFetchSite: 'same-origin',
          },
        }),
      ),
    ).toBeNull()
  })

  it('refuses a request another site sent', () => {
    expect(
      refuseCrossSite(request({ headers: { secFetchSite: 'cross-site' } })),
    ).toEqual(crossSite)
    expect(
      refuseCrossSite(request({ headers: { secFetchSite: 'same-site' } })),
    ).toEqual(crossSite)
    expect(
      refuseCrossSite(request({ headers: { origin: 'https://evil.example' } })),
    ).toEqual(crossSite)
    expect(refuseCrossSite(request({ headers: { origin: 'null' } }))).toEqual(
      crossSite,
    )
  })

  it('refuses form bodies, which only HTML forms send', () => {
    for (const contentType of [
      'application/x-www-form-urlencoded',
      'text/plain;charset=UTF-8',
    ]) {
      expect(refuseCrossSite(request({ headers: { contentType } }))).toEqual({
        status: 415,
        code: 'request/unsupported-body',
      })
    }
  })

  it('accepts JSON, multipart uploads and empty bodies', () => {
    for (const contentType of [
      'application/json; charset=utf-8',
      'multipart/form-data; boundary=x',
      undefined,
    ]) {
      expect(refuseCrossSite(request({ headers: { contentType } }))).toBeNull()
    }
  })

  it('ignores reads, pages, and clients that are not browsers', () => {
    const fromElsewhere = {
      origin: 'https://evil.example',
      secFetchSite: 'cross-site',
    }
    expect(
      refuseCrossSite(request({ method: 'GET', headers: fromElsewhere })),
    ).toBeNull()
    expect(
      refuseCrossSite(request({ path: '/event/1', headers: fromElsewhere })),
    ).toBeNull()
    expect(refuseCrossSite(request({ headers: {} }))).toBeNull()
  })

  it('trusts the browser over a host a proxy may have rewritten', () => {
    expect(
      refuseCrossSite(
        request({
          host: 'internal:8080',
          headers: {
            origin: 'https://etdagen.no',
            secFetchSite: 'same-origin',
          },
        }),
      ),
    ).toBeNull()
  })

  it('compares the host case-insensitively, including the port', () => {
    expect(
      refuseCrossSite(request({ headers: { origin: 'https://ETDAGEN.no' } })),
    ).toBeNull()
    expect(
      refuseCrossSite(
        request({
          host: 'localhost:3000',
          headers: { origin: 'http://localhost:3001' },
        }),
      ),
    ).toEqual(crossSite)
  })
})
