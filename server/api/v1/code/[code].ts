// GET /api/v1/code/:code
// endpoint for checking if a registration code is valid

defineRouteMeta({
  openAPI: {
    tags: ['Code'],
    summary: 'Validate registration code',
    description:
      'Public pre-signup check. Reports whether a registration code exists and is usable.',
    security: [],
    parameters: [
      {
        name: 'code',
        in: 'path',
        required: true,
        schema: { type: 'string' },
        description: 'The registration code string to validate',
      },
    ],
    // TODO(api-docs): fill in the request/response schemas below.
    // Shapes are sketched from current handler behaviour - verify each
    // against the handler before uncommenting.
    // responses: {
    //   200: {
    //     description: 'Validity of the supplied code',
    //     content: {
    //       'application/json': {
    //         schema: {
    //           type: 'object',
    //           properties: { isValid: { type: 'boolean' } },
    //         },
    //       },
    //     },
    //   },
    // },
  },
})

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
