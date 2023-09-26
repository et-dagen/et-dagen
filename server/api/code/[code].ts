// GET /api/code/:code
// endpoint for checking if a registration code is valid

export default defineEventHandler(async (event) => {
  const code = getRouterParam(event, 'code') as string

  // reference to registration codes in db
  const registrationCodes = db.ref('registrationCodes')

  // fetch code from db
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
