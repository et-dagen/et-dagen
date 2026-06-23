// PUT /api/company
// endpoint for modifying companies in the db

export default defineEventHandler(async (event) => {
  const { user } = event.context

  // get request body
  const { companyUID, ...newData } = await readBody(event)

  // Set resource context for wide event logging
  setResourceContext(event, 'company', companyUID, 'update', 'Modify company')
  setLogImportance(event, 'warn')

  const isAdmin = hasAccess(user, ['admin'])
  const isCompanyAdmin =
    hasAccess(user, ['company']) && user.companyUID === companyUID

  addEventContext(event, 'is_admin', isAdmin)
  addEventContext(event, 'is_company_admin', isCompanyAdmin)

  // only admins and company admins can modify companies
  if (!isAdmin && !isCompanyAdmin) {
    setErrorContext(event, {
      code: 'firebase/user-not-authorized',
      message: 'User not authorized to modify companies',
    })
    throw createError({
      statusCode: 401,
      statusMessage: 'Error (firebase/user-not-authorized).',
    })
  }

  // reference to companies
  const companiesRef = db.ref('companies')

  // check if the company exists
  const snapshot = await withDbTiming(
    event,
    `companies/${companyUID}`,
    'read',
    () => companiesRef.orderByKey().equalTo(companyUID).once('value'),
  )

  const data = snapshot.val()

  // the company does not exist in db
  if (!data) {
    setErrorContext(event, {
      code: 'company/not-found',
      message: 'Company not found',
    })
    throw createError({
      statusCode: 404,
      statusMessage: 'Error (company/not-found).',
    })
  }

  // only admins can change company types
  if (!isAdmin) delete newData.type

  // update company data
  companiesRef.child(companyUID).update(newData)
  trackDbWrite(event, `companies/${companyUID}`)

  // successfully modified companies
  sendNoContent(event, 204)
})
