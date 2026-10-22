import { describeEventRepository } from '../../../application/events/eventRepository.contract'
import { memoryEventRepository } from '@/server/adapters/memory/eventRepository'

describeEventRepository('memory', memoryEventRepository)
