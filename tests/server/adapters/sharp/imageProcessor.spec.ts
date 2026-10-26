import sharp from 'sharp'
import { describe, expect, it } from 'vitest'
import { sharpImageProcessor } from '@/server/adapters/sharp/imageProcessor'

const photo = async () =>
  new Uint8Array(
    await sharp({
      create: { width: 1800, height: 1013, channels: 3, background: '#a03836' },
    })
      .jpeg()
      .withExifMerge({ IFD0: { Copyright: 'someone' } })
      .toBuffer(),
  )

describe('sharpImageProcessor', () => {
  it('crops and scales to the size as WebP without metadata', async () => {
    const fitted = await sharpImageProcessor().fit(await photo(), {
      width: 800,
      height: 960,
    })

    expect(fitted?.contentType).toBe('image/webp')
    const meta = await sharp(fitted!.bytes).metadata()
    expect(meta).toMatchObject({ format: 'webp', width: 800, height: 960 })
    expect(meta.exif).toBeUndefined()
  })

  it('gives null for bytes that are not a picture', async () => {
    expect(
      await sharpImageProcessor().fit(new TextEncoder().encode('%PDF-1.7'), {
        width: 800,
        height: 960,
      }),
    ).toBeNull()
  })
})
