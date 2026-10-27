import sharp from 'sharp'
import type { ImageProcessor } from '@/application/files/imageProcessor'

/** Pictures larger than this are refused before decoding, so an upload cannot exhaust memory */
const MAX_PIXELS = 50_000_000

/**
 * Image processing with sharp
 *
 * @remarks
 * `rotate()` applies the camera's orientation first; the output carries no metadata, so a phone
 * photo's location never reaches the bucket. `trim()` takes the top-left pixel as the margin's
 * colour, so it cuts both a white and a transparent margin.
 */
export const sharpImageProcessor = (): ImageProcessor => ({
  fit: async (bytes, { width, height }) => {
    try {
      const output = await sharp(bytes, { limitInputPixels: MAX_PIXELS })
        .rotate()
        .resize(width, height, { fit: 'cover', position: 'centre' })
        .webp({ quality: 82 })
        .toBuffer()
      return { bytes: new Uint8Array(output), contentType: 'image/webp' }
    } catch {
      return null
    }
  },
  trim: async (bytes, { maxSide }) => {
    try {
      const output = await sharp(bytes, { limitInputPixels: MAX_PIXELS })
        .rotate()
        .trim()
        .resize(maxSide, maxSide, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 90, alphaQuality: 100 })
        .toBuffer()
      return { bytes: new Uint8Array(output), contentType: 'image/webp' }
    } catch {
      return null
    }
  },
})
