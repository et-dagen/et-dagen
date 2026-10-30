import { eventStatus, type EventRow } from '@/lib/admin/events'
import { formatWhen, instantOf } from '@/lib/admin/time'
import { deadlineState, type DeadlineState } from '@/lib/jobs'
import { Instant, type ISO8601String } from '@/domain/time'

/** What the event page reads from `events/<uid>`; every field may be missing */
export interface PublicEvent extends EventRow {
  description?: string
  registration?:
    | (EventRow['registration'] & {
        requirements?: {
          programmes?: string[] | null
          years?: number[] | null
        } | null
      })
    | null
}

/** The parts of the signed-in user the page needs */
export interface Visitor {
  uid: string
  studyProgram?: string | null
  currentYear?: string | number | null
}

export type SignupState =
  /** The event takes no sign-up: everyone may come */
  | { kind: 'none' }
  | { kind: 'past' }
  | { kind: 'not-open'; opensAt: ISO8601String | null }
  | { kind: 'closed' }
  | { kind: 'registered' }
  /** `position` counts from 1 */
  | { kind: 'queued'; position: number }
  | { kind: 'sign-in' }
  | { kind: 'not-eligible' }
  | { kind: 'open' }
  /** No places left; signing up joins the queue */
  | { kind: 'full' }

/** The order v1 moves people up in: the smallest queue key first */
const queueOrder = (event: PublicEvent) =>
  Object.entries(event.queue ?? {})
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, uid]) => uid)

/** Whether a visitor meets an event's programme and year requirements */
export function meetsRequirements(
  event: PublicEvent,
  visitor: Visitor,
): boolean {
  const requirements = event.registration?.requirements
  const programmes = requirements?.programmes ?? []
  const years = requirements?.years ?? []
  const programmeOk =
    programmes.length === 0 || programmes.includes(visitor.studyProgram ?? '')
  const yearOk =
    years.length === 0 || years.includes(Number(visitor.currentYear))
  return programmeOk && yearOk
}

/**
 * Where sign-up stands for this visitor, which decides the action the page offers
 *
 * @remarks
 * Having a place or a spot in the queue wins over the window, so someone can always see that they
 * are signed up, even after sign-up closes.
 */
export function signupStateOf(
  event: PublicEvent,
  visitor: Visitor | null,
  now: ISO8601String,
): SignupState {
  const status = eventStatus(event, now)
  if (status.kind === 'past') return { kind: 'past' }
  if (status.kind === 'no-registration') return { kind: 'none' }

  if (visitor) {
    if (Object.hasOwn(event.attendants ?? {}, visitor.uid)) {
      return { kind: 'registered' }
    }
    const position = queueOrder(event).indexOf(visitor.uid)
    if (position >= 0) return { kind: 'queued', position: position + 1 }
  }

  if (status.kind === 'not-open') {
    return { kind: 'not-open', opensAt: instantOf(event.registration?.start) }
  }
  if (status.kind === 'closed') return { kind: 'closed' }
  if (!visitor) return { kind: 'sign-in' }
  if (!meetsRequirements(event, visitor)) return { kind: 'not-eligible' }
  return status.kind === 'full' ? { kind: 'full' } : { kind: 'open' }
}

/** Places taken and waiting, the only attendance a visitor sees */
export const placesOf = (event: PublicEvent) => ({
  taken: Object.keys(event.attendants ?? {}).length,
  limit: event.capacity ?? null,
  waiting: Object.keys(event.queue ?? {}).length,
})

/** Whether the event happens on the same Oslo calendar day as now */
export function isEventDay(event: PublicEvent, now: ISO8601String): boolean {
  const start = instantOf(event.date?.start)
  if (!start) return false
  const day = (at: ISO8601String) =>
    new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Oslo' }).format(
      Instant.toDate(at),
    )
  return day(start) === day(now)
}

/**
 * MazeMap's embeddable view of a MazeMap link, or null for any other map link
 *
 * @remarks
 * Only full `use.mazemap.com` links carry the place in their hash; short links redirect, and
 * Google and Apple maps need keys or offer no embed, so those stay plain links.
 */
export function mapEmbedOf(link: string | null | undefined): string | null {
  if (!link) return null
  let url: URL
  try {
    url = new URL(link)
  } catch {
    return null
  }
  if (url.protocol !== 'https:' || url.host !== 'use.mazemap.com') return null
  if (!url.hash || (url.pathname !== '/' && url.pathname !== '')) return null
  return `https://use.mazemap.com/embed.html${url.hash}`
}

const icsDate = (at: ISO8601String) =>
  at.replace(/[-:]/g, '').replace(/\.\d{3}/, '')

const icsText = (text: string) =>
  text
    .replace(/\\/g, '\\\\')
    .replace(/[,;]/g, (c) => `\\${c}`)
    .replace(/\r?\n/g, '\\n')

/**
 * The event as a calendar file (iCalendar), for "add to calendar"
 *
 * @returns null when the event has no readable start
 */
export function calendarFileOf(
  uid: string,
  event: PublicEvent,
  pageUrl: string,
  now: ISO8601String,
): string | null {
  const start = instantOf(event.date?.start)
  if (!start) return null
  const end = instantOf(event.date?.end) ?? start
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//E&T-dagene//Arrangementer//NO',
    'BEGIN:VEVENT',
    `UID:${uid}@etdagen.no`,
    `DTSTAMP:${icsDate(now)}`,
    `DTSTART:${icsDate(start)}`,
    `DTEND:${icsDate(end)}`,
    `SUMMARY:${icsText(event.title ?? '')}`,
    ...(event.location?.name
      ? [`LOCATION:${icsText(event.location.name)}`]
      : []),
    `URL:${pageUrl}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ]
  return `${lines.join('\r\n')}\r\n`
}

export type Urgency =
  | { kind: 'closing'; hours: number }
  | { kind: 'few'; left: number }

/** Sign-up closing within this many hours counts as soon */
const CLOSING_HOURS = 48

/**
 * Whether sign-up needs acting on soon: it closes within two days, or few places are left
 *
 * @remarks
 * Few means three or a tenth of the places, whichever is more. Only an open sign-up has an
 * urgency; a full event offers the queue instead.
 */
export function urgencyOf(
  event: PublicEvent,
  now: ISO8601String,
): Urgency | null {
  if (eventStatus(event, now).kind !== 'open') return null
  const closes = instantOf(event.registration?.end)
  if (closes) {
    const hours = Math.ceil((Date.parse(closes) - Date.parse(now)) / 3_600_000)
    if (hours <= CLOSING_HOURS) return { kind: 'closing', hours }
  }
  const { taken, limit } = placesOf(event)
  if (limit) {
    const left = limit - taken
    if (left <= Math.max(3, Math.ceil(limit / 10))) return { kind: 'few', left }
  }
  return null
}

const HOURS: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' }

/** When the event runs, such as "ons. 4. nov. 2026, 17:15–18:00" */
export function whenOf(event: PublicEvent, locale: string): string {
  const start = formatWhen(event.date?.start, locale)
  const end = formatWhen(event.date?.end, locale, HOURS)
  return end ? `${start}–${end}` : start
}

/** When the event runs, short enough for one line on the ticket: day and hours only */
export function ticketWhenOf(event: PublicEvent, locale: string): string {
  const start = formatWhen(event.date?.start, locale, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    ...HOURS,
  })
  const end = formatWhen(event.date?.end, locale, HOURS)
  return end ? `${start}–${end}` : start
}

/** A job as the event page reads it from `jobs/<uid>` */
export interface StoredJob {
  title?: string
  companyUID?: string
  deadline?: string | null
}

export interface OpenJob {
  uid: string
  title: string
  deadline?: string | null
  state: DeadlineState
}

/** The hosting company's jobs that still take applications */
export const openJobsOf = (
  jobs: Record<string, StoredJob> | null | undefined,
  companyUid: string | undefined,
  now: ISO8601String,
): OpenJob[] =>
  Object.entries(jobs ?? {})
    .filter(([, job]) => companyUid && job.companyUID === companyUid)
    .map(([uid, job]) => ({
      uid,
      title: job.title ?? '',
      deadline: job.deadline,
      state: deadlineState(job.deadline ?? undefined, now),
    }))
    .filter((job) => job.state.kind !== 'passed')
