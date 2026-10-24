import { describe, expect, it } from 'vitest'
import { CompanyUid } from '@/domain/business/company'
import {
  FileId,
  sameOwner,
  storagePathOf,
  uploadProblem,
} from '@/domain/files/file'
import { UserUid } from '@/domain/user'

const ada = { kind: 'user', uid: UserUid.parse('ada') } as const
const polarbit = { kind: 'company', uid: CompanyUid.parse('polarbit') } as const
const id = FileId.parse('0f3c8a52-5f7e-4c1b-9d2a-3b6e8f1a2c4d')

describe('storagePathOf', () => {
  it('builds the path from the owner, the kind and the id only', () => {
    expect(
      storagePathOf({
        id,
        owner: ada,
        kind: 'resume',
        contentType: 'application/pdf',
      }),
    ).toBe(`users/ada/resumes/${id}.pdf`)
    expect(
      storagePathOf({
        id,
        owner: polarbit,
        kind: 'logo',
        contentType: 'image/jpeg',
      }),
    ).toBe(`companies/polarbit/logos/${id}.jpg`)
    expect(
      storagePathOf({
        id,
        owner: { kind: 'fair' },
        kind: 'standmap',
        contentType: 'image/png',
      }),
    ).toBe(`fair/standmaps/${id}.png`)
  })
})

describe('uploadProblem', () => {
  it('accepts a file that fits its kind', () => {
    expect(uploadProblem('resume', ada, 'application/pdf', 200_000)).toBeNull()
    expect(uploadProblem('avatar', ada, 'image/webp', 200_000)).toBeNull()
    expect(uploadProblem('logo', polarbit, 'image/png', 200_000)).toBeNull()
  })

  it('refuses the wrong owner, format or size', () => {
    expect(uploadProblem('logo', ada, 'image/png', 10)).toEqual({
      kind: 'wrong-owner',
    })
    expect(uploadProblem('resume', ada, 'image/png', 10)).toMatchObject({
      kind: 'unsupported-type',
    })
    expect(uploadProblem('avatar', ada, 'image/svg+xml', 10)).toMatchObject({
      kind: 'unsupported-type',
    })
    expect(
      uploadProblem('avatar', ada, 'image/png', 3 * 1024 * 1024),
    ).toMatchObject({ kind: 'too-large' })
    expect(uploadProblem('resume', ada, 'application/pdf', 0)).toEqual({
      kind: 'empty',
    })
  })
})

describe('sameOwner', () => {
  it('compares kind and uid', () => {
    expect(sameOwner(ada, { kind: 'user', uid: UserUid.parse('ada') })).toBe(
      true,
    )
    expect(
      sameOwner(ada, { kind: 'company', uid: CompanyUid.parse('ada') }),
    ).toBe(false)
    expect(sameOwner({ kind: 'fair' }, { kind: 'fair' })).toBe(true)
  })
})
