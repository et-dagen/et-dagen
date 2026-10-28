// POST /api/v1/user
// endpoint for creating or updating a user in the database

import { startAccess } from '@/application/users/access'
import { hasPermission } from '@/domain/authorization/hasPermission'
import { CompanyUid } from '@/domain/business/company'
import { Instant } from '@/domain/time'
import { UserUid } from '@/domain/user'
import { access } from '@/server/composition'

defineRouteMeta({
  openAPI: {
    tags: ['User'],
    summary: 'Create or update user',
    description:
      'Called after Firebase sign-up, and to update the profile. A new account starts as a ' +
      "student; a registration code makes it a contact for the code's company. Requires a valid " +
      'token but no database record yet.',
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
  const { decodedToken, subject, user } = event.context

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
  let { uid, studyProgram, currentYear, dietaryRestrictions } =
    await readBody(event)
  const { code: registrationCode } = getQuery(event)

  // studyprogram is required when creating, or modifying your own, normal user
  if (
    !registrationCode &&
    (!studyProgram || !currentYear) &&
    !subject?.roles.some((role) => role === 'admin' || role === 'company')
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

  // only admins act on other users; roles and companies are set with PUT /user/access
  const env = { now: Instant.now() }
  if (
    !uid ||
    !hasPermission(subject, 'user', 'assign', { scope: 'all' }, env)
  ) {
    // prevent users from creating multiple instances in the db
    uid = user?.uid ?? decodedToken.uid
  }

  // check validity of registration code
  // only applicable when creating a new company user
  let codeCompany: string | null = null
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

    codeCompany = codeCompanyUID

    // remove registration code from db
    deleteCode(registrationCode as string)
  }

  addEventContext(event, 'target_uid', uid)
  addEventContext(event, 'used_registration_code', Boolean(registrationCode))

  // reference to users
  const usersRef = db.ref('users')

  // add or update user in database; a company contact has no study programme, and the v1
  // userType and companyUID are cleared, since roles and memberships say who the user is (#640)
  usersRef.child(uid).update({
    studyProgram: codeCompany ? null : (studyProgram ?? null),
    currentYear: codeCompany ? null : (currentYear ?? null),
    dietaryRestrictions: dietaryRestrictions ?? null,
    userType: null,
    companyUID: null,
    updated: Date.now(),
  })
  trackDbWrite(event, `users/${uid}`)

  // a new account, or one using a registration code, starts with its roles (#640)
  if (registrationCode || (!user && uid === decodedToken.uid)) {
    await startAccess(
      { access },
      {
        user: UserUid.parse(uid),
        company: codeCompany ? CompanyUid.parse(codeCompany) : null,
        now: env.now,
      },
    )
    trackDbWrite(event, `roles/${uid}`)
  }

  // user successfully modified
  sendNoContent(event, 201)
})
