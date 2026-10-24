import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

// Tailwind classes carry the tw: prefix so they never collide with Vuetify's utility classes
const twMerge = extendTailwindMerge({ prefix: 'tw' })

/** Join class names, letting later Tailwind classes override earlier ones */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
