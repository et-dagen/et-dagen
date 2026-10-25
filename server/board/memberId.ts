import type { H3Event } from 'h3'
import { BoardMemberId } from '@/domain/board/member'
import { fail } from '@/domain/errors'

/** The member in the path; an id that is no UUID cannot be a member */
export function memberIdOf(event: H3Event): BoardMemberId {
  try {
    return BoardMemberId.parse(getRouterParam(event, 'id') ?? '')
  } catch {
    throw fail('board/not-found')
  }
}
