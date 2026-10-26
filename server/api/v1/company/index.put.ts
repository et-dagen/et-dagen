// PUT /api/v1/company
// endpoint for modifying companies in the db

import { authorize } from '@/domain/authorization/authorize'
import { hasPermission } from '@/domain/authorization/hasPermission'
import { CompanyUid } from '@/domain/business/company'
import { fail } from '@/domain/errors'
import { Instant } from '@/domain/time'
import { safeLink } from '@/server/security/richText'

const COMPANY_EDITABLE_FIELDS = ['name', 'description', 'logo', 'webpage']

defineRouteMeta({
  openAPI: {
    tags: ['Company'],
    summary: 'Modify company',
    description:
      'Admin, or a company user editing their own company. Non-admins cannot change `type` - it ' +
      'is stripped server-side.',
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
    //         additionalProperties: true,
    //       },
    //     },
    //   },
    // },
    // responses: {
    //   204: { description: 'Updated' },
    //   401: { description: 'auth/signed-out' },
    //   403: { description: 'auth/forbidden' },
    //   404: { description: 'Error (company/not-found).' },
    // },
  },
})

export default defineEventHandler(async (event) => {
  const { subject } = event.context

  // get request body
  const { companyUID, ...newData } = await readBody(event)

  // Set resource context for wide event logging
  setResourceContext(event, 'company', companyUID, 'update', 'Modify company')
  setLogImportance(event, 'warn')

  const company =
    typeof companyUID === 'string' && companyUID !== ''
      ? { uid: CompanyUid.parse(companyUID) }
      : undefined
  const env = { now: Instant.now() }
  authorize(subject, 'company', 'update', company, env)
  const mayEntitle = hasPermission(subject, 'company', 'entitle', company, env)
  addEventContext(event, 'is_admin', mayEntitle)

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

  // company users may change only their profile; type and résumé access are set by admins
  const updates = mayEntitle
    ? newData
    : Object.fromEntries(
        Object.entries(newData).filter(([key]) =>
          COMPANY_EDITABLE_FIELDS.includes(key),
        ),
      )

  if ('webpage' in updates) {
    if (!safeLink(updates.webpage)) throw fail('company/invalid-webpage')
    updates.webpage = safeLink(updates.webpage)
  }

  // update company data
  companiesRef.child(companyUID).update(updates)
  trackDbWrite(event, `companies/${companyUID}`)

  // successfully modified companies
  sendNoContent(event, 204)
})
