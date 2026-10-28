// POST /api/v1/company
// endpoint for creating companies in the db

import { authorize } from '@/domain/authorization/authorize'
import { Instant } from '@/domain/time'
import { fail } from '@/domain/errors'
import { safeLink } from '@/server/security/richText'

defineRouteMeta({
  openAPI: {
    tags: ['Company', 'internal'],
    summary: 'Create company',
    description:
      'Admin only. Body: `{ name, webpage, description?, logo? }`. The tier and résumé ' +
      'access are set with `PUT /api/v1/company/affiliation`.',
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
    //         required: ['name', 'webpage'],
    //         properties: {
    //           name: { type: 'string' },
    //           webpage: { type: 'string' },
    //           description: { type: 'string', nullable: true },
    //           logo: { type: 'string', nullable: true },
    //         },
    //       },
    //     },
    //   },
    // },
    // responses: {
    //   200: { description: 'Created. Returns { companyUID }' },
    //   400: { description: 'company/missing-name-or-webpage' },
    //   401: { description: 'auth/signed-out' },
    //   403: { description: 'auth/forbidden' },
    // },
  },
})

export default defineEventHandler(async (event) => {
  const { subject } = event.context

  // Set resource context for wide event logging
  setResourceContext(event, 'company', undefined, 'create', 'Create company')
  setLogImportance(event, 'warn')

  authorize(subject, 'company', 'create', undefined, { now: Instant.now() })

  const { description, logo, name, webpage } = await readBody(event)

  const companiesRef = db.ref('companies')

  // description and logo are not required, but should be set by a company admin
  if (!name || !webpage) throw fail('company/missing-name-or-webpage')

  if (!safeLink(webpage)) throw fail('company/invalid-webpage')

  const companyRef = companiesRef.push({
    description: description ?? null,
    logo: logo ?? null,
    name,
    webpage: safeLink(webpage),
  })

  // Preserve the original await-on-commit while recording timing.
  // .key is read from the synchronous push reference below, so awaiting the
  // adopted promise here is only used for commit timing.
  await withDbTiming(event, 'companies', 'write', () =>
    Promise.resolve(companyRef),
  )

  addEventContext(event, 'created_company_uid', companyRef.key)

  return {
    companyUID: companyRef.key,
  }
})
