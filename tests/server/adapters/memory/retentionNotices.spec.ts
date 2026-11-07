import { describeRetentionNotices } from '@/tests/application/users/retentionNotices.contract'
import { memoryRetentionNotices } from '@/server/adapters/memory/retentionNotices'

describeRetentionNotices('memory', () => memoryRetentionNotices())
