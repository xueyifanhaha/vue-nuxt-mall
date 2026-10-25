import type { GoodsItem, PageResult } from '#shared/types'

// 关键词搜索（按标题模糊匹配，分页）
export default defineEventHandler((event): PageResult<GoodsItem> => {
  const query = getQuery(event)
  const keyword = String(query.keyword ?? '').trim()
  const page = Math.max(1, Number(query.page) || 1)
  const pageSize = Math.min(30, Math.max(1, Number(query.pageSize) || 10))

  const all = keyword
    ? getCatalog().goods.filter((g) => g.title.includes(keyword))
    : []

  // 排序（白名单校验）→ 再分页，顺序不能反
  const sorted = sortGoods(all, query.sort)
  const start = (page - 1) * pageSize
  const list = sorted.slice(start, start + pageSize)

  return {
    list,
    total: all.length,
    page,
    pageSize,
    hasMore: start + list.length < all.length,
  }
})
