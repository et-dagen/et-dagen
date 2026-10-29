// DELETE /api/v1/company/invitations/:id
// endpoint for revoking an invitation
import { revokeInvitation } from '@/application/invitations/invitations'
import { Instant } from '@/domain/time'
import { invitations } from '@/server/composition'
import { invitationIdOf } from '@/server/invitations/request'

defineRouteMeta({
  openAPI: {
    tags: ['Company'],
    summary: 'Revoke an invitation',
    description:
      'Admin only. The link stops working. Only a pending invitation can be revoked ' +
      '(`410 invitation/not-pending` otherwise).',
    security: [{ bearerAuth: [] }, { cookieAuth: [] }],
  },
})

export default defineEventHandler(async (event) => {
  const id = invitationIdOf(event)
  setResourceContext(event, 'invitation', id, 'delete', 'Revoke an invitation')

  await revokeInvitation(
    { invitations },
    { subject: event.context.subject, now: Instant.now(), id },
  )
  sendNoContent(event, 204)
})
