// GET /api/v1/activity
// endpoint for the admin dashboard
import { activityOverview } from '@/application/activity/overview'
import { Instant } from '@/domain/time'
import { activity } from '@/server/composition'

defineRouteMeta({
  openAPI: {
    tags: ['Activity'],
    summary: 'Read the activity journal and daily tallies',
    description:
      'Admin only. Query: `days` (1–30, default 14), counted back from today in Oslo. Returns ' +
      '`{ from, tallies: [{ day, counts }], entries }`: the counts per Oslo day (sign-ups, ' +
      'sign-ins, registrations, cancellations, attendance, résumé downloads, page views, ' +
      'refusals, errors) and the newest 500 notable requests (refusals, server errors, access ' +
      'and contract changes, deletions), each with time, method, path, status, error code, ' +
      'actor uid and target.',
    security: [{ bearerAuth: [] }, { cookieAuth: [] }],
  },
})

export default defineEventHandler((event) => {
  setResourceContext(
    event,
    'activity',
    undefined,
    'read',
    'Read the activity log',
  )
  // the journal holds who did what, so its reads are kept like other reads of personal data
  setLogImportance(event, 'warn')
  return activityOverview(activity, {
    subject: event.context.subject ?? null,
    now: Instant.now(),
    days: Number(getQuery(event).days ?? 14),
  })
})
