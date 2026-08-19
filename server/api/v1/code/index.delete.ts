// DELETE /api/v1/code
// endpoint for removing a registration code from db

defineRouteMeta({
  openAPI: {
    tags: ['Code'],
    summary: 'Delete registration code',
    description: 'Removes a registration code by its code string. Admin only.',
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
    //         required: ['code'],
    //         properties: { code: { type: 'string' } },
    //       },
    //     },
    //   },
    // },
    // responses: {
    //   204: { description: 'Deleted' },
    //   401: { description: 'Error (firebase/user-not-authorized).' },
    // },
  },
})

export default defineEventHandler(async (event) => {
  const { user } = event.context

  // Set resource context for wide event logging
  setResourceContext(
    event,
    'code',
    undefined,
    'delete',
    'Delete registration code',
  )
  setLogImportance(event, 'warn')

  // only admins can remove registration codes
  if (!hasAccess(user, ['admin'])) {
    setErrorContext(event, {
      code: 'firebase/user-not-authorized',
      message: 'User not authorized to delete registration codes',
    })
    throw createError({
      statusCode: 401,
      statusMessage: 'Error (firebase/user-not-authorized).',
    })
  }

  // get request body
  const { code } = await readBody(event)

  addEventContext(event, 'code', code)

  // delete code
  await withDbTiming(event, 'registrationCodes', 'delete', () =>
    deleteCode(code),
  )

  // company successfully removed
  sendNoContent(event, 204)
})
