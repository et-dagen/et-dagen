// Check if date is valid and matches YYYY-MM-DD format
export const isValidDate = (date: string): boolean => {
  // Check if date matches date regex
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!dateRegex.test(date.split('T')[0])) {
    return false
  }

  // Check if date is valid
  const dateObject = new Date(date)
  if (dateObject.toString() === 'Invalid Date') {
    return false
  }

  return true
}
