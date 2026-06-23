// DELETE /api/code
// endpoint for removing a registration code from db

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
