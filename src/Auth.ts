import { Buffer } from 'buffer'
import { number, scanner, string } from 'typescanner'
import { CookieOptions } from './index.js'
import { isUserInfoResponse } from './isUserInfoResponse.js'
import { AuthParam } from './types/AuthParam.js'
import { Guarded } from './types/Guarded.js'

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

export class Auth {
  private env
  private scopes
  private redirect_uri

  constructor(
    env: {
      COGNITO_DOMAIN: string
      COGNITO_CLIENT_ID: string
      COGNITO_CLIENT_SECRET: string
    },
    scopes?: ('openid' | 'profile' | 'email' | 'phone')[],
    redirect_uri?: string
  ) {
    this.env = env
    this.scopes = scopes ?? ['openid', 'profile', 'email']
    this.redirect_uri = redirect_uri
  }

  private gen_scoped_param() {
    return ['aws.cognito.signin.user.admin', ...this.scopes].join('+')
  }

  private async save_tokens({ cookies }: AuthParam, data: AuthCodeResponse) {
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

  private async exchange_code(param: AuthParam) {
    const { url } = param

    const code = url.searchParams.get('code')

    if (!code) {
      return null
    }

    const response = await fetch(
      `https://${this.env.COGNITO_DOMAIN}/oauth2/token`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(
            `${this.env.COGNITO_CLIENT_ID}:${this.env.COGNITO_CLIENT_SECRET}`
          ).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `grant_type=authorization_code&client_id=${
          this.env.COGNITO_CLIENT_ID
        }&code=${code}&redirect_uri=${this.redirect_uri ?? param.redirect_uri}`
      }
    )

    const data = await response.json()

    if (!is_auth_code_response(data)) {
      console.error('Invalid auth code response', data)
      return null
    }

    this.save_tokens(param, data)
    const cognito_id = await this.get_user_info(param)

    return cognito_id
  }

  private async get_user_info({ cookies }: AuthParam) {
    const access_token = cookies.get('access_token')
    const id_token = cookies.get('id_token')

    if (!access_token || !id_token) {
      return null
    }

    const response = await fetch(
      `https://${this.env.COGNITO_DOMAIN}/oauth2/userInfo`,
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

  private async exchange_token(param: AuthParam) {
    const { cookies } = param

    const refresh_token = cookies.get('refresh_token')

    if (!refresh_token) {
      return null
    }

    const response = await fetch(
      `https://${this.env.COGNITO_DOMAIN}/oauth2/token`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(
            `${this.env.COGNITO_CLIENT_ID}:${this.env.COGNITO_CLIENT_SECRET}`
          ).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `grant_type=refresh_token&client_id=${this.env.COGNITO_CLIENT_ID}&refresh_token=${refresh_token}`
      }
    )

    const data = await response.json()

    if (!is_auth_code_response(data)) {
      console.error('Invalid auth token response', data)
      return null
    }

    this.save_tokens(param, data)

    const user_info = await this.get_user_info(param)

    return user_info
  }

  async auth(param: AuthParam) {
    const user_info =
      (await this.get_user_info(param)) ??
      (await this.exchange_token(param)) ??
      (await this.exchange_code(param))

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

    return `https://${this.env.COGNITO_DOMAIN}/oauth2/authorize?client_id=${
      this.env.COGNITO_CLIENT_ID
    }&response_type=code&scope=${this.gen_scoped_param()}&redirect_uri=${
      this.redirect_uri ?? param.redirect_uri
    }`
  }

  async logout(param: AuthParam) {
    const { cookies, url } = param

    const refresh_token = cookies.get('refresh_token')

    const response = await fetch(
      `https://${this.env.COGNITO_DOMAIN}/oauth2/revoke`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization:
            'Basic ' +
            Buffer.from(
              `${this.env.COGNITO_CLIENT_ID}:${this.env.COGNITO_CLIENT_SECRET}`
            ).toString('base64')
        },
        body: `token=${refresh_token}`
      }
    )

    cookies.set('id_token', '', { path: '/', maxAge: 0 })
    cookies.set('refresh_token', '', { path: '/', maxAge: 0 })
    cookies.set('access_token', '', { path: '/', maxAge: 0 })

    if (!response.ok) {
      throw new Error('Failed to revoke token')
    }

    return `https://${
      this.env.COGNITO_DOMAIN
    }/logout?response_type=code&client_id=${
      this.env.COGNITO_CLIENT_ID
    }&redirect_uri=${
      this.redirect_uri ?? url.origin
    }&scope=${this.gen_scoped_param()}`
  }
}
