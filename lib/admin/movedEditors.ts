/** What the old Vuetify editors edited */
export type MovedEditor = 'event' | 'job' | 'company'

const PANELS: Record<MovedEditor, { admin: string; company: string | null }> = {
  event: { admin: '/admin/events', company: '/company/admin/events' },
  job: { admin: '/admin/jobs', company: '/company/admin/jobs' },
  // only admins ever edited companies
  company: { admin: '/admin/companies', company: null },
}

/**
 * Where an address of an old editor leads now
 *
 * @remarks
 * Bookmarks and links in mail still point at `/event/edit/<id>` and the like. Admins go to the
 * admin panel; company users and coordinators to the same form in the company panel.
 */
export function movedEditorPath(
  editor: MovedEditor,
  id: string | undefined,
  isAdmin: boolean,
): string {
  const panel = PANELS[editor]
  const base = isAdmin || !panel.company ? panel.admin : panel.company
  return `${base}/${id ? encodeURIComponent(id) : 'new'}`
}
