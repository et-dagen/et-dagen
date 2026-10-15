/**
 * Keeps the `internal` OpenAPI tag honest.
 *
 * Operations tagged `internal` are withheld from the published API reference
 * (see scripts/build-docs.ts). That is a "do not advertise" measure, not a
 * security boundary: the repository is public, the docs build has a
 * DOCS_INTERNAL escape hatch, and the admin pages ship the same URLs in the
 * client bundle. The only thing actually protecting an administrative endpoint
 * is the authorisation check inside its handler.
 *
 * So the tag is checked against that check, in both directions:
 *
 *   1. Tagged internal  -> the handler must gate on admin.
 *   2. Gates on admin   -> either tagged internal, or listed below with a
 *      reason. A new admin-only route therefore fails this test until somebody
 *      decides which it is.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const API_DIR = join(import.meta.dirname, '../../../server/api/v1')

/**
 * Handlers that check for admin but are still published, because a non-admin
 * reaches them too - with a narrower scope, their own resource, or their own
 * company. The admin branch only widens what they may touch.
 */
const PUBLISHED_ADMIN_ROUTES = new Set([
  // Users act on themselves; admins act on anyone.
  'user/index.post.ts',
  'user/index.put.ts',
  'user/index.delete.ts',
  // Coordinators act for their own company; admins for any.
  'company/index.put.ts',
  'company/events/index.ts',
  'job/index.post.ts',
  'job/index.put.ts',
  'job/index.delete.ts',
  'event/index.post.ts',
  'event/index.put.ts',
  'event/index.delete.ts',
  // Attendees register themselves; admins register others.
  'event/register/index.post.ts',
  'event/register/index.delete.ts',
])

const walk = (dir: string, prefix = ''): string[] =>
  readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry)
    const rel = prefix ? `${prefix}/${entry}` : entry
    if (statSync(full).isDirectory()) return walk(full, rel)
    return entry.endsWith('.ts') && !entry.includes('.test.') ? [rel] : []
  })

const handlers = walk(API_DIR).map((rel) => ({
  rel,
  source: readFileSync(join(API_DIR, rel), 'utf8'),
}))

// tags: ['Code', 'internal']
const isTaggedInternal = (source: string) =>
  /tags:\s*\[[^\]]*'internal'[^\]]*\]/.test(source)

// hasAccess(user, ['admin']) - admin and nobody else. A check listing other
// roles alongside admin is not an admin-only gate.
const gatesOnAdmin = (source: string) =>
  /hasAccess\(\s*\w+,\s*\[\s*'admin'\s*\]\s*\)/.test(source)

describe('internal route tagging', () => {
  it('finds handlers to check', () => {
    expect(handlers.length).toBeGreaterThan(0)
  })

  it.each(handlers.filter(({ source }) => isTaggedInternal(source)))(
    'v1/$rel is tagged internal and gates on admin',
    ({ source }) => {
      expect(gatesOnAdmin(source)).toBe(true)
    },
  )

  it('leaves no admin-only route untagged and undeclared', () => {
    const undeclared = handlers
      .filter(
        ({ rel, source }) =>
          gatesOnAdmin(source) &&
          !isTaggedInternal(source) &&
          !PUBLISHED_ADMIN_ROUTES.has(rel),
      )
      .map(({ rel }) => rel)

    // Tag it `internal` to withhold it from the published reference, or add it
    // to PUBLISHED_ADMIN_ROUTES with the reason a non-admin also reaches it.
    expect(undeclared).toEqual([])
  })

  it('keeps PUBLISHED_ADMIN_ROUTES free of stale entries', () => {
    const stale = [...PUBLISHED_ADMIN_ROUTES].filter(
      (rel) => !handlers.some((handler) => handler.rel === rel),
    )
    expect(stale).toEqual([])
  })
})
