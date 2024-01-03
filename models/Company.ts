export interface Company {
  companyType: 'main-partner' | 'partner' | 'sponsor'
  description: string
  logo: string
  name: string
  uid?: string | null
  webpage: string
}
