export interface Company {
  companyType: 'main-partner' | 'partner' | 'sponsor' | 'old'
  description: string
  logo: string
  name: string
  uid?: string | null
  webpage: string
  cvaccess: boolean
}
