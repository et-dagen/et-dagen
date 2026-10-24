import { describeEventRepository } from '@/tests/application/events/eventRepository.contract'
import { memoryEventRepository } from '@/server/adapters/memory/eventRepository'

describeEventRepository('memory', memoryEventRepository)
