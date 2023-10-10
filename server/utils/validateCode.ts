export const validateCode = async (code: string) => {
  // reference to registration codes in db
  const registrationCodes = db.ref('registrationCodes')

  // fetch code from db
  const snapshot = await registrationCodes
    .orderByChild('code')
    .equalTo(code)
    .once('value')

  // get code data and companyUID
  const data = snapshot.val()
  const companyUID = data ? data[Object.keys(data)[0]].companyUID : null

  return {
    isValid: !!data,
    companyUID,
  }
}
