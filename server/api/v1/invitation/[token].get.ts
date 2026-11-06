// GET /api/v1/invitation/:token
// endpoint for the page behind an invitation link
import { defineEventHandler } from 'h3'
import { defineRouteMeta } from 'nitropack/runtime'
import { previewInvitation } from '@/application/invitations/invitations'
import { Instant } from '@/domain/time'
import { companies, invitations } from '@/server/composition'
import { tokenOf } from '@/server/invitations/request'
import {
  setLogImportance,
  setResourceContext,
} from '@/server/utils/wideEventHelpers'

defineRouteMeta({
  openAPI: {
    tags: ['Company'],
    summary: 'Show an invitation',
    description:
      'Public to whoever holds the link. `{ company: { uid, name }, email, status, expiresAt }`; ' +
      '`404 invitation/not-found` for a token that belongs to no invitation.',
    security: [],
  },
})

export default defineEventHandler((event) => {
  // the token is the secret: keep it out of the log
  setResourceContext(
    event,
    'invitation',
    undefined,
    'read',
    'Show an invitation',
  )
  // shows the invited address to whoever holds the link: always logged
  setLogImportance(event, 'warn')

  return previewInvitation(
    { invitations, companies },
    { token: tokenOf(event), now: Instant.now() },
  )
})
