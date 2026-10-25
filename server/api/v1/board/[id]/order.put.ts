// PUT /api/v1/board/:id/order
// endpoint for moving a board member on the contact page
import { moveMember } from '@/application/board/members'
import { fail } from '@/domain/errors'
import { Instant } from '@/domain/time'
import { subjectOf } from '@/server/adapters/rtdb/userRecord'
import { memberIdOf } from '@/server/board/memberId'
import { board, fileStorage, files } from '@/server/composition'

defineRouteMeta({
  openAPI: {
    tags: ['Board'],
    summary: 'Move a board member',
    description:
      'Admin only. Body: `{ order }`, the place counting from 0. A place past the end puts the ' +
      'member last.',
    security: [{ bearerAuth: [] }, { cookieAuth: [] }],
  },
})

export default defineEventHandler(async (event) => {
  const { user } = event.context
  const id = memberIdOf(event)
  setResourceContext(event, 'board', id, 'update', 'Move a board member')
  if (!user) throw fail('board/forbidden')

  const { order } = (await readBody(event)) ?? {}
  if (!Number.isInteger(order) || order < 0) throw fail('board/invalid-order')

  await moveMember(
    { board, files, storage: fileStorage },
    { subject: subjectOf(user.uid, user, Instant.now()), id, to: order },
  )
  sendNoContent(event, 204)
})
