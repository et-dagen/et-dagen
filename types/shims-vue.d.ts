// Lets plain `tsc` (bun run typecheck) resolve .vue imports in .ts files, such as
// components/ui/*/index.ts. vue-tsc reads the real component types instead.
declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent
  export default component
}
