import { CompanyUid } from '@/domain/business/company'

/** The company a request or a stored record names, as the permission table takes it */
export const companyOf = (companyUID: unknown) =>
  typeof companyUID === 'string' && companyUID !== ''
    ? { companyUid: CompanyUid.parse(companyUID) }
    : undefined
