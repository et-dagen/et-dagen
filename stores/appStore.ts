// the app store will hold state connected to application layout
// this includes navigation drawer state and global error modal

interface State {
  drawer: boolean
}

export const useAppStore = defineStore('app', {
  state: (): State => {
    return {
      drawer: false,
    }
  },
})
