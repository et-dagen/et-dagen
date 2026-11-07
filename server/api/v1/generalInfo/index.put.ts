// PUT /api/v1/generalInfo
// endpoint for setting the fair's dates
import { defineEventHandler, readBody } from 'h3'
import { defineRouteMeta } from 'nitropack/runtime'
import { setFairDates } from '@/application/fair/dates'
import { fail } from '@/domain/errors'
import { checkedFairDates } from '@/domain/fair/dates'
import { Instant } from '@/domain/time'
import { fair } from '@/server/composition'
import { setResourceContext } from '@/server/utils/wideEventHelpers'

defineRouteMeta({
  openAPI: {
    tags: ['Reference'],
    summary: "Set the fair's dates",
    description:
      'Admin only. Body: `{ start, end }` as Oslo wall-clock times, `YYYY-MM-DDTHH:mm`. Returns ' +
      'the dates as stored, with seconds.',
    security: [{ bearerAuth: [] }, { cookieAuth: [] }],
  },
})

export default defineEventHandler(async (event) => {
  const { subject } = event.context
  setResourceContext(
    event,
    'generalInfo',
    undefined,
    'update',
    'Set the fair dates',
  )

  const dates = checkedFairDates(await readBody(event))
  if ('problem' in dates) throw fail(dates.problem)

  return setFairDates({ fair }, { subject, now: Instant.now(), dates })
})
