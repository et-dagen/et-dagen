import { describe, expect, it } from 'vitest'
import { cleanRichText, safeLink } from '@/server/security/richText'

describe('cleanRichText', () => {
  it('keeps what the editor writes', () => {
    const html =
      '<h2>Hva du gjør</h2><p>Skriv <strong>firmware</strong> i <em>C</em>.</p><ul><li>Én</li></ul>'
    expect(cleanRichText(html)).toBe(html)
  })

  it('drops script, event handlers and other tags', () => {
    expect(
      cleanRichText('<p onclick="steal()">Hei</p><script>steal()</script>'),
    ).toBe('<p>Hei</p>')
    expect(
      cleanRichText(
        '<img src=x onerror="steal()"><iframe src="https://example.com"></iframe>',
      ),
    ).toBe('')
    expect(cleanRichText('<p style="position:fixed">Hei</p>')).toBe(
      '<p>Hei</p>',
    )
  })

  it('keeps web links, opened apart from the page, and drops script links', () => {
    expect(cleanRichText('<a href="https://example.com">Søk</a>')).toBe(
      '<a href="https://example.com" rel="noopener noreferrer nofollow" target="_blank">Søk</a>',
    )
    expect(cleanRichText('<a href="javascript:steal()">Søk</a>')).toBe(
      '<a rel="noopener noreferrer nofollow" target="_blank">Søk</a>',
    )
  })

  it('turns anything but a string into an empty description', () => {
    expect(cleanRichText(undefined)).toBe('')
    expect(cleanRichText({ html: '<p>Hei</p>' })).toBe('')
  })
})

describe('safeLink', () => {
  it('accepts http and https', () => {
    expect(safeLink(' https://example.com/apply ')).toBe(
      'https://example.com/apply',
    )
    expect(safeLink('http://example.com')).toBe('http://example.com')
  })

  it('refuses every other kind of link', () => {
    for (const link of [
      'javascript:steal()',
      'JaVaScRiPt:steal()',
      'data:text/html,hi',
      '//example.com',
      'example.com',
      '',
      42,
    ]) {
      expect(safeLink(link)).toBeNull()
    }
  })
})

describe('cleanRichText links', () => {
  it('replaces a stored rel or target', () => {
    expect(
      cleanRichText(
        '<a href="https://example.com" target="_self" rel="opener">Søk</a>',
      ),
    ).toBe(
      '<a href="https://example.com" target="_blank" rel="noopener noreferrer nofollow">Søk</a>',
    )
  })
})
