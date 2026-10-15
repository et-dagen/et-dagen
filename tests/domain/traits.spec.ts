import { describe, expect, it } from 'vitest'
import {
  CompanyUid,
  type Company,
  type CompanyWithDescription,
  type ListedCompany,
} from '~/domain/business/company'
import { JobUid, type Job } from '~/domain/business/job'
import type { HasDescription, HasLogo, HasWebpage } from '~/domain/traits'
import { HttpUrl } from '~/domain/url'

const acme: Company = {
  uid: CompanyUid.parse('c1'),
  name: 'Acme',
  relationship: 'partner',
}

/**
 * The point of naming capabilities separately: a bound on the capability alone, which accepts
 * anything that has it regardless of what kind of thing it is.
 */
const summarise = <T extends HasDescription>(item: T) =>
  item.description.slice(0, 8)

describe('composition', () => {
  it('combines capabilities without declaring a type per combination', () => {
    const listed: ListedCompany = {
      ...acme,
      description: 'Builds things',
      webpage: HttpUrl.parse('https://acme.no'),
      logo: HttpUrl.parse('https://acme.no/logo.png'),
    }

    expect(listed.name).toBe('Acme')
    expect(listed.webpage).toBe('https://acme.no/')
  })

  it('composes ad hoc at the use site, with no named type at all', () => {
    const branded: Company & HasWebpage & HasLogo = {
      ...acme,
      webpage: HttpUrl.parse('https://acme.no'),
      logo: HttpUrl.parse('https://acme.no/logo.png'),
    }

    expect(new URL(branded.logo).pathname).toBe('/logo.png')
  })

  it('keeps the old names working, now as intersections', () => {
    const described: CompanyWithDescription = {
      ...acme,
      description: 'Builds things',
    }
    expect(described.description).toBe('Builds things')
  })
})

describe('bounds over a capability', () => {
  it('accepts any entity carrying the capability', () => {
    const described: CompanyWithDescription = {
      ...acme,
      description: 'Builds things',
    }
    expect(summarise(described)).toBe('Builds t')
  })

  it('accepts an entity that satisfies the trait structurally without declaring it', () => {
    // Job never mentions HasDescription. TypeScript matches by shape, so it qualifies anyway.
    const job: Job = {
      uid: JobUid.parse('j1'),
      companyUid: CompanyUid.parse('c1'),
      description: 'Graduate role',
      location: { name: 'Trondheim' },
      title: 'Engineer',
      type: 'graduate',
    }

    expect(summarise(job)).toBe('Graduate')
  })
})

describe('what stays rejected', () => {
  it('does not let a bare company stand in for one with a description', () => {
    // @ts-expect-error description is missing
    const bad: CompanyWithDescription = acme
    expect(bad.name).toBe('Acme')
  })

  it('does not accept an unvalidated string as a webpage', () => {
    const bad: Company & HasWebpage = {
      ...acme,
      // @ts-expect-error a raw string has not been through HttpUrl.parse
      webpage: 'https://acme.no',
    }
    expect(bad.webpage).toBe('https://acme.no')
  })
})
