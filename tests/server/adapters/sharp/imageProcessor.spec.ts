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

  it('cuts a transparent margin from a logo and keeps its transparency', async () => {
    const mark = await sharp({
      create: {
        width: 200,
        height: 100,
        channels: 4,
        background: { r: 160, g: 56, b: 54, alpha: 0.5 },
      },
    })
      .png()
      .toBuffer()
    const padded = await sharp({
      create: {
        width: 1000,
        height: 600,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    })
      .composite([{ input: mark, left: 400, top: 250 }])
      .png()
      .toBuffer()

    const trimmed = await sharpImageProcessor().trim(new Uint8Array(padded), {
      maxSide: 1200,
    })

    const meta = await sharp(trimmed!.bytes).metadata()
    expect(meta).toMatchObject({ format: 'webp', width: 200, height: 100 })
    expect(meta.hasAlpha).toBe(true)
  })

  it('cuts a white margin and scales a large logo down', async () => {
    const mark = await sharp({
      create: { width: 3000, height: 1000, channels: 3, background: '#2f3a45' },
    })
      .png()
      .toBuffer()
    const padded = await sharp({
      create: { width: 4000, height: 2000, channels: 3, background: '#ffffff' },
    })
      .composite([{ input: mark, left: 500, top: 500 }])
      .jpeg()
      .toBuffer()

    const trimmed = await sharpImageProcessor().trim(new Uint8Array(padded), {
      maxSide: 1200,
    })

    const meta = await sharp(trimmed!.bytes).metadata()
    expect(meta.width).toBe(1200)
    expect(meta.height).toBe(400)
  })
})
