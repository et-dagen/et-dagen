import type { EntitledCompany } from '@/domain/authorization/entitlements'
import type { CompanyUid } from '@/domain/business/company'

/** Where companies are stored */
export interface CompanyRepository {
  /** The companies with these uids, with what they are entitled to. Unknown uids are skipped. */
  entitled(uids: readonly CompanyUid[]): Promise<EntitledCompany[]>
}
