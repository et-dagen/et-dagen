// POST /api/v1/user
// endpoint for creating or updating a user in the database

defineRouteMeta({
  openAPI: {
    tags: ['User'],
    summary: 'Create or update user',
    description:
      'Called after Firebase sign-up. A registration code upgrades the account to a company ' +
      'user. Requires a valid token but no database record yet.',
    security: [{ bearerAuth: [] }, { cookieAuth: [] }],
    parameters: [
      {
        name: 'code',
        in: 'query',
        required: false,
        schema: { type: 'string' },
        description: 'Registration code linking the user to a company',
      },
    ],
    // TODO(api-docs): fill in the request/response schemas below.
    // Shapes are sketched from current handler behaviour - verify each
    // against the handler before uncommenting.
    // requestBody: {
    //   required: true,
    //   content: {
    //     'application/json': {
    //       schema: {
    //         type: 'object',
    //         properties: {
    //           uid: { type: 'string', description: 'Admin only' },
    //           name: { type: 'string' },
    //           studyProgram: { type: 'string' },
    //           currentYear: { type: 'integer' },
    //         },
    //       },
    //     },
    //   },
    // },
    // responses: {
    //   201: { description: 'Created, empty body' },
    //   400: { description: 'Error (user/missing-programme)' },
    //   401: { description: 'Error (firebase/user-not-authenticated). or Error (user/invalid-code).' },
    // },
  },
})

export default defineEventHandler(async (event) => {
  const { decodedToken, user } = event.context

  // Set resource context for wide event logging
  setResourceContext(
    event,
    'user',
    user?.uid ?? decodedToken?.uid,
    'create',
    'Create or update user',
  )
  setLogImportance(event, 'warn')

  // user is not authenticated
  if (!decodedToken) {
    setErrorContext(event, {
      code: 'firebase/user-not-authenticated',
      message: 'User not authenticated',
    })
    throw createError({
      statusCode: 401,
      statusMessage: 'Error (firebase/user-not-authenticated).',
    })
  }

  // get request body and query param
  /* eslint-disable */
  let {
    uid,
    userType,
    studyProgram,
    currentYear,
    companyUID,
    dietaryRestrictions,
  } = await readBody(event)
  const { code: registrationCode } = getQuery(event)

  // studyprogram is required when creating, or modifying your own, normal user
  if (
    !registrationCode &&
    (!studyProgram || !currentYear) &&
    !hasAccess(user, ['admin', 'company'])
  ) {
    setErrorContext(event, {
      code: 'user/missing-programme',
      message: 'Study programme is required',
    })
    throw createError({
      statusCode: 400,
      statusMessage: 'Error (user/missing-programme)',
    })
  }

  // only admins can modify usertypes and other users than their own
  if (!hasAccess(user, ['admin']) || !uid) {
    // prevent users from creating multiple instances in the db
    uid = user?.uid ?? decodedToken.uid
    userType = user?.userType ?? 'basic'
    companyUID = user?.companyUID
  }

  // check validity of registration code
  // only applicable when creating a new company user
  if (registrationCode) {
    const { isValid, companyUID: codeCompanyUID } = await validateCode(
      registrationCode as string,
    )

    // a valid code is required when creating a new company user
    if (!isValid) {
      setErrorContext(event, {
        code: 'user/invalid-code',
        message: 'Invalid registration code',
      })
      throw createError({
        statusCode: 401,
        statusMessage: 'Error (user/invalid-code).',
      })
    }

    userType = 'company'
    companyUID = codeCompanyUID

    // remove registration code from db
    deleteCode(registrationCode as string)
  }

  addEventContext(event, 'target_uid', uid)
  addEventContext(event, 'target_user_type', userType ?? null)
  addEventContext(event, 'used_registration_code', Boolean(registrationCode))

  // reference to users
  const usersRef = db.ref('users')

  // add or update user in database
  usersRef.child(uid).update({
    userType: userType ?? null,
    studyProgram: userType === 'company' ? null : studyProgram,
    currentYear: userType === 'company' ? null : currentYear,
    companyUID: userType === 'company' ? companyUID : null,
    dietaryRestrictions: dietaryRestrictions ?? null,
    updated: Date.now(),
  })
  trackDbWrite(event, `users/${uid}`)

  // user successfully modified
  sendNoContent(event, 201)
})
