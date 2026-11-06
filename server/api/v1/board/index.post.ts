// POST /api/v1/board
// endpoint for adding a board member
import { defineEventHandler, readBody, setResponseStatus } from 'h3'
import { defineRouteMeta } from 'nitropack/runtime'
import { addMember } from '@/application/board/members'
import { checkedMemberInput } from '@/domain/board/member'
import { fail } from '@/domain/errors'
import { Instant } from '@/domain/time'
import { board, fileStorage, files } from '@/server/composition'
import {
  addEventContext,
  setResourceContext,
} from '@/server/utils/wideEventHelpers'

defineRouteMeta({
  openAPI: {
    tags: ['Board'],
    summary: 'Add a board member',
    description:
      'Admin only. Body: `{ name, title: { nb, en }, email, phone?, featured? }`. The member is ' +
      'added last; upload a portrait with `PUT /api/v1/board/:id/photo`.',
    security: [{ bearerAuth: [] }, { cookieAuth: [] }],
  },
})

export default defineEventHandler(async (event) => {
  const { subject } = event.context
  setResourceContext(event, 'board', undefined, 'create', 'Add a board member')

  const input = checkedMemberInput(await readBody(event))
  if ('problem' in input) throw fail(input.problem)

  const member = await addMember(
    { board, files, storage: fileStorage },
    { subject, now: Instant.now(), input },
  )
  addEventContext(event, 'board_member', member.id)
  setResponseStatus(event, 201)
  return member
})
