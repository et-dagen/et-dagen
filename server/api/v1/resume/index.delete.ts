// DELETE /api/v1/resume
// endpoint for deleting existing resumes

import { defineEventHandler, readBody, sendNoContent } from 'h3'
import { defineRouteMeta } from 'nitropack/runtime'
import { removeResume } from '@/application/users/resume'
import { authorize } from '@/domain/authorization/authorize'
import { fail } from '@/domain/errors'
import { Instant } from '@/domain/time'
import { UserUid } from '@/domain/user'
import { files, fileStorage, resumes } from '@/server/composition'
import {
  addEventContext,
  setLogImportance,
  setResourceContext,
} from '@/server/utils/wideEventHelpers'

defineRouteMeta({
  openAPI: {
    tags: ['Resume'],
    summary: 'Delete user resume',
    description:
      'Users may delete their own resume; admins may delete the resume of any ' +
      'user. Uses 404 when the user has no resume.',
    security: [{ bearerAuth: [] }, { cookieAuth: [] }],
    // TODO(api-docs): fill in the request/response schemas below.
    // Shapes are sketched from current handler behaviour - verify each
    // against the handler before uncommenting.
    // requestBody: {
    //   required: true,
    //   content: {
    //     'application/json': {
    //       schema: {
    //         type: 'object',
    //         properties: { userUID: { type: 'string' } },
    //       },
    //     },
    //   },
    // },
    // responses: {
    //   204: { description: 'Deleted' },
    //   401: { description: 'auth/signed-out' },
    //   403: { description: 'auth/forbidden' },
    //   404: { description: 'resume/not-found' },
    // },
  },
})

export default defineEventHandler(async (event) => {
  const { subject } = event.context

  // Set resource context for wide event logging
  setResourceContext(event, 'resume', undefined, 'delete', 'Delete user resume')
  setLogImportance(event, 'warn')

  const { userUID } = await readBody(event)

  addEventContext(event, 'user_uid', userUID)

  if (typeof userUID !== 'string' || !userUID) {
    // no user named: refused as v1 refused it, or nothing to delete
    authorize(
      subject,
      'resume',
      'write',
      { scope: 'own' },
      { now: Instant.now() },
    )
    throw fail('resume/not-found')
  }

  await removeResume(
    { files, storage: fileStorage, resumes, now: Instant.now },
    {
      subject,
      now: Instant.now(),
      owner: UserUid.parse(userUID),
    },
  )

  sendNoContent(event, 204)
})
