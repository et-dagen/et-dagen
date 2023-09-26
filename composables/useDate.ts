import { DateStringObject } from 'models/DateTime'

export const isValidDate = (date: string): boolean => {
  // Check if date matches date regex
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!dateRegex.test(date)) {
    return false
  }

  // Check if date is valid
  const dateObject = new Date(date)
  if (dateObject.toString() === 'Invalid Date') {
    return false
  }

  return true
}

export const isSameMonth = (date1: string, date2: string): boolean => {
  const date1Object = new Date(date1)
  const date2Object = new Date(date2)

  return (
    date1Object.getMonth() === date2Object.getMonth() &&
    date1Object.getFullYear() === date2Object.getFullYear()
  )
}

const months = [
  'january',
  'february',
  'march',
  'april',
  'may',
  'june',
  'july',
  'august',
  'september',
  'november',
  'december',
]

export const dateStringToStringObject = (
  startDate: string
): DateStringObject => {
  const start = new Date(startDate)

  return {
    day: start.getDate(),
    month: months[start.getMonth()],
    year: start.getFullYear(),
  }
}
