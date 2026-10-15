import { opaqueUid, type Brand } from '@/domain/brand'
import type { CompanyUid } from '@/domain/business/company'
import type { ISO8601String } from '@/domain/time/instant'
import type { HasDuration } from '@/domain/traits'
import type { HasLocation } from '@/domain/event/location'
import type { Registration } from '@/domain/event/registration'

/**
 * Identifies an event
 *
 * @remarks
 * Branded for the same reason as `JobUid`: an event carries a `companyUid` too, and the two must
 * not interchange where a rule decides who may edit the event.
 */
export type EventUid = Brand<string, 'EventUid'>

export const EventUid = opaqueUid<EventUid>('Event uid')

/**
 * A scheduled happening hosted by a company
 *
 * @remarks
 * Anchored as a start instant plus a length rather than a start and an end. The end is
 * derived with `endOf`, so the two can never drift apart, and an event cannot be stored
 * finishing before it begins.
 */
export interface Event {
  uid: EventUid
  /** uid of the hosting company, which is also what decides who may edit the event */
  companyUid: CompanyUid
  start: ISO8601String
}

/**
 * Capability of requiring sign-up
 *
 * @remarks
 * Named separately so a permission check can demand it without naming `Event`, and so the
 * absent case stops being representable where registration is the whole subject of a decision.
 */
export interface HasRegistration {
  registration: Registration
}

/**
 * An event that has a duration in addition to a start
 */
export type EventWithDuration = Event & HasDuration

/**
 * An event students must sign up for
 *
 * @remarks
 * The registration period is its own interval, unrelated to when the event runs: sign-up
 * usually opens weeks earlier and closes before the doors do.
 */
export type EventWithRegistration = Event & HasRegistration

export type EventWithLocation = Event & HasLocation

/**
 * A fully specified event, as the detail page needs it
 */
export type ScheduledEvent = Event & HasDuration & HasLocation & HasRegistration
