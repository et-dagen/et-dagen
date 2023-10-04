export const validateCode = async (code: string) => {
  // reference to registration codes in db
  const registrationCodes = db.ref('registrationCodes')

  // fetch code from db
  const snapshot = await registrationCodes
    .orderByChild('code')
    .equalTo(code)
    .once('value')

  const data = snapshot.val()

  // if code exists return true
  return {
    isValid: !!data,
    companyUID: data?.companyUID,
  }
}
