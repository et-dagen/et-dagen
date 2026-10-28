import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

// Tailwind classes carry the tw: prefix, from when Vuetify's utility classes shared their names
const twMerge = extendTailwindMerge({ prefix: 'tw' })

/** Join class names, letting later Tailwind classes override earlier ones */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
