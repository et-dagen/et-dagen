// PUT /api/v1/user
// endpoint for updating the name of a user in the database

defineRouteMeta({
  openAPI: {
    tags: ['User'],
    summary: 'Update user profile',
    description:
      'Authenticated users may update themselves. Targeting another uid requires admin.',
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
    //         properties: { uid: { type: 'string', description: 'Admin only' } },
    //         additionalProperties: true,
    //       },
    //     },
    //   },
    // },
    // responses: {
    //   204: { description: 'Updated' },
    //   401: { description: 'Error (firebase/not-signed-in). or Error (firebase/user-not-authorized).' },
    // },
  },
})

export default defineEventHandler(async (event) => {
  const { user } = event.context
  const { uid, ...newData } = await readBody(event)

  // Set resource context for wide event logging
  setResourceContext(event, 'user', uid, 'update', 'Update user profile')
  setLogImportance(event, 'warn')

  // user is not authenticated
  if (!user) {
    setErrorContext(event, {
      code: 'firebase/not-signed-in',
      message: 'User not authenticated',
    })
    throw createError({
      statusCode: 401,
      statusMessage: 'Error (firebase/not-signed-in).',
    })
  }
  // check if the user is admin
  const isAdmin = hasAccess(user, ['admin'])
  addEventContext(event, 'is_admin_action', isAdmin && uid !== user.uid)

  if (!isAdmin && uid !== user.uid) {
    setErrorContext(event, {
      code: 'firebase/user-not-authorized',
      message: 'User not authorized to update another user',
    })
    throw createError({
      statusCode: 401,
      statusMessage: 'Error (firebase/user-not-authorized).',
    })
  }
  const displayName = newData.name
  const newEmail = newData.email
  // update name with ID
  auth.updateUser(uid, { displayName, email: newEmail })
  trackDbWrite(event, `auth/users/${uid}`)

  // send response to remove cookie
  sendNoContent(event, 204)
})
