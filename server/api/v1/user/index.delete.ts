// DELETE /api/v1/user
// endpoint for removing a user in the database

import { eraseUsers } from '@/server/user/erasure'
import { authorize } from '@/domain/authorization/authorize'
import { hasPermission } from '@/domain/authorization/hasPermission'
import { Instant } from '@/domain/time'

defineRouteMeta({
  openAPI: {
    tags: ['User'],
    summary: 'Delete user(s)',
    description:
      'Deletes the caller when no UIDs are supplied. Passing UIDs requires admin. Removes ' +
      'everything about each user: résumé files, places on events, the profile and the account.',
    security: [{ bearerAuth: [] }, { cookieAuth: [] }],
    // TODO(api-docs): fill in the request/response schemas below.
    // Shapes are sketched from current handler behaviour - verify each
    // against the handler before uncommenting.
    // requestBody: {
    //   content: {
    //     'application/json': {
    //       schema: {
    //         type: 'object',
    //         properties: {
    //           UIDs: {
    //             type: 'array',
    //             items: { type: 'string' },
    //             description: 'Admin only. Omit to delete the calling user.',
    //           },
    //         },
    //       },
    //     },
    //   },
    // },
    // responses: {
    //   204: { description: 'Deleted' },
    //   401: { description: 'Error (firebase/user-not-authorized).' },
    // },
  },
})

export default defineEventHandler(async (event) => {
  const { subject } = event.context

  // Set resource context for wide event logging
  setResourceContext(event, 'user', subject?.uid, 'delete', 'Delete user(s)')
  setLogImportance(event, 'warn')

  const env = { now: Instant.now() }
  authorize(subject, 'user', 'delete', { uid: subject?.uid, scope: 'own' }, env)

  // get request body
  let { UIDs } = await readBody(event)

  // only admins can remove other users than their own
  if (
    !UIDs ||
    !hasPermission(subject, 'user', 'delete', { scope: 'all' }, env)
  ) {
    UIDs = subject.uid
  }

  // UIDs can be passed both as an array or a single UID string
  if (typeof UIDs !== 'object') UIDs = [UIDs]

  addEventContext(event, 'target_uid_count', (UIDs as string[]).length)

  // remove résumé files, event places, profiles and accounts
  await withDbTiming(event, 'users', 'delete', () =>
    eraseUsers({ db, files: storage.bucket(), auth }, UIDs as string[]),
  )

  // the caller's token cookie points at an account that no longer exists
  if ((UIDs as string[]).includes(subject.uid)) deleteCookie(event, '_token')

  // users successfully removed
  sendNoContent(event, 204)
})
