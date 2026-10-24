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

/** How many attendants have each dietary restriction, so catering never needs names */
export const dietaryCounts = (
  attendants: readonly { dietaryRestrictions?: readonly string[] | null }[],
): Record<string, number> => {
  const counts: Record<string, number> = {}
  for (const restriction of attendants.flatMap(
    (attendant) => attendant.dietaryRestrictions ?? [],
  )) {
    counts[restriction] = (counts[restriction] ?? 0) + 1
  }
  return counts
}
