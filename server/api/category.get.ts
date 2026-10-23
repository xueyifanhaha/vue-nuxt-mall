import type { Category } from '#shared/types'

export default defineEventHandler((): Category[] => {
  return getCatalog().categories
})
