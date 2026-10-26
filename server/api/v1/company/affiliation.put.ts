// PUT /api/v1/company/affiliation
// endpoint for setting a company's tier and entitlement overrides
import { setAffiliation } from '@/application/companies/affiliation'
import { checkedAffiliation } from '@/domain/authorization/affiliation'
import { CompanyUid } from '@/domain/business/company'
import { fail } from '@/domain/errors'
import { Instant } from '@/domain/time'
import { affiliations, companies } from '@/server/composition'

defineRouteMeta({
  openAPI: {
    tags: ['Company'],
    summary: "Set a company's tier and entitlements",
    description:
      'Admin only. Body: `{ companyUID, tier, overrides }`, where `tier` is `mainPartner`, ' +
      '`partner`, `sponsor` or `prior` and `overrides` maps an entitlement such as ' +
      '`ent:resume:view` to true or false against what the tier grants.',
    security: [{ bearerAuth: [] }, { cookieAuth: [] }],
  },
})

export default defineEventHandler(async (event) => {
  const { subject } = event.context
  const body = await readBody(event)
  setResourceContext(
    event,
    'company',
    body?.companyUID,
    'entitle',
    "Set a company's tier and entitlements",
  )
  setLogImportance(event, 'warn')

  const affiliation = checkedAffiliation(body)
  if ('problem' in affiliation) throw fail(affiliation.problem)
  if (typeof body.companyUID !== 'string' || body.companyUID === '')
    throw fail('company/invalid-affiliation')

  addEventContext(event, 'tier', affiliation.tier)

  await setAffiliation(
    { affiliations, companies },
    {
      subject,
      company: CompanyUid.parse(body.companyUID),
      affiliation,
      now: Instant.now(),
    },
  )
  sendNoContent(event, 204)
})
