import { isUserInfoResponse } from '../isUserInfoResponse.js'
import type { Guarded } from './Guarded.js'

export type UserInfo = Guarded<typeof isUserInfoResponse>
