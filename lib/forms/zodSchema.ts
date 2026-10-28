import type { TypedSchema, TypedSchemaError } from 'vee-validate'
import type { z } from 'zod'

/** vee-validate's path for an issue: `location.name`, `years[0]` */
const pathOf = (path: readonly PropertyKey[]) =>
  path
    .map((key, index) =>
      typeof key === 'number'
        ? `[${key}]`
        : `${index === 0 ? '' : '.'}${String(key)}`,
    )
    .join('')

/** The issues to show, with a union's alternatives opened up */
function leaves(issues: readonly z.core.$ZodIssue[]): z.core.$ZodIssue[] {
  return issues.flatMap((issue) =>
    issue.code === 'invalid_union' && issue.errors.length > 0
      ? leaves(issue.errors.flat())
      : [issue],
  )
}

/**
 * A zod schema in the shape vee-validate validates forms with
 *
 * @remarks
 * Replaces `@vee-validate/zod`, which supports only zod 3. Each field gets the messages of its
 * issues, in order; the messages are keys under `form.errors`.
 */
export function typedSchemaOf<S extends z.ZodType>(
  schema: S,
): TypedSchema<z.input<S>, z.output<S>> {
  return {
    __type: 'VVTypedSchema',
    async parse(values) {
      const result = await schema.safeParseAsync(values)
      if (result.success) return { value: result.data, errors: [] }

      const byPath = new Map<string, TypedSchemaError>()
      for (const issue of leaves(result.error.issues)) {
        const path = pathOf(issue.path)
        const entry = byPath.get(path) ?? { path, errors: [] }
        entry.errors.push(issue.message)
        byPath.set(path, entry)
      }
      return { errors: [...byPath.values()] }
    },
  }
}
