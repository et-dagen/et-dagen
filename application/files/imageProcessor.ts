/**
 * Turns an uploaded picture into the exact size a page shows it at
 *
 * @remarks
 * A port so the use cases stay free of the image library, and tests can stand in for it.
 */
export interface ImageProcessor {
  /**
   * Crop to the size's proportions around the centre, scale to it, and encode as WebP
   *
   * @returns null when the bytes are not a picture the processor can read
   */
  fit(
    bytes: Uint8Array,
    size: { width: number; height: number },
  ): Promise<{ bytes: Uint8Array; contentType: 'image/webp' } | null>
}
