import { describe, expect, it } from 'vitest'
import { resetTiers, TIER_RESET_TASK } from '@/application/companies/tierReset'
import { CompanyUid } from '@/domain/business/company'
import { Instant, type ISO8601Literal } from '@/domain/time'
import { UserUid } from '@/domain/user'
import { memoryAffiliationRepository } from '@/server/adapters/memory/affiliationRepository'

const [acme, globex, initech, umbrella] = [
  'acme',
  'globex',
  'initech',
  'umbrella',
].map(CompanyUid.parse)
const admin = UserUid.parse('admin')
const at = (instant: ISO8601Literal) => ({
  at: Instant.parse(instant),
  by: admin,
})
const resetDay = Instant.parse('2027-06-01T04:00:00.000Z')

const setup = async () => {
  const affiliations = memoryAffiliationRepository()
  // the last fair's: a partner with résumés, a sponsor, a former company with résumés left on
  await affiliations.set(
    acme,
    { tier: 'partner', overrides: { 'ent:resume:view': true } },
    at('2026-09-01T10:00:00.000Z'),
  )
  await affiliations.set(
    globex,
    { tier: 'sponsor', overrides: {} },
    at('2027-01-15T10:00:00.000Z'),
  )
  await affiliations.set(
    umbrella,
    { tier: 'prior', overrides: { 'ent:resume:view': true } },
    at('2026-11-01T10:00:00.000Z'),
  )
  // signed for the next fair after this one
  await affiliations.set(
    initech,
    { tier: 'partner', overrides: { 'ent:resume:view': true } },
    at('2027-04-10T10:00:00.000Z'),
  )
  return affiliations
}

describe('resetTiers', () => {
  it("makes the last fair's companies former, and leaves the next fair's", async () => {
    const affiliations = await setup()

    expect(await resetTiers({ affiliations }, { now: resetDay })).toBe(3)
    expect(affiliations.read(acme)).toEqual({
      tier: 'prior',
      overrides: {},
      formerTier: 'partner',
    })
    expect(affiliations.read(globex)).toEqual({
      tier: 'prior',
      overrides: {},
      formerTier: 'sponsor',
    })
    expect(affiliations.read(umbrella)).toEqual({
      tier: 'prior',
      overrides: {},
    })
    expect(affiliations.read(initech)).toEqual({
      tier: 'partner',
      overrides: { 'ent:resume:view': true },
    })
  })

  it('stamps its changes as the task', async () => {
    const affiliations = await setup()
    await resetTiers({ affiliations }, { now: resetDay })

    const acmeStored = (await affiliations.all()).find(
      (stored) => stored.company === acme,
    )
    expect(acmeStored?.setAt).toBe(resetDay)
    expect(TIER_RESET_TASK).toBe('task:companies:tier-reset')
  })

  it('changes nothing when run again', async () => {
    const affiliations = await setup()
    await resetTiers({ affiliations }, { now: resetDay })

    expect(await resetTiers({ affiliations }, { now: resetDay })).toBe(0)
  })

  it("forgets the former tier a year on, so only the last fair's companies have one", async () => {
    const affiliations = await setup()
    await resetTiers({ affiliations }, { now: resetDay })

    await resetTiers(
      { affiliations },
      { now: Instant.parse('2028-06-01T04:00:00.000Z') },
    )
    expect(affiliations.read(acme)).toEqual({ tier: 'prior', overrides: {} })
    expect(affiliations.read(initech)).toEqual({
      tier: 'prior',
      overrides: {},
      formerTier: 'partner',
    })
  })
})
