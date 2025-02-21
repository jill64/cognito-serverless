<!----- BEGIN GHOST DOCS HEADER ----->

# cognito-serverless


<!----- BEGIN GHOST DOCS BADGES ----->
<a href="https://npmjs.com/package/cognito-serverless"><img src="https://img.shields.io/npm/v/cognito-serverless" alt="npm-version" /></a> <a href="https://npmjs.com/package/cognito-serverless"><img src="https://img.shields.io/npm/l/cognito-serverless" alt="npm-license" /></a> <a href="https://npmjs.com/package/cognito-serverless"><img src="https://img.shields.io/npm/dm/cognito-serverless" alt="npm-download-month" /></a> <a href="https://npmjs.com/package/cognito-serverless"><img src="https://img.shields.io/bundlephobia/min/cognito-serverless" alt="npm-min-size" /></a> <a href="https://github.com/jill64/cognito-serverless/actions/workflows/local.yml"><img src="https://github.com/jill64/cognito-serverless/actions/workflows/local.yml/badge.svg" alt="local.yml" /></a> <a href="https://github.com/jill64/cognito-serverless/actions/workflows/remote.yml"><img src="https://github.com/jill64/cognito-serverless/actions/workflows/remote.yml/badge.svg" alt="remote.yml" /></a>
<!----- END GHOST DOCS BADGES ----->


🔑 AWS Cognito Hosted UI OAuth on Serverless

<!----- END GHOST DOCS HEADER ----->

## Installation

```sh
npm i cognito-serverless
```

## Usage

Add code in your middleware or route to authenticate user.

```js
import { Auth } from 'cognito-server'

const cognito = new Auth(
  {
    COGNITO_DOMAIN: 'auth.example.com',
    COGNITO_CLIENT_ID: 'client-id',
    COGNITO_CLIENT_SECRET: 'client-secret',
    // State is a random string to prevent CSRF attacks (optional)
    COGNITO_STATE: 'random-string'
  },
  /*
   * The scopes of the access request.
   * @optional
   * @default ['openid', 'profile', 'email']
   */
  scopes: ['openid', 'profile', 'email']

  /*
   * After successful authentication, the user will be redirected to this URL.
   * @optional
   * @default url.origin
   */
  redirect_uri: 'https://example.com/callback'
)

/* UserInfo | URL */
const result = await cognito.auth({
  url: new URL('https://example.com'),
  cookies: {
    get: (key) => {
      /** get cookie */
    }
    set: (key, value, options) => {
      /** set cookie */
    }
  },
  // Override class config (optional)
  redirect_uri: 'https://example.com/callback'
})

if (typeof result === 'string') {
  /* Please redirect to `result` (Cognito Hosted UI) */
}

else {
  /* User is authenticated */
}

```

<!----- BEGIN GHOST DOCS FOOTER ----->

## License

[MIT](LICENSE)

<!----- END GHOST DOCS FOOTER ----->
