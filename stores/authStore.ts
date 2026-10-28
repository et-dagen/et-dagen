import {
  deserializeSubject,
  type SerializedSubject,
  type Subject,
} from '@/domain/authorization/subject'
import { AREAS, type Area, type Asker } from '@/lib/auth/areas'
import { askerFor } from '@/lib/auth/asker'
import type { User } from '@/models/User'

interface State {
  user: User | null
  /** The caller as the server resolved them; plain data, so it survives the SSR payload */
  subject: SerializedSubject | null
  registeringUser: boolean
}

export const useAuthStore = defineStore('auth', {
  state: (): State => {
    return {
      user: null,
      subject: null,
      registeringUser: false,
    }
  },
  getters: {
    isLoggedIn: (state) => !!state.user,
    currentSubject: (state): Subject | null =>
      state.subject && deserializeSubject(state.subject),
    /** Ask the permission table the server uses */
    can(): Asker['can'] {
      return askerFor(this.currentSubject).can
    },
    /** May the caller do this for every company, or for at least one of theirs */
    canForSome(): Asker['canForSome'] {
      return askerFor(this.currentSubject).canForSome
    },
    allows(): (area: Area) => boolean {
      return (area) => AREAS[area](askerFor(this.currentSubject))
    },
  },
  actions: {
    async loadSubject() {
      this.subject = await $fetch<SerializedSubject>(
        '/api/v1/user/subject',
      ).catch(() => null)
    },
  },
})
