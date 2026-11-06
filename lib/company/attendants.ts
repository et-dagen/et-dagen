/**
 * The users signed up for an event
 *
 * @param attendants The event's `attendants` node, keyed by user uid
 */
export const attendantsOf = <T extends { uid: string }>(
  attendants: Record<string, unknown> | null | undefined,
  users: readonly T[] | null | undefined,
): T[] =>
  (users ?? []).filter((user) => Object.hasOwn(attendants ?? {}, user.uid))
