import { CookieOptions } from './CookieOptions.js'

export type Cookies = {
  get: (key: string) => string | undefined | null
  set: (key: string, value: string, options?: CookieOptions) => void
}
