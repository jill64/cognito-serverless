import { redirect } from '@sveltejs/kit'
import { cognito } from '../../cognito.js'

export const load = async ({ url, cookies }) => {
  const redirect_url = await cognito.logout({
    url,
    cookies,
    redirect_uri: url.origin
  })

  throw redirect(302, redirect_url)
}
