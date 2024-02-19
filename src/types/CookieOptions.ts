import type { CookieSerializeOptions } from 'cookie'

export type CookieOptions = CookieSerializeOptions & {
  path: string
}
