// PUT /api/v1/programme/:code
// endpoint for changing a study programme
import { defineEventHandler, readBody } from 'h3'
import { defineRouteMeta } from 'nitropack/runtime'
import { updateProgramme } from '@/application/fair/programmes'
import { fail } from '@/domain/errors'
import { checkedProgrammeDetails } from '@/domain/fair/programme'
import { Instant } from '@/domain/time'
import { programmes } from '@/server/composition'
import { programmeCodeOf } from '@/server/fair/programmeCode'
import { setResourceContext } from '@/server/utils/wideEventHelpers'

defineRouteMeta({
  openAPI: {
    tags: ['Reference'],
    summary: 'Change a study programme',
    description:
      'Admin only. Body: `{ name, degree, open? }`; the code stays. Students point at the ' +
      'code, so a new name reaches them as it is.',
    security: [{ bearerAuth: [] }, { cookieAuth: [] }],
  },
})

export default defineEventHandler(async (event) => {
  const { subject } = event.context
  const code = programmeCodeOf(event)
  setResourceContext(event, 'programme', code, 'update', 'Change a programme')

  const details = checkedProgrammeDetails(await readBody(event))
  if ('problem' in details) throw fail(details.problem)

  return updateProgramme(
    { programmes },
    { subject, now: Instant.now(), code, details },
  )
})
