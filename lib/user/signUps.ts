import type { EventRow } from '@/lib/admin/events'

/** One entry of `GET /api/v1/user/events` */
export type SignUp =
  | { eventUID: string; start: string; status: 'attending'; attended?: boolean }
  | { eventUID: string; start: string; status: 'queued'; position: number }

/** A sign-up with the event's details, as Min side lists it */
export type SignUpRow = SignUp & { event: EventRow }

/**
 * Join the caller's sign-ups to the events they belong to
 *
 * @remarks
 * The sign-ups arrive soonest first and keep that order. One whose event is gone from the list
 * (deleted since) is dropped: there is nothing left to show or withdraw from.
 */
export function signUpRows(
  signUps: SignUp[] | null | undefined,
  events: Record<string, EventRow> | null | undefined,
): SignUpRow[] {
  return (signUps ?? []).flatMap((signUp) => {
    const event = events?.[signUp.eventUID]
    return event ? [{ ...signUp, event }] : []
  })
}

/** The event whose ticket Min side shows: the soonest one the caller has a place at */
export const ticketOf = (rows: SignUpRow[]): SignUpRow | null =>
  rows.find((row) => row.status === 'attending') ?? null

/** "Ingrid" from "Ingrid Testesen", for the greeting */
export const firstNameOf = (name: string | null | undefined): string =>
  (name ?? '').trim().split(/\s+/)[0] ?? ''
