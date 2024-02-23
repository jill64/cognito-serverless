import type { Condition } from 'typescanner/dist/types/index.js'

export type Guarded<T> = T extends Condition<infer U> ? U : never
