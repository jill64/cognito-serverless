import { init } from '@jill64/sentry-sveltekit-cloudflare/client'

const onError = init(
  'https://345d53e104949f82d6b5077cf691ea3c@o4505814639312896.ingest.sentry.io/4506792913076224'
)

export const handleError = onError()
