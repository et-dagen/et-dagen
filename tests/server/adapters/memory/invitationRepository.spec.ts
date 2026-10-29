import { describeInvitationRepository } from '@/tests/application/invitations/repository.contract'
import { memoryInvitationRepository } from '@/server/adapters/memory/invitationRepository'

describeInvitationRepository('memory', () => memoryInvitationRepository())
