import { describe, expect, it } from 'vitest'
import { classify, type FinishedRequest } from '@/server/activity/classify'

const request = (
  method: string,
  path: string,
  status = 200,
): FinishedRequest => ({
  method,
  path,
  status,
  code: null,
  actor: null,
  target: null,
})

describe('classify', () => {
  it('counts the requests the dashboard tallies', () => {
    expect(classify(request('POST', '/api/v1/user', 201)).tallies).toEqual([
      'sign-up',
    ])
    expect(classify(request('post', '/api/v1/session')).tallies).toEqual([
      'sign-in',
    ])
    expect(classify(request('DELETE', '/api/v1/event/register'))).toEqual({
      tallies: ['cancellation'],
      notable: null,
    })
    expect(
      classify(request('PATCH', '/api/v1/event/attended?eventUID=e')).tallies,
    ).toEqual(['attendance'])
    expect(classify(request('GET', '/api/v1/resume/file')).tallies).toEqual([
      'resume-download',
    ])
  })

  it('counts pages, but not files, API reads or Nuxt requests', () => {
    expect(classify(request('GET', '/event/abc')).tallies).toEqual([
      'page-view',
    ])
    expect(classify(request('GET', '/')).tallies).toEqual(['page-view'])
    for (const path of ['/images/logo.webp', '/_nuxt/entry.js', '/api/v1/job'])
      expect(classify(request('GET', path))).toEqual({
        tallies: [],
        notable: null,
      })
    expect(classify(request('GET', '/nowhere', 404)).tallies).toEqual([])
  })

  it('notes refusals on the API and every server error', () => {
    expect(classify(request('GET', '/api/v1/user', 401))).toEqual({
      tallies: ['refusal'],
      notable: 'refused',
    })
    expect(classify(request('POST', '/api/v1/session', 403)).notable).toBe(
      'refused',
    )
    expect(classify(request('GET', '/admin', 403)).notable).toBeNull()
    expect(classify(request('GET', '/event/x', 500))).toEqual({
      tallies: ['error'],
      notable: 'failed',
    })
  })

  it('notes changes to access and contracts, and deletions', () => {
    expect(classify(request('PUT', '/api/v1/user/access')).notable).toBe(
      'access-changed',
    )
    expect(
      classify(request('PUT', '/api/v1/company/affiliation')).notable,
    ).toBe('contract-changed')
    expect(classify(request('DELETE', '/api/v1/company')).notable).toBe(
      'deleted',
    )
    expect(classify(request('DELETE', '/api/v1/session')).notable).toBeNull()
    expect(classify(request('DELETE', '/api/v1/job', 404)).notable).toBeNull()
  })
})
