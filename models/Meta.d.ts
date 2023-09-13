// extend route meta data types

import 'vue-router'

// To ensure it is treated as a module, add at least one `export` statement
export {}

declare module 'vue-router' {
  interface RouteMeta {
    accessLevels?: ('admin' | 'company')[]
    protected?: boolean
  }
}
