export const calculateTimeDifference = (
  futureDate: string,
  futureTime: string
): string => {
  // Define current date and future date + time
  const currentDate = new Date()
  const futureDateTime = new Date(`${futureDate} ${futureTime}`)

  // Variables to find and define timedifferences

  // Calculate the time difference in milliseconds.
  const timeDifferenceInMs = futureDateTime.getTime() - currentDate.getTime()

  // Convert the time difference in milliseconds to seconds.
  const timeDifferenceInSeconds = timeDifferenceInMs / 1000

  // Convert the time difference in seconds to minutes.
  const timeDifferenceInMinutes = timeDifferenceInSeconds / 60

  // Convert the time difference in minutes to hours.
  const timeDifferenceInHours = timeDifferenceInMinutes / 60

  // Convert the time difference in hours to days.
  const timeDifferenceInDays = timeDifferenceInHours / 24

  // Create a string to display the time difference in the desired format.
  const timeDifferenceString = `${timeDifferenceInDays.toFixed(
    0
  )}:${timeDifferenceInHours.toFixed(0)}:${timeDifferenceInMinutes.toFixed(
    0
  )}:${timeDifferenceInSeconds.toFixed(0)}`

  return timeDifferenceString
}
