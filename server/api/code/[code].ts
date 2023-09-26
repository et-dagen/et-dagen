// GET /api/code/:code
// endpoint for checking if a registration code is valid

export default defineEventHandler(async (event) => {
  const code = getRouterParam(event, 'code') as string

  const registrationCodes = db.ref('registrationCodes')

  const snapshot = await registrationCodes
    .orderByChild('value')
    .equalTo(code)
    .once('value')

  const data = snapshot.val()

  // if code exists return true
  return {
    idValid: !!data,
  }
})
