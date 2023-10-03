// GET /api/company
// endpoint for fetching companies from db

export default defineEventHandler(async (event) => {
  const { companyUID } = getQuery(event)

  const companiesRef = db.ref('companies')

  // return all companies if no company is specified
  if (!companyUID) {
    const snapshot = await companiesRef.orderByKey().once('value')
    const data = snapshot.val()

    return data
  }

  // get specified company
  const snapshot = await companiesRef
    .orderByKey()
    .equalTo(companyUID as string)
    .once('value')

  const data = snapshot.val()

  return data
})
