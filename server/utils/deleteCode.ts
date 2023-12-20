// utility function for deleting a registration code
// used when registering a company user or calling DELETE /api/code

export const deleteCode = async (code: string) => {
  // reference to registration codes
  const registrationCodesRef = db.ref('registrationCodes')

  // get reference to code
  const snapshot = await registrationCodesRef
    .orderByChild('code')
    .equalTo(code)
    .once('value')

  const data = snapshot.val()

  if (!data)
    throw createError({
      statusCode: 404,
      statusMessage: 'Code does not exist',
    })

  // get parent key of code
  const key = Object.keys(data)[0]

  // remove registration code
  await registrationCodesRef.child(key).remove()
}
