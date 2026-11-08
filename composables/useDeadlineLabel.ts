import { deadlineOf } from '@/lib/time'
import type { DeadlineState } from '@/lib/jobs'

const MONTHS = [
  'january',
  'february',
  'march',
  'april',
  'may',
  'june',
  'july',
  'august',
  'september',
  'october',
  'november',
  'december',
]

/** A job's deadline as the job pages write it: "1. januar 2025", "Snarest" or "Løpende" */
export function useDeadlineLabel() {
  const { t } = useI18n()
  return (state: DeadlineState, deadline: string | null | undefined) => {
    if (state.kind === 'asap') return t('jobs.detail.asap')
    if (state.kind === 'rolling' || state.kind === 'none') {
      return t('jobs.detail.rolling')
    }
    const at = deadlineOf(deadline ?? undefined) ?? ''
    const month = MONTHS[Number(at.slice(5, 7)) - 1]
    return `${Number(at.slice(8, 10))}. ${t(`datetime.months.${month}`)} ${at.slice(0, 4)}`
  }
}
