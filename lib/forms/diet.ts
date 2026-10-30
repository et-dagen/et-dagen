/** The restrictions typed by hand, as the one comma-separated field the forms show */
export const typedOf = (diet: string[], known: string[]): string =>
  diet.filter((restriction) => !known.includes(restriction)).join(', ')

/** The stored list: the chosen known restrictions, then the typed ones */
export const dietOf = (chosen: string[], typed: string): string[] => [
  ...chosen,
  ...typed
    .split(',')
    .map((restriction) => restriction.trim())
    .filter(Boolean),
]
