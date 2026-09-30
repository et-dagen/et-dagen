/**
 * Composes docs-dist/next/index.html from the changelog template and the
 * oasdiff output. Used by .github/workflows/docs.yml.
 *
 * Usage: bun run scripts/render-next.ts <template> <changelog> <output>
 */
import { readFileSync, writeFileSync } from 'node:fs'

const [template, changelog, output] = process.argv.slice(2)

if (!template || !changelog || !output) {
  throw new Error('usage: render-next.ts <template> <changelog> <output>')
}

writeFileSync(
  output,
  readFileSync(template, 'utf8').replace(
    '{{CHANGELOG}}',
    readFileSync(changelog, 'utf8'),
  ),
)

console.log(`› ${output} written`)
