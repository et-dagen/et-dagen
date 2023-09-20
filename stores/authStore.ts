import type { User } from '@/models/User'

interface State {
  user: User | null
  registeringUser: boolean
}

export const useAuthStore = defineStore('auth', {
  state: (): State => {
    return {
      user: null,
      registeringUser: false,
    }
  },
  getters: {
    isLoggedIn: (state) => !!state.user,
    hasAccess: (state) => (accessLevels?: string[]) =>
      accessLevels ? accessLevels?.includes(state.user?.userType ?? '') : true,
  },
})
