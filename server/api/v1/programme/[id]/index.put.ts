// PUT /api/v1/programme/:id
// endpoint for changing a study programme
import { defineEventHandler, readBody } from 'h3'
import { defineRouteMeta } from 'nitropack/runtime'
import { updateProgramme } from '@/application/fair/programmes'
import { fail } from '@/domain/errors'
import { checkedProgrammeInput } from '@/domain/fair/programme'
import { Instant } from '@/domain/time'
import { programmes } from '@/server/composition'
import { programmeIdOf } from '@/server/fair/programmeId'
import {
  addEventContext,
  setResourceContext,
} from '@/server/utils/wideEventHelpers'

defineRouteMeta({
  openAPI: {
    tags: ['Reference'],
    summary: 'Change a study programme',
    description:
      'Admin only. Same body as adding one. A new name moves every student on the old name ' +
      'to it; the response says how many moved: `{ programme, moved }`.',
    security: [{ bearerAuth: [] }, { cookieAuth: [] }],
  },
})

export default defineEventHandler(async (event) => {
  const { subject } = event.context
  const id = programmeIdOf(event)
  setResourceContext(event, 'programme', id, 'update', 'Change a programme')

  const input = checkedProgrammeInput(await readBody(event))
  if ('problem' in input) throw fail(input.problem)

  const result = await updateProgramme(
    { programmes },
    { subject, now: Instant.now(), id, input },
  )
  addEventContext(event, 'students_moved', result.moved)
  return result
})
