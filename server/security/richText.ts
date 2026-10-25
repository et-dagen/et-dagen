import sanitizeHtml from 'sanitize-html'
import { HttpUrl } from '@/domain/url'

/** What the rich-text editor writes (TipTap's StarterKit), and nothing else */
const RICH_TEXT: sanitizeHtml.IOptions = {
  allowedTags: [
    'p',
    'br',
    'h1',
    'h2',
    'h3',
    'h4',
    'strong',
    'b',
    'em',
    'i',
    'u',
    's',
    'code',
    'pre',
    'blockquote',
    'ul',
    'ol',
    'li',
    'hr',
    'a',
  ],
  // rel and target are always the ones set below; a stored value never survives
  allowedAttributes: { a: ['href', 'rel', 'target'] },
  allowedSchemes: ['http', 'https', 'mailto'],
  allowProtocolRelative: false,
  disallowedTagsMode: 'discard',
  transformTags: {
    // a link in a description opens apart from the page and passes nothing back to it
    a: (tagName, attribs) => ({
      tagName,
      attribs: {
        ...attribs,
        rel: 'noopener noreferrer nofollow',
        target: '_blank',
      },
    }),
  },
}

/**
 * Description HTML as it may be shown with `v-html`
 *
 * @remarks
 * Applied when a description is stored and again when it is read, so a record written before
 * this existed, or straight into the database, cannot run script on a public page either.
 */
export function cleanRichText(html: unknown): string {
  return typeof html === 'string' ? sanitizeHtml(html, RICH_TEXT) : ''
}

/** A link that may go in an `href`: `http(s)` only; anything else is null */
export function safeLink(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed && HttpUrl.tryParse(trimmed) ? trimmed : null
}

type Record_ = Record<string, unknown>

/** Apply `clean` to every record in a uid-keyed map, as the v1 GET endpoints return them */
function eachRecord<T>(data: T, clean: (record: Record_) => Record_): T {
  if (!data || typeof data !== 'object') return data
  return Object.fromEntries(
    Object.entries(data).map(([uid, record]) => [
      uid,
      record && typeof record === 'object' ? clean(record as Record_) : record,
    ]),
  ) as T
}

/** Jobs as a page may show them: clean descriptions, web links only */
export const readableJobs = <T>(jobs: T): T =>
  eachRecord(jobs, (job) => ({
    ...job,
    ...('description' in job && {
      description: cleanRichText(job.description),
    }),
    ...('applicationLink' in job && {
      applicationLink: safeLink(job.applicationLink) ?? '',
    }),
  }))

/** Events as a page may show them: clean descriptions, web map links only */
export const readableEvents = <T>(events: T): T =>
  eachRecord(events, (event) => {
    const location = event.location as Record_ | null | undefined
    return {
      ...event,
      ...('description' in event && {
        description: cleanRichText(event.description),
      }),
      ...(location &&
        typeof location === 'object' &&
        'map' in location && {
          location: { ...location, map: safeLink(location.map) },
        }),
    }
  })

/** Companies as a page may show them: web links only */
export const readableCompanies = <T>(companies: T): T =>
  eachRecord(companies, (company) => ({
    ...company,
    ...('webpage' in company && { webpage: safeLink(company.webpage) ?? '' }),
  }))
