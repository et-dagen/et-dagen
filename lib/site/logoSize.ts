export interface Size {
  width: number
  height: number
}

/**
 * The size a logo is drawn at so every logo carries the same visual weight
 *
 * @remarks
 * Fitting logos to the same box makes a wide wordmark look tiny next to a square emblem. Giving
 * each the same share of its box's area evens them out; the logo still never leaves the box. A
 * bigger box (the main partner's) therefore gets a bigger logo.
 *
 * @param area - the share of the box's area the logo covers, between 0 and 1
 * @returns null until both sizes are known
 */
export function logoSize(logo: Size, box: Size, area: number): Size | null {
  if (!logo.width || !logo.height || !box.width || !box.height) return null
  const aspect = logo.width / logo.height
  const width = Math.sqrt(area * box.width * box.height * aspect)
  const height = width / aspect
  const scale = Math.min(1, box.width / width, box.height / height)
  return { width: width * scale, height: height * scale }
}
