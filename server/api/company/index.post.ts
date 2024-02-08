// POST /api/company
// endpoint for creating companies in the db

export default defineEventHandler(async (event) => {
  const { user } = event.context

  // only admins can create new companies
  if (!hasAccess(user, ['admin']))
    throw createError({
      statusCode: 401,
      statusMessage: 'Error (firebase/user-not-authorized).',
    })

  const { description, logo, name, type, webpage } = await readBody(event)

  const companiesRef = db.ref('companies')

  // description and logo are not required, but should be set by a company admin
  if (!name || !webpage || !type)
    throw createError({
      statusCode: 400,
      statusMessage: 'Error (company/missing-name-webpage-type).',
    })

  const companyRef = await companiesRef.push({
    description: description ?? null,
    logo: logo ?? null,
    name,
    type,
    webpage,
  })

  return {
    companyUID: companyRef.key,
  }
})
