import { Cookies } from './Cookies.js'

export type AuthParam = {
  url: URL
  cookies: Cookies
  env: {
    COGNITO_DOMAIN: string
    COGNITO_CLIENT_ID: string
    COGNITO_CLIENT_SECRET: string
  }
  redirect_uri?: string
  scopes?: ('openid' | 'profile' | 'email' | 'phone')[]
}
