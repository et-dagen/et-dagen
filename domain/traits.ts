import type { HttpUrl } from '@/domain/url'
import type { Duration } from '@/domain/time/duration'

/**
 * Capabilities an entity may carry, independent of which entity it is
 *
 * @remarks
 * These play the role Rust's traits do: a capability named on its own, so it can be required
 * without naming the thing that has it.
 *
 * ```ts
 * const summarise = <T extends HasDescription>(item: T) => item.description.slice(0, 140)
 * ```
 *
 * That function takes a company, a job, or an event — anything at all with a description —
 * which is exactly what `CompanyWithDescription` could not express, since it drags `Company`
 * along with the capability.
 *
 * Because TypeScript matches types by shape, an entity satisfies a trait without declaring it.
 * {@link Job} never mentions `HasDescription` yet is accepted by the function above. Declaring
 * the trait is therefore about intent and reuse, not about making the code compile.
 *
 * A capability that *every* instance has is a field, not a trait — `Company.name` stays where
 * it is. {@link HasName} exists for the users who may or may not have one.
 */

export interface HasName {
  name: string
}

export interface HasDescription {
  description: string
}

export interface HasWebpage {
  webpage: HttpUrl
}

export interface HasLogo {
  logo: HttpUrl
}

export interface HasDuration {
  duration: Duration
}
