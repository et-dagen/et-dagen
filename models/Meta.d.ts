// extend route meta data types

import 'vue-router'
import type { Area } from '@/lib/auth/areas'

// To ensure it is treated as a module, add at least one `export` statement
export {}

declare module 'vue-router' {
  interface RouteMeta {
    /** The part of the site the page belongs to; see `lib/auth/areas.ts` */
    area?: Area
    protected?: boolean
  }
}
