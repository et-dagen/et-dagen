import { describeAccessRepository } from '@/tests/application/users/accessRepository.contract'
import { memoryAccessRepository } from '@/server/adapters/memory/accessRepository'

describeAccessRepository('memory', () => {
  const store = memoryAccessRepository()
  return {
    store,
    held: (user) => {
      const access = store.read(user)
      return Promise.resolve({
        roles: [...(access?.roles ?? [])].sort(),
        companies: (access?.memberships ?? []).map((m) => m.company).sort(),
      })
    },
  }
})
