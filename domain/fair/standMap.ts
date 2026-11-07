/**
 * How stand maps are stored
 *
 * @remarks
 * An uploaded map (the types and size limit of `FILE_RULES.standmap`) is scaled down to fit
 * 3000 × 3000 and stored as WebP. The programme opens a map full screen and zooms it to twice the
 * window's width, so 3000 pixels keep stand numbers sharp when zoomed on a laptop, while a map no
 * longer costs a phone several megabytes. A smaller map keeps its size.
 */
export const STAND_MAP = {
  maxSide: 3000,
} as const
