// POST /api/v1/board
// endpoint for adding a board member
import { addMember } from '@/application/board/members'
import { checkedMemberInput } from '@/domain/board/member'
import { fail } from '@/domain/errors'
import { Instant } from '@/domain/time'
import { subjectOf } from '@/server/adapters/rtdb/userRecord'
import { board, fileStorage, files } from '@/server/composition'

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
  const { user } = event.context
  setResourceContext(event, 'board', undefined, 'create', 'Add a board member')
  if (!user) throw fail('board/forbidden')

  const input = checkedMemberInput(await readBody(event))
  if ('problem' in input) throw fail(input.problem)

  const member = await addMember(
    { board, files, storage: fileStorage },
    { subject: subjectOf(user.uid, user, Instant.now()), input },
  )
  addEventContext(event, 'board_member', member.id)
  setResponseStatus(event, 201)
  return member
})
