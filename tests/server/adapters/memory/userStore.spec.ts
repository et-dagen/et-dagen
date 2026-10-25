import { describeUserRemoval } from '@/tests/application/users/userRemoval.contract'
import { memoryUserStore } from '@/server/adapters/memory/userStore'

describeUserRemoval('memory', (seed) => {
  const store = memoryUserStore(seed)
  return { store, holds: (uid) => Promise.resolve(store.has(uid)) }
})
