// the app store will hold state connected to application layout
// this includes the page-loading state

interface State {
  loading: boolean
}

export const useAppStore = defineStore('app', {
  state: (): State => {
    return {
      loading: false,
    }
  },
})
