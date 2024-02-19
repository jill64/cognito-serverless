import { Buffer } from 'buffer'
import { list, number, optional, scanner, string } from 'typescanner'
import type { Condition } from 'typescanner/dist/types/index.js'

export type CookieOptions = {
  httpOnly?: boolean
  secure?: boolean
  sameSite?: 'strict' | 'lax' | 'none'
  path?: string
  maxAge?: number
}

const cookie_config: CookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: 'strict',
  path: '/',
  maxAge: 60 * 60 * 24 * 30
}

const is_auth_code_response = scanner({
  access_token: string,
  id_token: string,
  refresh_token: string,
  expires_in: number
})

type Guarded<T> = T extends Condition<infer U> ? U : never
type AuthCodeResponse = Guarded<typeof is_auth_code_response>

const save_tokens = async (event: RequestEvent, data: AuthCodeResponse) => {
  const { access_token, id_token, refresh_token, expires_in } = data

  event.cookies.set('access_token', access_token, {
    ...cookie_config,
    maxAge: expires_in
  })

  event.cookies.set('id_token', id_token, {
    ...cookie_config,
    maxAge: expires_in
  })

  event.cookies.set('refresh_token', refresh_token, cookie_config)
}

const exchange_code = async (event: RequestEvent, env: Env) => {
  const { url } = event

  const code = url.searchParams.get('code')

  if (!code) {
    return null
  }

  const response = await fetch(`https://${env.COGNITO_DOMAIN}/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(
        `${env.COGNITO_CLIENT_ID}:${env.COGNITO_CLIENT_SECRET}`
      ).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: `grant_type=authorization_code&client_id=${
      env.COGNITO_CLIENT_ID
    }&code=${code}&redirect_uri=${encodeURIComponent(url.origin)}`
  })

  const data = await response.json()

  if (!is_auth_code_response(data)) {
    console.error('Invalid auth code response', data)
    return null
  }

  save_tokens(event, data)
  const cognito_id = await get_user_info(event, env)

  return cognito_id
}

const is_user_info_response = scanner({
  sub: string,
  username: string,
  email: string,
  email_verified: list(['true', 'false']),
  phone_number_verified: optional(list(['true', 'false'])),
  phone_number: optional(string)
})

const get_user_info = async (event: RequestEvent, env: Env) => {
  const access_token = event.cookies.get('access_token')
  const id_token = event.cookies.get('id_token')

  if (!access_token || !id_token) {
    return null
  }

  const response = await fetch(
    `https://${env.COGNITO_DOMAIN}/oauth2/userInfo`,
    {
      headers: {
        Authorization: `Bearer ${access_token}`
      }
    }
  )

  const data = await response.json()

  if (!is_user_info_response(data)) {
    console.error('Invalid user info response', data)
    return null
  }

  return data
}

const exchange_token = async (event: RequestEvent, env: Env) => {
  const refresh_token = event.cookies.get('refresh_token')

  if (!refresh_token) {
    return null
  }

  const response = await fetch(`https://${env.COGNITO_DOMAIN}/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(
        `${env.COGNITO_CLIENT_ID}:${env.COGNITO_CLIENT_SECRET}`
      ).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: `grant_type=refresh_token&client_id=${env.COGNITO_CLIENT_ID}&refresh_token=${refresh_token}`
  })

  const data = await response.json()

  if (!is_auth_code_response(data)) {
    console.error('Invalid auth token response', data)
    return null
  }

  save_tokens(event, data)

  const user_info = await get_user_info(event, env)

  return user_info
}

export type Cookies = {
  get: (key: string) => string | undefined | null
  set: (key: string, value: string, options?: CookieOptions) => void
}

export type RequestEvent = {
  url: URL
  cookies: Cookies
}

export type Env = {
  COGNITO_DOMAIN: string
  COGNITO_CLIENT_ID: string
  COGNITO_CLIENT_SECRET: string
}

export const auth = async (event: { url: URL; cookies: Cookies }, env: Env) => {
  const user_info =
    (await get_user_info(event, env)) ??
    (await exchange_token(event, env)) ??
    (await exchange_code(event, env))

  if (user_info) {
    return user_info
  }

  const error_description = event.url.searchParams.get('error_description')
  const error = event.url.searchParams.get('error')

  if (error && error_description) {
    throw new Error(
      JSON.stringify({
        error,
        error_description
      })
    )
  }

  return null
}
