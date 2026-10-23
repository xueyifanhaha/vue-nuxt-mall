import type { HomeData } from '#shared/types'

export default defineEventHandler((): HomeData => {
  return getHomeData()
})
