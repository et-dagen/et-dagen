// DELETE /api/v1/board/:id
// endpoint for removing a board member
import { removeMember } from '@/application/board/members'
import { fail } from '@/domain/errors'
import { memberIdOf } from '@/server/board/memberId'
import { board, fileStorage, files } from '@/server/composition'

defineRouteMeta({
  openAPI: {
    tags: ['Board'],
    summary: 'Remove a board member',
    description:
      'Admin only. Removes the member and their portrait; the members after them move up.',
    security: [{ bearerAuth: [] }, { cookieAuth: [] }],
  },
})

export default defineEventHandler(async (event) => {
  const { subject } = event.context
  const id = memberIdOf(event)
  setResourceContext(event, 'board', id, 'delete', 'Remove a board member')
  if (!subject) throw fail('board/forbidden')

  await removeMember({ board, files, storage: fileStorage }, { subject, id })
  sendNoContent(event, 204)
})
