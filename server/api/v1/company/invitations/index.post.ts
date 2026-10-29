// POST /api/v1/company/invitations
// endpoint for inviting a contact to a company
import { invite } from '@/application/invitations/invitations'
import { Instant } from '@/domain/time'
import { companies, invitations, mailer } from '@/server/composition'
import { invitedOf, originOf } from '@/server/invitations/request'

defineRouteMeta({
  openAPI: {
    tags: ['Company'],
    summary: 'Invite a contact to a company',
    description:
      'Admin only. Body: `{ companyUID, email }`. Mails a link that works once for 14 days, ' +
      'and returns it as `link` next to the invitation, so the admin can copy it; it is not ' +
      'shown again. A pending invitation to the same address for the company is revoked.',
    security: [{ bearerAuth: [] }, { cookieAuth: [] }],
  },
})

export default defineEventHandler(async (event) => {
  const { company, email } = invitedOf(await readBody(event))
  setResourceContext(
    event,
    'invitation',
    company,
    'create',
    'Invite a company contact',
  )
  setLogImportance(event, 'warn')

  const { invitation, link } = await invite(
    { invitations, companies, mailer },
    {
      subject: event.context.subject,
      now: Instant.now(),
      company,
      email,
      origin: originOf(event),
    },
  )
  addEventContext(event, 'invitation', invitation.id)
  setResponseStatus(event, 201)
  return { invitation, link }
})
