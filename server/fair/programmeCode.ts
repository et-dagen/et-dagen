import type { H3Event } from 'h3'
import { getRouterParam } from 'h3'
import { fail } from '@/domain/errors'
import { ProgrammeCode } from '@/domain/fair/programme'

/** The programme in the path */
export function programmeCodeOf(event: H3Event): ProgrammeCode {
  try {
    return ProgrammeCode.parse(getRouterParam(event, 'code') ?? '')
  } catch {
    throw fail('programme/not-found')
  }
}
