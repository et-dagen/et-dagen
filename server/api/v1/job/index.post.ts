//  POST /api/v1/job
// endpoint for creating a new job in the database

import { isValidDate } from '@/server/utils/useTime'
import { cleanRichText, safeLink } from '@/server/security/richText'
import { fail } from '@/domain/errors'
import { authorize } from '@/domain/authorization/authorize'
import { Instant } from '@/domain/time'

defineRouteMeta({
  openAPI: {
    tags: ['Job'],
    summary: 'Create new job listing',
    description:
      'Admin, any coordinator, or a company user creating a listing for their own company.',
    security: [{ bearerAuth: [] }, { cookieAuth: [] }],
    // TODO(api-docs): fill in the request/response schemas below.
    // Shapes are sketched from current handler behaviour - verify each
    // against the handler before uncommenting.
    // requestBody: {
    //   required: true,
    //   content: {
    //     'application/json': {
    //       schema: {
    //         type: 'object',
    //         required: ['companyUID', 'title', 'description', 'jobType', 'location', 'deadline'],
    //         properties: {
    //           companyUID: { type: 'string' },
    //           title: { type: 'string' },
    //           description: { type: 'string' },
    //           location: { type: 'string' },
    //           deadline: { type: 'string', format: 'date-time' },
    //           jobType: {
    //             type: 'string',
    //             enum: ['full-time', 'graduate', 'summer-internship'],
    //           },
    //         },
    //       },
    //     },
    //   },
    // },
    // responses: {
    //   201: { description: 'Created, empty body' },
    //   400: { description: 'Error (general/missing-data). or Error (job/invalid-date).' },
    //   401: { description: 'auth/signed-out' },
    //   403: { description: 'auth/forbidden' },
    //   404: { description: 'Error (company/not-found).' },
    // },
  },
})

export default defineEventHandler(async (event) => {
  const { subject } = event.context

  const {
    companyUID,
    title,
    description,
    deadline,
    jobType,
    location,
    applicationLink,
    listing = 'text',
    deadlineType = 'date',
  } = await readBody(event)
  // "Snarest" and "Løpende" have no date to check
  const onDate = deadlineType === 'date'

  // Set resource context for wide event logging
  setResourceContext(
    event,
    'job',
    undefined,
    'create',
    'Create new job listing',
  )
  addEventContext(event, 'company_uid', companyUID)
  addEventContext(event, 'job_type', jobType)

  // make sure all necessary data is included
  if (
    !companyUID ||
    !title ||
    (onDate && !deadline) ||
    !jobType ||
    !location ||
    typeof applicationLink !== 'string' ||
    // a listing on the site needs its description; a link needs the link
    (listing === 'text' ? !description : !applicationLink)
  ) {
    setErrorContext(event, {
      code: 'general/missing-data',
      message: 'Required job data is missing',
    })
    throw createError({
      statusCode: 400,
      statusMessage: 'Error (general/missing-data).',
    })
  }

  if (!['text', 'link'].includes(listing)) throw fail('job/invalid-listing')
  if (applicationLink && !safeLink(applicationLink))
    throw fail('job/invalid-link')
  if (!['date', 'asap', 'rolling'].includes(deadlineType)) {
    throw fail('job/invalid-deadline-type')
  }

  if (onDate && !isValidDate(deadline)) {
    setErrorContext(event, {
      code: 'job/invalid-date',
      message: 'Invalid deadline date format',
    })
    throw createError({
      statusCode: 400,
      statusMessage: 'Error (job/invalid-date).',
    })
  }

  const env = { now: Instant.now() }
  authorize(subject, 'job', 'create', companyOf(companyUID), env)

  // reference to companies
  const companiesRef = db.ref('companies')

  // check if the company exists
  const snapshot = await withDbTiming(
    event,
    `companies/${companyUID}`,
    'read',
    () => companiesRef.orderByKey().equalTo(companyUID).once('value'),
  )

  const data = snapshot.val()

  // the company does not exist in db
  if (!data) {
    setErrorContext(event, {
      code: 'company/not-found',
      message: 'Company not found',
    })
    throw createError({
      statusCode: 404,
      statusMessage: 'Error (company/not-found).',
    })
  }

  const jobsRef = db.ref('jobs')

  let newJobKey: string | null = null
  await withDbTiming(event, 'jobs', 'write', () => {
    const ref = jobsRef.push({
      companyUID,
      title,
      description: cleanRichText(description),
      deadline: onDate ? deadline : null,
      deadlineType,
      jobType,
      location,
      applicationLink: safeLink(applicationLink) ?? '',
      listing,
    })
    newJobKey = ref.key
    // Adopt the push promise so the write is actually awaited/timed and a
    // write failure is caught instead of returning 201 prematurely.
    return Promise.resolve(ref)
  })

  addEventContext(event, 'created_job_id', newJobKey)

  sendNoContent(event, 201)
})
