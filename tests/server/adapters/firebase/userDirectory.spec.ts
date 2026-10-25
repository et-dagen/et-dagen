import { describe, expect, it } from 'vitest'
import { UserUid } from '@/domain/user'
import { firebaseUserDirectory } from '@/server/adapters/firebase/userDirectory'

const uid = UserUid.parse('someone')
const failing = (error: unknown) => ({
  getUser: () => Promise.reject(error),
})

describe('firebaseUserDirectory', () => {
  it('finds an account Firebase returns', async () => {
    const directory = firebaseUserDirectory({
      getUser: () => Promise.resolve({}) as never,
    })

    expect(await directory.exists(uid)).toBe(true)
  })

  it('reports a missing account', async () => {
    const directory = firebaseUserDirectory(
      failing({ code: 'auth/user-not-found' }),
    )

    expect(await directory.exists(uid)).toBe(false)
  })

  it('passes other failures on', async () => {
    const directory = firebaseUserDirectory(
      failing({ code: 'auth/internal-error' }),
    )

    await expect(directory.exists(uid)).rejects.toEqual({
      code: 'auth/internal-error',
    })
  })
})
