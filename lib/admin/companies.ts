/** A `registrationCodes/<uid>` record */
export interface CodeRecord {
  code?: string
  companyUID?: string
}

/** Each company's registration codes, in the order they were stored */
export function codesByCompany(
  codes: Record<string, CodeRecord> | null | undefined,
): Map<string, string[]> {
  const byCompany = new Map<string, string[]>()
  for (const { code, companyUID } of Object.values(codes ?? {})) {
    if (!code || !companyUID) continue
    byCompany.set(companyUID, [...(byCompany.get(companyUID) ?? []), code])
  }
  return byCompany
}

/** A web address as people read it: the host without "www." */
export function siteLabel(url: string | null | undefined): string {
  if (!url) return ''
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}
