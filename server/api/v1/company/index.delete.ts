// DELETE /api/v1/company
// endpoint for removing a company from db

import { authorize } from '@/domain/authorization/authorize'
import { CompanyUid } from '@/domain/business/company'
import { Instant } from '@/domain/time'
import { affiliations } from '@/server/composition'

defineRouteMeta({
  openAPI: {
    tags: ['Company', 'internal'],
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
    //   401: { description: 'auth/signed-out' },
    //   403: { description: 'auth/forbidden' },
    // },
  },
})

export default defineEventHandler(async (event) => {
  const { subject } = event.context

  // Set resource context for wide event logging
  setResourceContext(event, 'company', undefined, 'delete', 'Remove company')
  setLogImportance(event, 'warn')

  authorize(subject, 'company', 'delete', undefined, { now: Instant.now() })

  // get request body
  const { companyUID } = await readBody(event)

  addEventContext(event, 'company_uid', companyUID)

  // reference to companies
  const companiesRef = db.ref('companies')

  // remove company
  companiesRef.child(companyUID).remove()
  trackDbDelete(event, `companies/${companyUID}`)

  await affiliations.remove([CompanyUid.parse(companyUID)])
  trackDbDelete(event, `affiliations/${companyUID}`)

  // fetch storage bucket
  const bucket = storage.bucket()

  // delete all files linked to company
  await bucket.deleteFiles({
    prefix: `companies/${companyUID}/`,
  })

  // company successfully removed
  sendNoContent(event, 204)
})
