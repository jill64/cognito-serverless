import { list, optional, scanner, string } from 'typescanner'

export const isUserInfoResponse = scanner({
  sub: string,
  username: string,
  email: optional(string),
  email_verified: optional(list(['true', 'false'])),
  phone_number_verified: optional(list(['true', 'false'])),
  phone_number: optional(string)
})
