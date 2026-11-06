// GET /api/v1/resume/file
// endpoint for opening one user's resume through a short-lived signed link

import { createError, defineEventHandler, getQuery, sendRedirect } from 'h3'
import { defineRouteMeta } from 'nitropack/runtime'
import { openResume } from '@/application/users/resume'
import { Instant } from '@/domain/time'
import { UserUid } from '@/domain/user'
import { files, fileStorage, resumes } from '@/server/composition'
import {
  addEventContext,
  setErrorContext,
  setLogImportance,
  setResourceContext,
} from '@/server/utils/wideEventHelpers'

defineRouteMeta({
  openAPI: {
    tags: ['Resume'],
    summary: "Open a user's resume",
    description:
      'Redirects to a signed link to the PDF that expires after five minutes. Allowed for ' +
      'the owner, admins, and company accounts whose company has CV access. Resume files ' +
      'are private, so this is the only way to open one.',
    security: [{ bearerAuth: [] }, { cookieAuth: [] }],
    parameters: [
      {
        name: 'userUID',
        in: 'query',
        required: true,
        schema: { type: 'string' },
        description: 'Whose resume to open',
      },
    ],
  },
})

export default defineEventHandler(async (event) => {
  const { subject } = event.context
  const { userUID } = getQuery(event)

  setResourceContext(
    event,
    'resume',
    userUID as string | undefined,
    'get',
    'Open a resume',
  )

  if (typeof userUID !== 'string' || !userUID) {
    setErrorContext(event, {
      code: 'resume/missing-user-uid',
      message: 'userUID not provided',
    })
    throw createError({
      statusCode: 400,
      statusMessage: 'Error (resume/missing-user-uid).',
    })
  }
  addEventContext(event, 'is_owner', subject?.uid === userUID)

  const link = await openResume(
    { files, storage: fileStorage, resumes, now: Instant.now },
    {
      subject,
      now: Instant.now(),
      owner: UserUid.parse(userUID),
    },
  )

  setLogImportance(event, 'warn')
  return sendRedirect(event, link, 302)
})
