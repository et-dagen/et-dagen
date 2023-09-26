// utility function for deleting a registration code
// used when registering a company user or calling DELETE /api/code

export const deleteCode = (code: string) => {
  // reference to companies
  const registrationCodesRef = db.ref('registrationCodes')

  // get reference to code
  const codeRef = registrationCodesRef.orderByChild('value').equalTo(code).ref

  // remove code
  codeRef.remove()
}
