/**
 * Reads of personal or otherwise sensitive data are always logged, with who asked and for what.
 *
 * Routine reads are not logged (`server/utils/logger.ts`), so a handler that returns personal data
 * must raise its importance to `warn`. Add new handlers of that kind here.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const API_DIR = join(import.meta.dirname, '../../../server/api/v1')

const SENSITIVE_READS: Record<string, string> = {
  'user/index.ts': 'every user, with emails and profiles (scope=all)',
  'resume/index.ts': 'every user with a résumé (scope=all)',
  'resume/file.get.ts': "a user's résumé",
  'event/attendants.get.ts': "attendants' email addresses",
  'company/events/index.ts': "who is registered for a company's events",
  'code/index.ts': 'registration codes',
  'code/[code].ts': 'failed guesses at a registration code',
}

describe('sensitive reads', () => {
  it.each(Object.entries(SENSITIVE_READS))(
    '%s is always logged (%s)',
    (file) => {
      const source = readFileSync(join(API_DIR, file), 'utf8')
      expect(source).toContain("setLogImportance(event, 'warn')")
    },
  )
})
