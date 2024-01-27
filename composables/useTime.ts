// Numerise time string hh:mm:ss to object { hour: number, minute: number, second: number }
export const timeStringToNumericObject = (time: string) => {
  const [hour, minute, second] = time.split(':')
  return {
    hour: parseInt(hour),
    minute: parseInt(minute),
    second: parseInt(second),
  }
}

// Get hour and minute string from datetime string. Format: hh:mm
export const getHourAndMinuteStringFromString = (datetime: string) => {
  const time = getTimeFromDatetime(datetime)
  const { hour, minute } = timeStringToNumericObject(time)
  return `${hour < 10 ? `0${hour}` : hour}:${
    minute < 10 ? `0${minute}` : minute
  }`
}

// Extract time string hh:mm:ss from datetime string YYYY-MM-DDThh:mm:ssZ
export const getTimeFromDatetime = (datetime: string): string => {
  return datetime.split('T')[1].replace('Z', '')
}

// get local ISO string from date compensating for timezone offset
export const getLocalISOString = (date: Date) => {
  const offsetMs = date.getTimezoneOffset() * 60 * 1000
  const msLocal = date.getTime() - offsetMs
  const dateLocal = new Date(msLocal)
  const iso = dateLocal.toISOString()
  const isoLocal = iso.slice(0, 19)
  return isoLocal
}

// checking if now is within a time window of ISO strings
export const presentWithinTimeWindow = (start: string, end: string) => {
  const now = getLocalISOString(new Date())
  return start < now && end > now
}
