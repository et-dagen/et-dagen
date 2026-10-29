import type { Notable, Tally } from '@/domain/activity/activity'
import type { UserUid } from '@/domain/user'

/** A finished request, as the wide event saw it */
export interface FinishedRequest {
  method: string
  path: string
  status: number
  code: string | null
  actor: UserUid | null
  target: string | null
}

export interface Classified {
  tallies: Tally[]
  notable: Notable | null
}

const TALLIED: Readonly<Record<string, Tally>> = {
  'POST /api/v1/user': 'sign-up',
  'POST /api/v1/session': 'sign-in',
  'POST /api/v1/event/register': 'registration',
  'DELETE /api/v1/event/register': 'cancellation',
  'PATCH /api/v1/event/attended': 'attendance',
  'GET /api/v1/resume/file': 'resume-download',
}

const NOTED: Readonly<Record<string, Notable>> = {
  'PUT /api/v1/user/access': 'access-changed',
  'PUT /api/v1/company/affiliation': 'contract-changed',
}

// deletions a user makes in passing, not records gone
const ROUTINE_DELETES = new Set([
  'DELETE /api/v1/event/register',
  'DELETE /api/v1/session',
])

const pathOf = (path: string) => path.split('?')[0]!.replace(/\/+$/, '') || '/'

const isApi = (path: string) => path.startsWith('/api/')

// a page, not a file, an API call or one of Nuxt's own requests
const isPage = (path: string) =>
  !isApi(path) && !path.startsWith('/_') && !/\.[a-z0-9]+$/i.test(path)

/**
 * What a finished request adds to the dashboard
 *
 * @remarks
 * Decided by method, path and status alone, so no handler has to report anything.
 */
export function classify(request: FinishedRequest): Classified {
  const path = pathOf(request.path)
  const method = request.method.toUpperCase()
  const route = `${method} ${path}`
  const { status } = request

  if (status >= 500) return { tallies: ['error'], notable: 'failed' }
  if (isApi(path) && (status === 401 || status === 403))
    return { tallies: ['refusal'], notable: 'refused' }
  if (status < 200 || status >= 300) return { tallies: [], notable: null }

  if (method === 'GET' && isPage(path))
    return { tallies: ['page-view'], notable: null }

  const tally = TALLIED[route]
  const deleted =
    method === 'DELETE' && isApi(path) && !ROUTINE_DELETES.has(route)
  return {
    tallies: tally ? [tally] : [],
    notable: NOTED[route] ?? (deleted ? 'deleted' : null),
  }
}
