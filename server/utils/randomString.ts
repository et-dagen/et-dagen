// utility function for generating a random string with
// a specified length, used to generate registration codes

export const generateRandomString = (length: number) => {
  let result = ''
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstauvwxyz0123456789'

  const charactersLength = characters.length

  for (let i = 0; i < length; i++)
    result += characters.charAt(Math.floor(Math.random() * charactersLength))

  return result
}
