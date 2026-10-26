// 图片服务：把内联 data URL 换成可缓存的图片 URL
//
// 为什么值得换：data URL 内联在 JSON/HTML 里，每个商品带一份完整 SVG（约 1KB），
// 浏览器无法单独缓存，翻页/回访都要重新传；换成 URL 后响应体只剩几十字节，
// 图片本身可以 immutable 长缓存，生产还能挂在 CDN 上。
//
// URL 形态：
//   /img/goods/12.svg?size=200            列表小图（右下角带三位编号）
//   /img/goods/12.svg?size=375&view=main  详情轮播（main / detail / scene）
//   /img/banner/1.svg                     首页 banner（750×300）
//   /img/nav/1.svg                        金刚区图标（60×60）
import { createError, defineEventHandler, getHeader, getQuery, getRouterParam, setHeader, setResponseStatus } from 'h3'
import { getCatalog, renderSvg, styleOfCategory } from '../../../utils/catalog'

/** view 白名单：URL 里的任意字符串都不会进 SVG，注入面为零 */
const VIEW_LABEL: Record<string, string> = {
  main: '主图',
  detail: '细节',
  scene: '场景',
}

/** 尺寸只接受 40~800 的整数，非法值回落默认（防止超大画布被用来打 CPU） */
function clampSize(raw: unknown, fallback: number): number {
  const n = Number(raw)
  if (!Number.isFinite(n)) {
    return fallback
  }
  return Math.min(800, Math.max(40, Math.round(n)))
}

export default defineEventHandler((event) => {
  const kind = getRouterParam(event, 'kind') ?? ''
  const name = getRouterParam(event, 'name') ?? ''
  const id = Number.parseInt(name, 10)
  if (!Number.isFinite(id) || id <= 0) {
    throw createError({ statusCode: 400, statusMessage: '图片参数不合法' })
  }

  const query = getQuery(event)
  let svg: string

  if (kind === 'goods') {
    const goods = getCatalog().goodsMap.get(id)
    if (!goods) {
      throw createError({ statusCode: 404, statusMessage: '图片不存在' })
    }
    const view = String(query.view ?? '')
    const label = VIEW_LABEL[view] ?? ''
    const size = clampSize(query.size, label ? 375 : 200)
    svg = renderSvg(size, size, {
      ...styleOfCategory(goods.categoryId),
      label,
      corner: label ? '' : String(id).padStart(3, '0'),
    })
  }
  else if (kind === 'banner') {
    svg = renderSvg(750, 300, {
      from: '#ffb35c',
      to: '#ff7a2e',
      emoji: '🛍️',
      label: '拾光百货 · 好物焕新',
    })
  }
  else if (kind === 'nav') {
    // 只认已存在的分类 id，避免任意 id 都能生成图
    if (!getCatalog().categories.some(c => c.id === id)) {
      throw createError({ statusCode: 404, statusMessage: '图片不存在' })
    }
    svg = renderSvg(60, 60, styleOfCategory(id))
  }
  else {
    throw createError({ statusCode: 404, statusMessage: '图片类型不存在' })
  }

  // 内容完全由 URL 决定 → 同一个 ETag 永远对应同一张图，可以放心 immutable
  const etag = `"${kind}-${id}-${query.view ?? 'x'}-${query.size ?? 'd'}"`
  if (getHeader(event, 'if-none-match') === etag) {
    setResponseStatus(event, 304)
    return null
  }

  setHeader(event, 'Content-Type', 'image/svg+xml; charset=utf-8')
  setHeader(event, 'Cache-Control', 'public, max-age=31536000, immutable')
  setHeader(event, 'ETag', etag)
  return svg
})
