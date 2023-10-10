// GET /api/code/:code
// endpoint for checking if a registration code is valid

export default defineEventHandler(async (event) => {
  const code = getRouterParam(event, 'code') as string
  const { isValid } = await validateCode(code)

  return {
    isValid,
  }
})
