import { spawn } from 'node:child_process'
import { generateKeyPairSync } from 'node:crypto'
import { createWriteStream, existsSync } from 'node:fs'
import { API_PORT } from './api'
import { databaseUrl, EMULATOR_HOSTS, PROJECT_ID } from './emulators'

const ENTRY = '.output/server/index.mjs'
const LOG_FILE = '.output/api-test-server.log'

/**
 * Start the production build against the emulators, for the whole API test run
 *
 * @remarks
 * Every Firebase setting the server reads is overridden, so values baked into the build from a
 * local `.env` are never used. The service-account key is generated per run and only has to
 * parse; the emulators do not check it.
 */
export default async function setup(): Promise<() => void> {
  const missing = EMULATOR_HOSTS.filter((name) => !process.env[name])
  if (missing.length > 0) {
    throw new Error(
      `${missing.join(', ')} not set. Run the API tests with \`bun run test:api\`.`,
    )
  }
  if (!existsSync(ENTRY)) {
    throw new Error(`${ENTRY} is missing. Run \`bun run build\` first.`)
  }

  const { privateKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    publicKeyEncoding: { type: 'spki', format: 'pem' },
  })

  const server = spawn('node', [ENTRY], {
    env: {
      ...process.env,
      NODE_ENV: 'production',
      PORT: String(API_PORT),
      LOG_LEVEL: 'warn',
      LOG_COLOR: 'never',
      NUXT_FIREBASE_ADMIN_PROJECT_ID: PROJECT_ID,
      NUXT_FIREBASE_ADMIN_CLIENT_EMAIL: `api-tests@${PROJECT_ID}.iam.gserviceaccount.com`,
      NUXT_FIREBASE_ADMIN_PRIVATE_KEY: privateKey,
      NUXT_FIREBASE_ADMIN_STORAGE_BUCKET: `${PROJECT_ID}.appspot.com`,
      NUXT_PUBLIC_FIREBASE_DATABASE_URL: databaseUrl(),
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  const log = createWriteStream(LOG_FILE)
  server.stdout.pipe(log)
  server.stderr.pipe(log)

  await waitForServer(server)
  return () => server.kill()
}

async function waitForServer(server: ReturnType<typeof spawn>) {
  for (let attempt = 0; attempt < 100; attempt++) {
    if (server.exitCode !== null) {
      throw new Error(`The API server exited; see ${LOG_FILE}`)
    }
    try {
      await fetch(`http://127.0.0.1:${API_PORT}/api/v1/programme`)
      return
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 200))
    }
  }
  server.kill()
  throw new Error(`The API server did not start; see ${LOG_FILE}`)
}
