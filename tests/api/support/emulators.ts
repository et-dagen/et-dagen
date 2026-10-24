/**
 * Talks to the Firebase emulators directly, to set up and inspect what the API sees
 *
 * `firebase emulators:exec` exports the hosts below; the `demo-` project id makes the emulators
 * refuse to reach any real Firebase project.
 */
export const PROJECT_ID = 'demo-et-dagen'

/** The emulator's default database for the project; other namespaces work but log a warning */
export const DATABASE_NAMESPACE = `${PROJECT_ID}-default-rtdb`

export const EMULATOR_HOSTS = [
  'FIREBASE_AUTH_EMULATOR_HOST',
  'FIREBASE_DATABASE_EMULATOR_HOST',
  'FIREBASE_STORAGE_EMULATOR_HOST',
] as const

const host = (name: (typeof EMULATOR_HOSTS)[number]) => {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is not set; run \`bun run test:api\``)
  return value
}

/** The database the API server is pointed at */
export const databaseUrl = () =>
  `http://${host('FIREBASE_DATABASE_EMULATOR_HOST')}?ns=${DATABASE_NAMESPACE}`

const dbUrl = (path: string) => databaseUrl().replace('?', `/${path}.json?`)

const authUrl = (path: string) =>
  `http://${host('FIREBASE_AUTH_EMULATOR_HOST')}/${path}`

/**
 * `Bearer owner` is the emulators' admin credential. It bypasses database rules, and makes the
 * Auth emulator treat a sign-up as an admin call, which returns no ID token.
 */
async function call(url: string, init: RequestInit = {}, asOwner = true) {
  const response = await fetch(url, {
    ...init,
    headers: {
      ...(asOwner && { authorization: 'Bearer owner' }),
      ...init.headers,
    },
  })
  if (!response.ok) {
    throw new Error(`${init.method ?? 'GET'} ${url}: ${response.status}`)
  }
  return response.json()
}

/** Empty the database and delete every account */
export async function resetEmulators(): Promise<void> {
  await call(dbUrl(''), { method: 'PUT', body: 'null' })
  await call(authUrl(`emulator/v1/projects/${PROJECT_ID}/accounts`), {
    method: 'DELETE',
  })
}

export const seed = (path: string, value: unknown): Promise<unknown> =>
  call(dbUrl(path), { method: 'PUT', body: JSON.stringify(value) })

export const read = (path: string): Promise<unknown> => call(dbUrl(path))

let accounts = 0

/**
 * Create a signed-in account, and its `users/<uid>` record when one is given
 *
 * @returns the uid and an ID token the API accepts as `Authorization: Bearer <token>`
 */
export async function createUser(
  record?: Record<string, unknown>,
): Promise<{ uid: string; token: string }> {
  const account = (await call(
    authUrl('identitytoolkit.googleapis.com/v1/accounts:signUp?key=emulator'),
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        email: `user${++accounts}@example.com`,
        password: 'password',
        returnSecureToken: true,
      }),
    },
    false,
  )) as { localId: string; idToken: string }

  if (record) await seed(`users/${account.localId}`, record)
  return { uid: account.localId, token: account.idToken }
}

/** Whether the Auth emulator still has an account with this uid */
export async function accountExists(uid: string): Promise<boolean> {
  const { users } = (await call(
    authUrl(
      `identitytoolkit.googleapis.com/v1/projects/${PROJECT_ID}/accounts:lookup`,
    ),
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ localId: [uid] }),
    },
  )) as { users?: unknown[] }
  return (users?.length ?? 0) > 0
}
