// PUT /api/v1/board/:id/photo
// endpoint for a board member's portrait
import { setPortrait } from '@/application/board/members'
import { fail } from '@/domain/errors'
import { Instant } from '@/domain/time'
import { memberIdOf } from '@/server/board/memberId'
import { board, fileStorage, files, images } from '@/server/composition'

defineRouteMeta({
  openAPI: {
    tags: ['Board'],
    summary: "Upload a board member's portrait",
    description:
      'Admin only. Multipart with the picture in the part named `file`: PNG, JPEG or WebP, at ' +
      'most 10 MB. It is cropped around the centre and scaled to 800 x 960, stored as WebP ' +
      'without metadata, and replaces the old portrait. Answers with the member.',
    security: [{ bearerAuth: [] }, { cookieAuth: [] }],
  },
})

export default defineEventHandler(async (event) => {
  const { subject } = event.context
  const id = memberIdOf(event)
  setResourceContext(event, 'board', id, 'upload', 'Upload a portrait')
  if (!subject) throw fail('board/forbidden')

  const part = (await readMultipartFormData(event))?.find(
    (field) => field.name === 'file',
  )
  if (!part?.filename) throw fail('board/missing-file')
  addEventContext(event, 'file_size', part.data.byteLength)

  return setPortrait(
    { board, files, storage: fileStorage, images, now: Instant.now },
    {
      subject,
      id,
      name: part.filename,
      contentType: part.type ?? '',
      bytes: new Uint8Array(part.data),
    },
  )
})
