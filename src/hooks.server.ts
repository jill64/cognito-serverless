import { init } from '@jill64/sentry-sveltekit-cloudflare/server'
import { redirect } from '@sveltejs/kit'
import { cognito } from './cognito'

const { onHandle, onError } = init(
  'https://345d53e104949f82d6b5077cf691ea3c@o4505814639312896.ingest.sentry.io/4506792913076224'
)

export const handle = onHandle(async ({ resolve, event }) => {
  const { url, cookies } = event

  const user_info = await cognito.auth({
    url,
    cookies,
    redirect_uri: url.origin
  })

  if (typeof user_info === 'string') {
    throw redirect(302, user_info)
  }

  event.locals = {
    cognito: user_info
  }

  return resolve(event)
})

export const handleError = onError()
