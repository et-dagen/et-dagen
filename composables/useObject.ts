export const embedKeyIntoObjectValues = (obj: Record<string, any>) => {
  if (!obj) return obj
  return Object.entries(obj).map(([key, value]) => ({
    ...value,
    uid: key,
  }))
}

// compares if two objects are equal
export const compareObjects = (
  obj1: Record<string, any>,
  obj2: Record<string, any>,
) => {
  return JSON.stringify(obj1) === JSON.stringify(obj2)
}
