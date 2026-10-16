import { readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'

// Images in public/ are served as they are and ship in every production image.
// Resize before committing: about twice the largest size the page shows.
const IMAGES = join(import.meta.dirname, '../../public/images')
const MAX_KB = 500

const filesUnder = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? filesUnder(path) : [path]
  })

describe('public images', () => {
  it(`are each at most ${MAX_KB} KB`, () => {
    const tooLarge = filesUnder(IMAGES)
      .map((path) => ({
        file: relative(IMAGES, path),
        kb: Math.round(statSync(path).size / 1024),
      }))
      .filter(({ kb }) => kb > MAX_KB)

    expect(
      tooLarge,
      'resize these, for example with `sips --resampleWidth`',
    ).toEqual([])
  })
})
