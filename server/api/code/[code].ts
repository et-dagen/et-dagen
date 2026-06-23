// GET /api/code/:code
// endpoint for checking if a registration code is valid

export default defineEventHandler(async (event) => {
  const code = getRouterParam(event, 'code') as string

  // Set resource context for wide event logging
  setResourceContext(event, 'code', code, 'get', 'Validate registration code')

  const { isValid } = await withDbTiming(
    event,
    'registrationCodes',
    'read',
    () => validateCode(code),
  )

  addEventContext(event, 'is_valid', isValid)

  return {
    isValid,
  }
})
