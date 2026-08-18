// DELETE /api/v1/company
// endpoint for removing a company from db

defineRouteMeta({
  openAPI: {
    tags: ['Company'],
    summary: 'Remove company',
    description:
      'Admin only. Also deletes every storage object under companies/<companyUID>/.',
    security: [{ bearerAuth: [] }, { cookieAuth: [] }],
    // TODO(api-docs): fill in the request/response schemas below.
    // Shapes are sketched from current handler behaviour - verify each
    // against the handler before uncommenting.
    // requestBody: {
    //   required: true,
    //   content: {
    //     'application/json': {
    //       schema: {
    //         type: 'object',
    //         required: ['companyUID'],
    //         properties: { companyUID: { type: 'string' } },
    //       },
    //     },
    //   },
    // },
    // responses: {
    //   204: { description: 'Removed' },
    //   401: { description: 'Error (firebase/user-not-authorized).' },
    // },
  },
})

export default defineEventHandler(async (event) => {
  const { user } = event.context

  // Set resource context for wide event logging
  setResourceContext(event, 'company', undefined, 'delete', 'Remove company')
  setLogImportance(event, 'warn')

  // only admins can remove companies
  if (!hasAccess(user, ['admin'])) {
    setErrorContext(event, {
      code: 'firebase/user-not-authorized',
      message: 'User not authorized to remove companies',
    })
    throw createError({
      statusCode: 401,
      statusMessage: 'Error (firebase/user-not-authorized).',
    })
  }

  // get request body
  const { companyUID } = await readBody(event)

  addEventContext(event, 'company_uid', companyUID)

  // reference to companies
  const companiesRef = db.ref('companies')

  // remove company
  companiesRef.child(companyUID).remove()
  trackDbDelete(event, `companies/${companyUID}`)

  // fetch storage bucket
  const bucket = storage.bucket()

  // delete all files linked to company
  await bucket.deleteFiles({
    prefix: `companies/${companyUID}/`,
  })

  // company successfully removed
  sendNoContent(event, 204)
})
