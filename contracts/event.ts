import { z } from 'zod'

const required = z
  .string({ required_error: 'required' })
  .trim()
  .min(1, 'required')

const WALL_CLOCK = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/

/** Oslo wall-clock time as `<input type="datetime-local">` gives it, which is how v1 stores times */
const wallClock = z
  .string({ required_error: 'required' })
  .regex(WALL_CLOCK, 'datetime')

/** Whether two well-formed times come in the wrong order; malformed times are reported on their own */
const outOfOrder = (earlier: string, later: string) =>
  WALL_CLOCK.test(earlier) && WALL_CLOCK.test(later) && later <= earlier

/** Rich text counts as empty when it holds no visible characters */
const hasText = (html: string) => html.replace(/<[^>]*>/g, '').trim().length > 0

const common = {
  title: required.max(120, 'too_long'),
  /** A company uid, or `etdagene` for the fair's own events */
  companyUID: required,
  description: z
    .string({ required_error: 'required' })
    .refine(hasText, 'required'),
  location: z.object({
    name: required.max(120, 'too_long'),
    map: z
      .string()
      .trim()
      .refine((url) => url === '' || /^https?:\/\/\S+$/.test(url), 'url'),
  }),
  start: wallClock,
  end: wallClock,
}

/**
 * An event as the admin form sends it
 *
 * @remarks
 * One variant without sign-up and one with, so every field's error shows at once. Times are
 * compared as `YYYY-MM-DDTHH:mm` strings, which sort in time order within one zone.
 */
export const EventInput = z
  .discriminatedUnion('signup', [
    z.object({ ...common, signup: z.literal(false) }),
    z.object({
      ...common,
      signup: z.literal(true),
      capacity: z.coerce
        .number({ invalid_type_error: 'number' })
        .int('number')
        .min(1, 'number'),
      opens: wallClock,
      closes: wallClock,
      programmes: z.array(z.string()).default([]),
      years: z.array(z.number().int().min(1).max(5)).default([]),
    }),
  ])
  .superRefine((event, ctx) => {
    if (outOfOrder(event.start, event.end)) {
      ctx.addIssue({
        code: 'custom',
        path: ['end'],
        message: 'end_before_start',
      })
    }
    if (!event.signup) return
    if (outOfOrder(event.opens, event.closes)) {
      ctx.addIssue({
        code: 'custom',
        path: ['closes'],
        message: 'end_before_start',
      })
    }
    // sign-up may close at the start, as v1 allows, but not after it
    if (event.closes !== event.start && outOfOrder(event.closes, event.start)) {
      ctx.addIssue({
        code: 'custom',
        path: ['closes'],
        message: 'signup_after_start',
      })
    }
  })

export type EventInput = z.infer<typeof EventInput>

/** The body v1's `POST` and `PUT /api/v1/event` expect */
export const toV1Event = (event: EventInput) => ({
  title: event.title,
  companyUID: event.companyUID,
  description: event.description,
  location: { name: event.location.name, map: event.location.map || null },
  date: { start: event.start, end: event.end },
  capacity: event.signup ? event.capacity : null,
  registration: event.signup
    ? {
        start: event.opens,
        end: event.closes,
        requirements:
          event.programmes.length || event.years.length
            ? {
                programmes: event.programmes.length ? event.programmes : null,
                years: event.years.length ? event.years : null,
              }
            : null,
      }
    : { start: null, end: null, requirements: null },
})
