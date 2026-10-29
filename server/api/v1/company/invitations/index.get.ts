// GET /api/v1/company/invitations?companyUID=
// endpoint for listing a company's invitations
import { listInvitations } from '@/application/invitations/invitations'
import { Instant } from '@/domain/time'
import { invitations } from '@/server/composition'
import { companyOf } from '@/server/invitations/request'

defineRouteMeta({
  openAPI: {
    tags: ['Company'],
    summary: "List a company's invitations",
    description:
      'Admin only. Newest first, as `{ id, company, email, status, createdAt, expiresAt, ' +
      'joinedBy }`; `status` is `pending`, `joined`, `expired` or `revoked`. Never the link.',
    security: [{ bearerAuth: [] }, { cookieAuth: [] }],
    parameters: [
      {
        name: 'companyUID',
        in: 'query',
        required: true,
        schema: { type: 'string' },
      },
    ],
  },
})

export default defineEventHandler((event) => {
  const company = companyOf(event)
  setResourceContext(
    event,
    'invitation',
    company,
    'list',
    "List a company's invitations",
  )

  return listInvitations(
    { invitations },
    { subject: event.context.subject, now: Instant.now(), company },
  )
})
