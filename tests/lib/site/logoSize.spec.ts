import { describe, expect, it } from 'vitest'
import { logoSize } from '@/lib/site/logoSize'

describe('logoSize', () => {
  const box = { width: 300, height: 200 }

  it('gives a wide and a square logo the same area', () => {
    const wide = logoSize({ width: 400, height: 100 }, box, 0.2)!
    const square = logoSize({ width: 50, height: 50 }, box, 0.2)!
    expect(wide.width * wide.height).toBeCloseTo(12000)
    expect(square.width * square.height).toBeCloseTo(12000)
    expect(wide.width / wide.height).toBeCloseTo(4)
  })

  it('draws the same logo bigger in a bigger box', () => {
    const logo = { width: 200, height: 100 }
    const big = logoSize(logo, { width: 600, height: 400 }, 0.2)!
    expect(big.width).toBeCloseTo(logoSize(logo, box, 0.2)!.width * 2)
  })

  it('keeps a very wide logo inside the box', () => {
    const size = logoSize({ width: 2000, height: 100 }, box, 0.3)!
    expect(size.width).toBeCloseTo(300)
    expect(size.height).toBeCloseTo(15)
  })

  it('waits until both sizes are known', () => {
    expect(logoSize({ width: 0, height: 0 }, box, 0.2)).toBeNull()
    expect(
      logoSize({ width: 10, height: 10 }, { width: 0, height: 0 }, 0.2),
    ).toBeNull()
  })
})
