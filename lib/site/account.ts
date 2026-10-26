import type { Area } from '@/lib/auth/areas'

/** The pages an account reaches from the header, by the areas it may enter */
export function accountLinks(allows: (area: Area) => boolean) {
  return [
    { label: 'site.account.profile', route: '/user' },
    ...(allows('company') && !allows('admin')
      ? [{ label: 'site.account.company', route: '/company/admin' }]
      : []),
    ...(allows('admin')
      ? [{ label: 'site.account.admin', route: '/admin' }]
      : []),
  ]
}

/** Up to two initials from a name, for the account disc */
export const initialsOf = (name: string | null | undefined) =>
  (name ?? '')
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0]!.toUpperCase())
    .filter((_, index, all) => index === 0 || index === all.length - 1)
    .join('')
