import type { ProductDetail } from '#shared/types'

export default defineEventHandler((event): ProductDetail => {
  const id = Number(getRouterParam(event, 'id'))
  const detail = getCatalog().detailMap.get(id)

  if (!detail) {
    throw createError({ statusCode: 404, statusMessage: '商品不存在' })
  }
  return detail
})
