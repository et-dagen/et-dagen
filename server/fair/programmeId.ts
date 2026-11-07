import type { H3Event } from 'h3'
import { getRouterParam } from 'h3'
import { fail } from '@/domain/errors'
import { ProgrammeId } from '@/domain/fair/programme'

/** The programme in the path */
export function programmeIdOf(event: H3Event): ProgrammeId {
  try {
    return ProgrammeId.parse(getRouterParam(event, 'id') ?? '')
  } catch {
    throw fail('programme/not-found')
  }
}
