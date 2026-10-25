/** The pages an account reaches from the header, by role */
export function accountLinks(userType: string | null | undefined) {
  return [
    { label: 'site.account.profile', route: '/user' },
    ...(userType === 'company'
      ? [{ label: 'site.account.company', route: '/company/admin' }]
      : []),
    ...(userType === 'admin'
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
