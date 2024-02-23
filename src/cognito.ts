import {
  COGNITO_CLIENT_ID,
  COGNITO_CLIENT_SECRET,
  COGNITO_DOMAIN
} from '$env/static/private'
import { Auth } from '$lib/index'

export const cognito = new Auth(
  {
    COGNITO_DOMAIN,
    COGNITO_CLIENT_ID,
    COGNITO_CLIENT_SECRET
  },
  ['email', 'openid', 'profile']
)
