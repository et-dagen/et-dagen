import { describeActivityLog } from '@/tests/application/activity/activityLog.contract'
import { memoryActivityLog } from '@/server/adapters/memory/activityLog'

describeActivityLog('memory', () => memoryActivityLog())
