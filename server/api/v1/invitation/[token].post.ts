// POST /api/v1/invitation/:token
// endpoint for accepting an invitation
import { redeemInvitation } from '@/application/invitations/invitations'
import { EmailAddress } from '@/domain/email'
import { Instant } from '@/domain/time'
import { UserUid } from '@/domain/user'
import { access, invitations, newAccounts } from '@/server/composition'
import { tokenOf } from '@/server/invitations/request'

defineRouteMeta({
  openAPI: {
    tags: ['Company'],
    summary: 'Accept an invitation',
    description:
      'Signed in with the invited address: joins the company with that account. Signed out: ' +
      'body `{ name, password }` opens a verified account for the address and joins with it ' +
      '(`409 invitation/account-exists` when the address has one; sign in instead). ' +
      'Answers `201 { uid }`.',
    security: [{ bearerAuth: [] }, { cookieAuth: [] }, {}],
  },
})

export default defineEventHandler(async (event) => {
  const { decodedToken } = event.context
  setResourceContext(
    event,
    'invitation',
    undefined,
    'redeem',
    'Accept an invitation',
  )
  setLogImportance(event, 'warn')

  const body = decodedToken ? null : ((await readBody(event)) ?? {})
  const uid = await redeemInvitation(
    { invitations, accounts: newAccounts, access },
    {
      token: tokenOf(event),
      now: Instant.now(),
      signedIn: decodedToken
        ? {
            uid: UserUid.parse(decodedToken.uid),
            email: EmailAddress.is(decodedToken.email)
              ? decodedToken.email
              : null,
          }
        : null,
      account: body
        ? {
            name: String(body.name ?? ''),
            password: String(body.password ?? ''),
          }
        : null,
    },
  )
  addEventContext(event, 'target_uid', uid)
  setResponseStatus(event, 201)
  return { uid }
})
