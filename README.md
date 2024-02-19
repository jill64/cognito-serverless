<!----- BEGIN GHOST DOCS HEADER ----->
<!----- END GHOST DOCS HEADER ----->

## Installation

```sh
npm i cognito-serverless
```

## Usage

Add code in your middleware or route to authenticate user.

```js
import { auth } from 'cognito-server'

/* UserInfo | URL */
const result = await auth({
  url: new URL('https://example.com'),
  cookies: {
    get: (key) => {
      /** get cookie */
    }
    set: (key, value, options) => {
      /** set cookie */
    }
  },
  env: {
    COGNITO_DOMAIN: 'auth.example.com',
    COGNITO_CLIENT_ID: 'client-id',
    COGNITO_CLIENT_SECRET: 'client-secret',
  },
  /*
   * After successful authentication, the user will be redirected to this URL.
   * @optional
   * @default url.origin
   */
  redirect_uri: 'https://example.com/callback',
  /*
   * The scopes of the access request.
   * @optional
   * @default ['openid', 'profile', 'email']
   */
  scope: ['openid', 'profile', 'email'],
})

if (result instanceof URL) {
  /* Redirect to `result` (Cognito Hosted UI) */
}

else {
  /* User is authenticated */
}

```
