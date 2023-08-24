import type { User } from '@/models/User'

interface State {
  user: User | null
}

export const useAuthStore = defineStore('auth', {
  state: (): State => {
    return {
      user: null,
    }
  },
  getters: {
    isLoggedIn: (state) => !!state.user,
    hasAccessLevel: (state) => (accessLevel?: string) =>
      accessLevel ? state.user?.accessLevel?.includes(accessLevel) : true,
  },
})
