import { describe, expect, it } from 'vitest'
import { UserUid } from '@/domain/user'
import { firebaseUserDirectory } from '@/server/adapters/firebase/userDirectory'

const uid = UserUid.parse('someone')
// only getUser and getUsers are asked for here; the removal tests stub deleteUsers
const unused = () => Promise.reject(new Error('not used here'))
const failing = (error: unknown) => ({
  getUser: () => Promise.reject(error),
  getUsers: unused,
  deleteUsers: unused,
})

describe('firebaseUserDirectory', () => {
  it('finds an account Firebase returns', async () => {
    const directory = firebaseUserDirectory({
      getUser: () => Promise.resolve({}) as never,
      getUsers: unused,
      deleteUsers: unused,
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

  it('looks contacts up a hundred accounts at a time, leaving out missing ones', async () => {
    const asked: number[] = []
    const directory = firebaseUserDirectory({
      getUser: unused,
      getUsers: (identifiers) => {
        asked.push(identifiers.length)
        const users = (identifiers as { uid: string }[])
          .filter(({ uid }) => uid !== 'u7')
          .map(({ uid }) => ({
            uid,
            displayName: `Name ${uid}`,
            email: `${uid}@example.com`,
          }))
        return Promise.resolve({ users, notFound: [] }) as never
      },
      deleteUsers: unused,
    })
    const uids = Array.from({ length: 150 }, (_, i) => UserUid.parse(`u${i}`))

    const contacts = await directory.contacts(uids)

    expect(asked).toEqual([100, 50])
    expect(contacts.size).toBe(149)
    expect(contacts.has(UserUid.parse('u7'))).toBe(false)
    expect(contacts.get(UserUid.parse('u1'))).toEqual({
      name: 'Name u1',
      email: 'u1@example.com',
    })
  })
})
