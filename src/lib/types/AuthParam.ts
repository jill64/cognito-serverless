import type { Cookies } from './Cookies.js'

export type AuthParam = {
  url: URL
  cookies: Cookies
  redirect_uri?: string
}
