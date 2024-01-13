export const embedKeyIntoObjectValues = (obj: Record<string, any>) => {
  if (!obj) return obj
  return Object.entries(obj).map(([key, value]) => ({
    ...value,
    uid: key,
  }))
}
