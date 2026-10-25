// DELETE /api/v1/image/standmap/:day
// endpoint for removing a fair day's stand map
import { removeStandMap } from '@/application/fair/standMaps'
import { fail } from '@/domain/errors'
import { FairDay } from '@/domain/fair/day'
import { Instant } from '@/domain/time'
import { subjectOf } from '@/server/adapters/rtdb/userRecord'
import { fileStorage, files, standMaps } from '@/server/composition'

defineRouteMeta({
  openAPI: {
    tags: ['Image'],
    summary: "Remove a fair day's stand map",
    description:
      'Admin only. Removes the map uploaded for the day (`YYYY-MM-DD`) and its file. A map ' +
      'stored the old way, under `standmaps/` in the bucket, is not touched.',
    security: [{ bearerAuth: [] }, { cookieAuth: [] }],
  },
})

export default defineEventHandler(async (event) => {
  const { user } = event.context
  setResourceContext(
    event,
    'image',
    'standmap',
    'delete',
    "Remove a fair day's stand map",
  )

  const day = FairDay.tryParse(getRouterParam(event, 'day') ?? '')
  if (!day) throw fail('standmap/invalid-day')
  if (!user) throw fail('standmap/forbidden')
  addEventContext(event, 'stand_map_day', day)

  await removeStandMap(
    { files, storage: fileStorage, standMaps },
    { subject: subjectOf(user.uid, user, Instant.now()), day },
  )
  sendNoContent(event, 204)
})
