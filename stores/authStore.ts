import type { User } from '~~/models/User'

interface State {
  user: User | null
  pendingRoute: string | null
}

export const useAuthStore = defineStore('auth', {
  state: (): State => {
    return {
      user: null,
      pendingRoute: null,
    }
  },
  getters: {
    isLoggedIn: (state) => !!state.user,
  },
})
