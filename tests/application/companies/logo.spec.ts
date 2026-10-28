import { describe, expect, it } from 'vitest'
import { setLogo, storeLogo } from '@/application/companies/logo'
import type { ImageProcessor } from '@/application/files/imageProcessor'
import type { Subject } from '@/domain/authorization/subject'
import { CompanyUid } from '@/domain/business/company'
import { Instant } from '@/domain/time'
import { UserUid, type Role } from '@/domain/user'
import { memoryCompanyRepository } from '@/server/adapters/memory/companyRepository'
import { memoryFileRepository } from '@/server/adapters/memory/fileRepository'
import { memoryFileStorage } from '@/server/adapters/memory/fileStorage'

const acme = CompanyUid.parse('acme')
const now = Instant.parse('2026-10-27T10:00:00.000Z')

const subject = (role: Role): Subject => ({
  uid: UserUid.parse(`${role}-1`),
  roles: [role],
  companies: new Map(),
  applicant: null,
})

/** Stands in for sharp: anything starting with "IMG" is a picture */
const images: ImageProcessor = {
  fit: () => Promise.resolve(null),
  trim: (bytes, { maxSide }) =>
    Promise.resolve(
      new TextDecoder().decode(bytes).startsWith('IMG')
        ? {
            bytes: new TextEncoder().encode(`TRIMMED ${maxSide}`),
            contentType: 'image/webp',
          }
        : null,
    ),
}

const setup = () => ({
  companies: memoryCompanyRepository([
    {
      uid: acme,
      name: 'Acme',
      relationship: 'partner',
      entitlementOverrides: {},
    },
  ]),
  files: memoryFileRepository(),
  storage: memoryFileStorage(),
  images,
  now: () => now,
})

const upload = (bytes = 'IMG logo', contentType = 'image/png') => ({
  now,
  company: acme,
  name: 'acme.png',
  contentType,
  bytes: new TextEncoder().encode(bytes),
})

describe('setLogo', () => {
  it('stores the trimmed logo as the company file and points the company at it', async () => {
    const deps = setup()
    const { logo } = await setLogo(deps, {
      ...upload(),
      subject: subject('admin'),
    })

    expect(await deps.companies.logoOf(acme)).toBe(logo)
    const [file] = await deps.files.ofOwner({ kind: 'company', uid: acme })
    expect(file).toMatchObject({ kind: 'logo', contentType: 'image/webp' })
  })

  it('keeps one logo file per company', async () => {
    const deps = setup()
    const admin = subject('admin')
    await setLogo(deps, { ...upload(), subject: admin })
    await setLogo(deps, { ...upload('IMG newer'), subject: admin })
    expect(
      await deps.files.ofOwner({ kind: 'company', uid: acme }),
    ).toHaveLength(1)
  })

  it('refuses a visitor', async () => {
    await expect(
      setLogo(setup(), { ...upload(), subject: undefined }),
    ).rejects.toMatchObject({ code: 'auth/signed-out' })
  })

  it('refuses what is not a picture, or not a known company', async () => {
    const deps = setup()
    await expect(
      storeLogo(deps, { ...upload('%PDF'), uploader: null }),
    ).rejects.toMatchObject({ code: 'company/unreadable-logo' })
    await expect(
      storeLogo(deps, {
        ...upload('IMG', 'image/gif'),
        uploader: null,
      }),
    ).rejects.toMatchObject({ code: 'file/unsupported-type' })
    await expect(
      storeLogo(deps, {
        ...upload(),
        company: CompanyUid.parse('gone'),
        uploader: null,
      }),
    ).rejects.toMatchObject({ code: 'company/not-found' })
  })
})
