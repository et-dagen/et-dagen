export const useRequiredInput = (value: string) => {
  return !!value || 'This field is required'
}

export const useValidateEmail = (value: string) => {
  const emailRegex = /\S+@\S+\.\S+/
  return emailRegex.test(value) || 'Invalid e-mail.'
}

export const useValidatePassword = (value: string) => {
  if (value.length < 8)
    return 'The password must be at least 8 characters long.'

  // Fail validation if value doesn not contain minimum 3 letters
  if (!value.match(/^(.*[a-zA-Z]){3}/))
    return 'The password must contain at least 3 letters.'

  // Fail validation if value does not contain minimum 3 numbers
  if (!value.match(/^(.*[0-9]){3}/))
    return 'The password must contain at least 3 numbers.'

  // Fail validation if value does not contain minimum 1 special characters
  if (!value.match(/^(.*[!@#$%^&*()\-_=+{};:,<.>]){1}/))
    return 'The password must contain at least 1 special character.'

  // Fail validation if value doen not contain minimum 1 uppercase letter
  if (!value.match(/^(.*[A-Z]){1}/))
    return 'The password must contain at least 1 uppercase letter.'

  return true
}
