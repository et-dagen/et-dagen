// PUT /api/v1/job
// endpoint for editing jobs in the database

import { createError, defineEventHandler, readBody, sendNoContent } from 'h3'
import { defineRouteMeta } from 'nitropack/runtime'
import { isValidDate } from '@/server/utils/useTime'
import { cleanRichText, safeLink } from '@/server/security/richText'
import { fail } from '@/domain/errors'
import { authorize } from '@/domain/authorization/authorize'
import { hasPermission } from '@/domain/authorization/hasPermission'
import type { JobChanges } from '@/application/jobs/jobRepository'
import { CompanyUid } from '@/domain/business/company'
import { JOB_TYPES, JobUid } from '@/domain/business/job'
import { Instant } from '@/domain/time'
import { jobs } from '@/server/composition'
import { companyOf } from '@/server/utils/companyOf'
import {
  addEventContext,
  setErrorContext,
  setLogImportance,
  setResourceContext,
  withDbTiming,
} from '@/server/utils/wideEventHelpers'

defineRouteMeta({
  openAPI: {
    tags: ['Job'],
    summary: 'Edit job listing',
    description:
      'Admin, any coordinator, or the owning company user. Individual fields cannot be blanked ' +
      'out.',
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
    //         required: ['jobUID'],
    //         properties: { jobUID: { type: 'string' } },
    //         additionalProperties: true,
    //       },
    //     },
    //   },
    // },
    // responses: {
    //   204: { description: 'Updated' },
    //   400: { description: 'Error (job/missing-job-uid). or Error (job/invalid-date).' },
    //   401: { description: 'Error (job/cannot-remove-single-fields). or auth/signed-out' },
    //   403: { description: 'auth/forbidden' },
    //   404: { description: 'Error (job/not-found).' },
    // },
  },
})

/** The body fields that name a job field of the same name */
const EDITABLE = [
  'title',
  'description',
  'location',
  'listing',
  'applicationLink',
  'deadlineType',
  'deadline',
]

export default defineEventHandler(async (event) => {
  const { subject } = event.context

  const { jobUID, ...newData } = await readBody(event)

  // Set resource context for wide event logging
  setResourceContext(
    event,
    'job',
    jobUID as string | undefined,
    'update',
    'Edit existing job listing',
  )
  setLogImportance(event, 'warn')

  if (!jobUID) {
    setErrorContext(event, {
      code: 'job/missing-job-uid',
      message: 'Job UID is missing',
    })
    throw createError({
      statusCode: 400,
      statusMessage: 'Error (job/missing-job-uid).',
    })
  }

  // check if any of the newData values are null
  const valuesArr = Object.values(newData)
  if (valuesArr.includes(null)) {
    setErrorContext(event, {
      code: 'job/cannot-remove-single-fields',
      message: 'Cannot remove single fields from a job',
    })
    throw createError({
      statusCode: 401,
      statusMessage: 'Error (job/cannot-remove-single-fields).',
    })
  }

  const uid = JobUid.parse(String(jobUID))

  // check if the job exists
  const dbData = await withDbTiming(event, `jobs/${uid}`, 'read', () =>
    jobs.storedOne(uid),
  )

  // the job does not exist in db
  if (!dbData) {
    setErrorContext(event, {
      code: 'job/not-found',
      message: 'Job not found',
    })
    throw createError({
      statusCode: 404,
      statusMessage: 'Error (job/not-found).',
    })
  }

  const { companyUID } = dbData

  addEventContext(event, 'company_uid', companyUID)

  const newKeys = Object.keys(newData)
  // listing and deadlineType came later than the other fields, so older jobs may lack them
  const oldKeys = [...Object.keys(dbData), 'listing', 'deadlineType']

  // make sure all keys that are to be changed already exsists in the db
  if (!newKeys.every((key) => oldKeys.includes(key))) {
    setErrorContext(event, {
      code: 'job/cannot-remove-single-fields',
      message: 'Cannot add new fields that do not already exist',
    })
    throw createError({
      statusCode: 400,
      statusMessage: 'Error (job/cannot-remove-single-fields).',
    })
  }

  if ('jobType' in newData && !JOB_TYPES.includes(newData.jobType)) {
    throw fail('job/invalid-type')
  }

  if ('listing' in newData && !['text', 'link'].includes(newData.listing)) {
    throw fail('job/invalid-listing')
  }

  if (
    'deadlineType' in newData &&
    !['date', 'asap', 'rolling'].includes(newData.deadlineType)
  ) {
    throw fail('job/invalid-deadline-type')
  }
  // "Snarest" and "Løpende" keep no date
  if (newData.deadlineType && newData.deadlineType !== 'date') {
    newData.deadline = null
  }

  if (newData.deadline && !isValidDate(newData.deadline)) {
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
  authorize(subject, 'job', 'update', companyOf(companyUID), env)

  // a job moves only to a company whose jobs the caller also manages
  if (
    'companyUID' in newData &&
    !hasPermission(subject, 'job', 'update', companyOf(newData.companyUID), env)
  ) {
    delete newData.companyUID
  }

  if ('applicationLink' in newData) {
    if (newData.applicationLink && !safeLink(newData.applicationLink)) {
      throw fail('job/invalid-link')
    }
    newData.applicationLink = safeLink(newData.applicationLink) ?? ''
  }
  if ('description' in newData) {
    newData.description = cleanRichText(newData.description)
  }

  // fields the job type does not name, which old records may hold, are left as they are
  const { companyUID: movedTo, jobType, ...same } = newData
  const changes: JobChanges = {
    ...Object.fromEntries(
      Object.entries(same).filter(([key]) => EDITABLE.includes(key)),
    ),
    ...(movedTo !== undefined && { companyUid: CompanyUid.parse(movedTo) }),
    ...(jobType !== undefined && { type: jobType }),
  }
  await withDbTiming(event, `jobs/${uid}`, 'write', () =>
    jobs.update(uid, changes),
  )

  sendNoContent(event, 204)
})
