// POST /api/v1/programme
// endpoint for adding a study programme
import { defineEventHandler, readBody, setResponseStatus } from 'h3'
import { defineRouteMeta } from 'nitropack/runtime'
import { addProgramme } from '@/application/fair/programmes'
import { fail } from '@/domain/errors'
import { checkedNewProgramme } from '@/domain/fair/programme'
import { Instant } from '@/domain/time'
import { programmes } from '@/server/composition'
import {
  addEventContext,
  setResourceContext,
} from '@/server/utils/wideEventHelpers'

defineRouteMeta({
  openAPI: {
    tags: ['Reference'],
    summary: 'Add a study programme',
    description:
      'Admin only. Body: `{ code, name, degree: "bachelor" | "master" | "integrated", open? }`. ' +
      'The code is unique and read in capitals; names may repeat. A closed programme ' +
      '(`open: false`) is not offered at sign-up.',
    security: [{ bearerAuth: [] }, { cookieAuth: [] }],
  },
})

export default defineEventHandler(async (event) => {
  const { subject } = event.context
  setResourceContext(event, 'programme', undefined, 'create', 'Add a programme')

  const input = checkedNewProgramme(await readBody(event))
  if ('problem' in input) throw fail(input.problem)

  const programme = await addProgramme(
    { programmes },
    { subject, now: Instant.now(), programme: input },
  )
  addEventContext(event, 'programme', programme.code)
  setResponseStatus(event, 201)
  return programme
})
