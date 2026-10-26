// PUT /api/v1/image/standmap/:day
// endpoint for uploading a fair day's stand map
import { putStandMap } from '@/application/fair/standMaps'
import { fail } from '@/domain/errors'
import { FairDay } from '@/domain/fair/day'
import { Instant } from '@/domain/time'
import { fileStorage, files, standMaps } from '@/server/composition'

defineRouteMeta({
  openAPI: {
    tags: ['Image'],
    summary: "Upload a fair day's stand map",
    description:
      'Admin only. Multipart with the image in the part named `file` (PNG, JPEG or WebP, at most ' +
      '10 MB). Replaces the map the day had. `day` is `YYYY-MM-DD`. Answers with the stored map ' +
      'as `{ day, name, url }`.',
    security: [{ bearerAuth: [] }, { cookieAuth: [] }],
  },
})

export default defineEventHandler(async (event) => {
  const { subject } = event.context
  const param = getRouterParam(event, 'day') ?? ''
  setResourceContext(
    event,
    'image',
    'standmap',
    'upload',
    "Upload a fair day's stand map",
  )

  const day = FairDay.tryParse(param)
  if (!day) throw fail('standmap/invalid-day')
  if (!subject) throw fail('standmap/forbidden')
  addEventContext(event, 'stand_map_day', day)

  const part = (await readMultipartFormData(event))?.find(
    (field) => field.name === 'file',
  )
  if (!part?.filename) throw fail('standmap/missing-file')
  addEventContext(event, 'file_size', part.data.byteLength)

  return putStandMap(
    { files, storage: fileStorage, standMaps, now: Instant.now },
    {
      subject,
      day,
      name: part.filename,
      contentType: part.type ?? '',
      bytes: new Uint8Array(part.data),
    },
  )
})
