import { spawn } from 'node:child_process'
import { env } from 'node:process'

if (!env.COGNITO_DOMAIN) {
  env.COGNITO_DOMAIN = 'https://auth.example.com'
  env.COGNITO_CLIENT_ID = 'example'
  env.COGNITO_CLIENT_SECRET = 'example'
}

spawn('npm run build:run', [], {
  shell: true,
  stdio: 'inherit'
})
