// PUT /api/v1/board/:id
// endpoint for changing a board member's details
import { updateMember } from '@/application/board/members'
import { checkedMemberInput } from '@/domain/board/member'
import { fail } from '@/domain/errors'
import { Instant } from '@/domain/time'
import { memberIdOf } from '@/server/board/memberId'
import { board, fileStorage, files } from '@/server/composition'

defineRouteMeta({
  openAPI: {
    tags: ['Board'],
    summary: "Change a board member's details",
    description:
      'Admin only. Same body as adding a member; the portrait and the place are kept.',
    security: [{ bearerAuth: [] }, { cookieAuth: [] }],
  },
})

export default defineEventHandler(async (event) => {
  const { subject } = event.context
  const id = memberIdOf(event)
  setResourceContext(event, 'board', id, 'update', 'Change a board member')

  const input = checkedMemberInput(await readBody(event))
  if ('problem' in input) throw fail(input.problem)

  return updateMember(
    { board, files, storage: fileStorage },
    { subject, now: Instant.now(), id, input },
  )
})
