declare const tag: unique symbol

/**
 * Marks a type as distinct from others that happen to have the same shape
 *
 * @remarks
 * TypeScript compares types by *shape*, not by name. Two aliases of `string` are the same type
 * as far as the compiler is concerned, so this is accepted without complaint:
 *
 * ```ts
 * type UserUid = string
 * type CompanyUid = string
 * const wrong: CompanyUid = someUserUID // no error — both are just `string`
 * ```
 *
 * A brand adds a phantom property that exists only in the type system, which makes two
 * otherwise identical types incompatible. `Brand<string, 'UserUid'>` and
 * `Brand<string, 'CompanyUid'>` no longer interchange, and the mix-up above becomes an error.
 *
 * The property is keyed by a `unique symbol` that is never exported, so no code outside this
 * file can write it. That is the whole trick: since a branded value cannot be produced by
 * writing a literal, the only way to obtain one is through the module that owns the type — and
 * that module can insist on validating first. The brand therefore carries a *promise* rather
 * than a shape. `ISO8601String` does not merely look like a timestamp; it has been checked
 * against the calendar. `MapLink` does not merely look like a URL; its host has been matched
 * against the allowlist.
 *
 * Nothing exists at runtime. `declare const` emits no code and the property is never assigned,
 * so a branded value *is* the underlying string or number — it serialises to Firestore, crosses
 * the SSR payload, and compares with `===` exactly as the unbranded value would. The cost is
 * paid entirely at compile time.
 *
 * @typeParam T - The underlying runtime type, usually `string` or `number`
 * @typeParam B - A unique label for this brand. Two brands with different labels never
 * interchange, so give each domain concept its own.
 *
 * @example
 * The owning module keeps the cast to itself and exposes checked ways in. Callers can then
 * only obtain the type by going through validation:
 *
 * ```ts
 * export type Postcode = Brand<string, 'Postcode'>
 *
 * const isValid = (value: string) => /^\d{4}$/.test(value)
 *
 * export const Postcode = {
 *   is: (value: unknown): value is Postcode =>
 *     typeof value === 'string' && isValid(value),
 *
 *   // Throws on bad input. The `as` is safe here, and only here, because it sits
 *   // behind the check — this is the single place the promise is made.
 *   parse: (value: string): Postcode => {
 *     if (!isValid(value)) throw new RangeError(`Not a postcode: ${value}`)
 *     return value as Postcode
 *   },
 *
 *   // For untrusted input, such as a database read, where throwing is too blunt.
 *   tryParse: (value: string): Postcode | null => (isValid(value) ? (value as Postcode) : null),
 * }
 *
 * const good: Postcode = Postcode.parse('7030') // fine
 * const bad: Postcode = '7030'                  // Type '"7030"' is not assignable
 * ```
 *
 * A branded type is still assignable *to* its underlying type, so a `Postcode` can be passed
 * anywhere a `string` is wanted, printed, or concatenated. Only the reverse is blocked.
 *
 * Reach for this when a plain `string` or `number` could be confused with another of its kind,
 * or when a value has to satisfy a rule the type system cannot express on its own. Do not brand
 * a type whose shape already makes it distinct — an `interface` is nominal enough in practice.
 *
 * @see {@link ISO8601String}, {@link Duration}, {@link TimeZone} and {@link MapLink} for the
 * types in this domain that use it.
 */
export type Brand<T, B extends string> = T & { readonly [tag]: B }

/**
 * The way in for an identifier whose format belongs to someone else
 *
 * @remarks
 * Most brands in this domain promise something checkable — `ISO8601String` has been matched against
 * the calendar, `MapLink` against a host allowlist. An entity uid promises only *which kind of thing
 * it identifies*, and that is not a property of the string. Firebase decides what a user uid looks
 * like; the database decides what a company uid looks like. Encoding either shape in a check here
 * would mean a change of provider or store breaks every rule that holds one.
 *
 * So the only rejected value is the empty string — which no store ever issues, and which would
 * otherwise flow into an ownership comparison as a uid equal to nothing.
 *
 * Shared rather than restated per uid type because the four are identical, and a validator copied
 * four times is one that eventually disagrees with itself. The reasoning specific to each lives on
 * that type's own documentation.
 *
 * @param label - Names the identifier in the error message
 */
export const opaqueUid = <T extends Brand<string, string>>(label: string) => ({
  /** @throws RangeError when the value is empty */
  parse: (value: string): T => {
    if (value.length === 0) throw new RangeError(`${label} is empty`)
    return value as T
  },
})
