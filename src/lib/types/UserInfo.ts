import { isUserInfoResponse } from '../isUserInfoResponse.js'
import { Guarded } from './Guarded.js'

export type UserInfo = Guarded<typeof isUserInfoResponse>
