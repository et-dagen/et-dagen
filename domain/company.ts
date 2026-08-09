export type Relationship = 'mainPartner' | 'partner' | 'sponsor' | 'prior'

export interface Company {
  uid: string
  name: string
  relationship: Relationship
}

export interface CompanyWithDescription extends Company {
  description: string
}

export interface CompanyWithWebpage extends Company {
  webpage: string
}

export interface CompanyWithLogo extends Company {
  logoUrl: string
}
