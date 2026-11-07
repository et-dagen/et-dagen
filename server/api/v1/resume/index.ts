// GET /api/v1/resume
// endpoint for fetching user data with resumes from database

import { createError, defineEventHandler, getQuery } from 'h3'
import { defineRouteMeta } from 'nitropack/runtime'
import { listResumes } from '@/application/users/resume'
import { hasPermission } from '@/domain/authorization/hasPermission'
import { Instant } from '@/domain/time'
import { resumes, users } from '@/server/composition'
import {
  addEventContext,
  setErrorContext,
  setLogImportance,
  setResourceContext,
} from '@/server/utils/wideEventHelpers'

defineRouteMeta({
  openAPI: {
    tags: ['Resume'],
    summary: 'List user resumes',
    description:
      'Returns the calling user by default. scope=all lists every user holding a resume, with ' +
      'their uid, name, email, study programme and year, and requires admin or a company ' +
      'account with CV access.',
    security: [{ bearerAuth: [] }, { cookieAuth: [] }],
    parameters: [
      {
        name: 'scope',
        in: 'query',
        required: false,
        schema: { type: 'string' },
        description: 'Set to all to list every resume holder',
      },
    ],
    // TODO(api-docs): fill in the request/response schemas below.
    // Shapes are sketched from current handler behaviour - verify each
    // against the handler before uncommenting.
    // responses: {
    //   200: { description: 'User, or map of UID to User when scope=all' },
    //   401: { description: 'User not authenticated' },
    //   404: { description: 'User data not found' },
    // },
  },
})

export default defineEventHandler(async (event) => {
  const { decodedToken, subject, user } = event.context

  // Set resource context for wide event logging
  setResourceContext(event, 'resume', undefined, 'list', 'List user resumes')

  // user is not authenticated
  if (!decodedToken) {
    setErrorContext(event, {
      code: 'auth/not-authenticated',
      message: 'User not authenticated',
    })
    throw createError({
      statusCode: 401,
      statusMessage: 'User not authenticated',
    })
  }

  if (!user) {
    setErrorContext(event, {
      code: 'user/not-found',
      message: 'User data not found',
    })
    throw createError({
      statusCode: 404,
      statusMessage: 'User data not found',
    })
  }

  // get scope from query params
  const { scope } = getQuery(event)

  // without the right to read every résumé, the caller gets their own record
  const all = { scope: 'all' } as const
  const now = Instant.now()
  if (
    scope !== 'all' ||
    !hasPermission(subject, 'resume', 'read', all, { now })
  )
    return user

  // listing other users' personal data is kept for the audit trail
  setLogImportance(event, 'warn')

  const listed = await listResumes({ resumes, users }, { subject, now })

  // Add result metadata to wide event
  addEventContext(event, 'result_count', listed.length)

  return listed
})
