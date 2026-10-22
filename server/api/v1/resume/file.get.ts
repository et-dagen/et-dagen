// GET /api/v1/resume/file
// endpoint for opening one user's resume through a short-lived signed link

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

const LINK_LIFETIME_MS = 5 * 60 * 1000

export default defineEventHandler(async (event) => {
  const { user } = event.context
  const { userUID } = getQuery(event)

  setResourceContext(
    event,
    'resume',
    userUID as string | undefined,
    'get',
    'Open a resume',
  )

  if (!user) {
    setErrorContext(event, {
      code: 'firebase/not-signed-in',
      message: 'User not signed in',
    })
    throw createError({
      statusCode: 401,
      statusMessage: 'Error (firebase/not-signed-in).',
    })
  }

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

  const isOwner = user.uid === userUID
  const isAdmin = hasAccess(user, ['admin'])
  const companyHasCvAccess =
    hasAccess(user, ['company']) &&
    (
      await withDbTiming(
        event,
        `companies/${user.companyUID}/cvAccess`,
        'read',
        () => db.ref(`companies/${user.companyUID}/cvAccess`).once('value'),
      )
    ).val() === true
  addEventContext(event, 'is_owner', isOwner)

  if (!isOwner && !isAdmin && !companyHasCvAccess) {
    setErrorContext(event, {
      code: 'resume/not-allowed',
      message: 'User may not open this resume',
    })
    throw createError({
      statusCode: 403,
      statusMessage: 'Error (resume/not-allowed).',
    })
  }

  const snapshot = await withDbTiming(
    event,
    `users/${userUID}/resume`,
    'read',
    () => db.ref(`users/${userUID}/resume`).once('value'),
  )
  const stored = snapshot.val()
  const bucket = storage.bucket()
  const prefix = `https://storage.googleapis.com/${bucket.name}/`

  if (typeof stored !== 'string' || !stored.startsWith(prefix)) {
    setErrorContext(event, {
      code: 'resume/not-found',
      message: 'User has no resume',
    })
    throw createError({
      statusCode: 404,
      statusMessage: 'Error (resume/not-found).',
    })
  }

  const [link] = await bucket.file(stored.slice(prefix.length)).getSignedUrl({
    version: 'v4',
    action: 'read',
    expires: Date.now() + LINK_LIFETIME_MS,
  })

  setLogImportance(event, 'warn')
  return sendRedirect(event, link, 302)
})
