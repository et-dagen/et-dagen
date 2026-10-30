// GET /api/v1/company
// endpoint for fetching companies from db

import type { H3Event } from 'h3'
import {
  entitlementsFor,
  type EntitledCompany,
} from '@/domain/authorization/entitlements'
import { hasPermission } from '@/domain/authorization/hasPermission'
import { CompanyUid } from '@/domain/business/company'
import { Instant } from '@/domain/time'
import { companies } from '@/server/composition'
import { readableCompanies } from '@/server/security/richText'

defineRouteMeta({
  openAPI: {
    tags: ['Company'],
    summary: 'List companies or fetch one',
    description:
      'Public. Without companyUID returns every company keyed by UID; with it returns a ' +
      'single-entry map. Returns null when empty. Each company has its `tier`; admins also get ' +
      'the `entitlements` the tier and its overrides grant.',
    security: [],
    parameters: [
      {
        name: 'companyUID',
        in: 'query',
        required: false,
        schema: { type: 'string' },
        description: 'Omit to list all companies',
      },
    ],
    // TODO(api-docs): fill in the request/response schemas below.
    // Shapes are sketched from current handler behaviour - verify each
    // against the handler before uncommenting.
    // responses: {
    //   200: { description: 'Map of company UID to Company, or null' },
    // },
  },
})

export default defineEventHandler(async (event) => {
  const { companyUID } = getQuery(event)

  // Set resource context for wide event logging
  setResourceContext(
    event,
    'company',
    companyUID as string | undefined,
    companyUID ? 'get' : 'list',
    companyUID ? 'Fetch single company' : 'List all companies',
  )
  setLogImportance(event, 'debug')

  const companiesRef = db.ref('companies')

  // return all companies if no company is specified
  if (!companyUID) {
    const snapshot = await withDbTiming(event, 'companies', 'read', () =>
      companiesRef.orderByKey().once('value'),
    )
    const data = snapshot.val()

    // Add result metadata to wide event
    addEventContext(event, 'result_count', data ? Object.keys(data).length : 0)

    return readableCompanies(withTiers(event, data, await companies.all()))
  }

  // get specified company
  const snapshot = await withDbTiming(
    event,
    `companies/${companyUID}`,
    'read',
    () =>
      companiesRef
        .orderByKey()
        .equalTo(companyUID as string)
        .once('value'),
  )

  const data = snapshot.val()

  // Track whether company was found
  addEventContext(event, 'company_found', !!data)

  return readableCompanies(
    withTiers(
      event,
      data,
      await companies.entitled([CompanyUid.parse(companyUID as string)]),
    ),
  )
})

/** Add each company's tier from its affiliation, and for admins what it is entitled to */
function withTiers<T>(
  event: H3Event,
  records: T,
  entitled: EntitledCompany[],
): T {
  if (!records) return records
  const showEntitlements = hasPermission(
    event.context.subject,
    'company',
    'entitle',
    undefined,
    { now: Instant.now() },
  )
  const byUid = new Map(entitled.map((company) => [company.uid, company]))
  return Object.fromEntries(
    Object.entries(records as Record<string, object>).map(([uid, record]) => {
      const company = byUid.get(CompanyUid.parse(uid))
      return [
        uid,
        {
          ...record,
          tier: company?.relationship ?? 'prior',
          ...(company?.formerRelationship && {
            formerTier: company.formerRelationship,
          }),
          ...(showEntitlements && {
            entitlements: company ? [...entitlementsFor(company)] : [],
          }),
        },
      ]
    }),
  ) as T
}
