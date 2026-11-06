import type { ListedCompanies } from '@/lib/companies'

const KEY = 'companies'

/**
 * Every company, fetched once per page however many components ask
 *
 * @remarks
 * Await it, or put it in a `Promise.all` with the page's other loads.
 */
export const useCompanies = () =>
  useFetch<ListedCompanies>('/api/v1/company', { key: KEY })

/** Load the companies again after one has changed */
export const refreshCompanies = () => refreshNuxtData(KEY)
