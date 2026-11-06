/** Whether a page is loading, for the bar under the header; the loading plugin sets it */
export const usePageLoading = () => useState('page-loading', () => false)
