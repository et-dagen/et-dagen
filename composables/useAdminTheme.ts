export type AdminTheme = 'system' | 'light' | 'dark'

const ORDER: readonly AdminTheme[] = ['system', 'light', 'dark']

/**
 * The admin panel's colour theme, kept in a cookie so the server renders the right one
 *
 * @remarks
 * `system` follows the device setting through CSS, so nothing has to run in the browser first.
 */
export function useAdminTheme() {
  const theme = useCookie<AdminTheme>('et-admin-theme', {
    default: () => 'system',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 365,
  })

  const next = () => {
    theme.value = ORDER[(ORDER.indexOf(theme.value) + 1) % ORDER.length]
  }

  return { theme, next }
}
