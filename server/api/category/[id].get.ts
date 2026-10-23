import type { GoodsItem, PageResult } from '#shared/types'

// 分类下商品列表（分页，供 Vant List 触底加载练习）
export default defineEventHandler((event): PageResult<GoodsItem> => {
  const id = getRouterParam(event, 'id')
  const categoryId = Number(id)

  const query = getQuery(event)
  const page = Math.max(1, Number(query.page) || 1)
  const pageSize = Math.min(30, Math.max(1, Number(query.pageSize) || 10))

  const all = getCatalog().goods.filter((g) => g.categoryId === categoryId)
  const start = (page - 1) * pageSize
  const list = all.slice(start, start + pageSize)

  return {
    list,
    total: all.length,
    page,
    pageSize,
    hasMore: start + list.length < all.length,
  }
})
