import type { EntitledCompany } from '@/domain/authorization/entitlements'
import type { CompanyUid } from '@/domain/business/company'

/** Where companies are stored */
export interface CompanyRepository {
  /** The companies with these uids, with what they are entitled to. Unknown uids are skipped. */
  entitled(uids: readonly CompanyUid[]): Promise<EntitledCompany[]>
  /** Every stored company, with what it is entitled to */
  all(): Promise<EntitledCompany[]>
  /** The link of the company's logo, or null when it has none */
  logoOf(uid: CompanyUid): Promise<string | null>
  /** Point the company at a new logo */
  setLogo(uid: CompanyUid, link: string): Promise<void>
}
