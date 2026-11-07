// DELETE /api/v1/programme/:id
// endpoint for deleting a study programme no student has
import { defineEventHandler, sendNoContent } from 'h3'
import { defineRouteMeta } from 'nitropack/runtime'
import { removeProgramme } from '@/application/fair/programmes'
import { Instant } from '@/domain/time'
import { programmes } from '@/server/composition'
import { programmeIdOf } from '@/server/fair/programmeId'
import { setResourceContext } from '@/server/utils/wideEventHelpers'

defineRouteMeta({
  openAPI: {
    tags: ['Reference'],
    summary: 'Delete a study programme',
    description:
      'Admin only. Refused with 409 `programme/in-use` while a student has the programme; ' +
      'close it instead.',
    security: [{ bearerAuth: [] }, { cookieAuth: [] }],
  },
})

export default defineEventHandler(async (event) => {
  const { subject } = event.context
  const id = programmeIdOf(event)
  setResourceContext(event, 'programme', id, 'delete', 'Delete a programme')

  await removeProgramme({ programmes }, { subject, now: Instant.now(), id })
  return sendNoContent(event)
})
