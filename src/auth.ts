import { Buffer } from 'buffer'
import { number, scanner, string } from 'typescanner'
import { CookieOptions } from './index.js'
import { AuthParam } from './types/AuthParam.js'
import { Guarded } from './types/Guarded.js'
import { isUserInfoResponse } from './isUserInfoResponse.js'

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

type AuthCodeResponse = Guarded<typeof is_auth_code_response>

const save_tokens = async ({ cookies }: AuthParam, data: AuthCodeResponse) => {
  const { access_token, id_token, refresh_token, expires_in } = data

  cookies.set('access_token', access_token, {
    ...cookie_config,
    maxAge: expires_in
  })

  cookies.set('id_token', id_token, {
    ...cookie_config,
    maxAge: expires_in
  })

  cookies.set('refresh_token', refresh_token, cookie_config)
}

const exchange_code = async (param: AuthParam) => {
  const { url, env } = param

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

  save_tokens(param, data)
  const cognito_id = await get_user_info(param)

  return cognito_id
}

const get_user_info = async ({ cookies, env }: AuthParam) => {
  const access_token = cookies.get('access_token')
  const id_token = cookies.get('id_token')

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

  if (!isUserInfoResponse(data)) {
    console.error('Invalid user info response', data)
    return null
  }

  return data
}

const exchange_token = async (param: AuthParam) => {
  const { cookies, env } = param

  const refresh_token = cookies.get('refresh_token')

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

  save_tokens(param, data)

  const user_info = await get_user_info(param)

  return user_info
}

export const auth = async (param: AuthParam) => {
  const user_info =
    (await get_user_info(param)) ??
    (await exchange_token(param)) ??
    (await exchange_code(param))

  if (user_info) {
    return user_info
  }

  const error_description = param.url.searchParams.get('error_description')
  const error = param.url.searchParams.get('error')

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
