import Mock from 'mockjs'
import type {
  Banner,
  Category,
  GoodsItem,
  NavIcon,
  ProductDetail,
  Sku,
} from '#shared/types'

const Random = Mock.Random

const CATEGORY_DEFS: Category[] = [
  { id: 1, name: '手机数码' },
  { id: 2, name: '家用电器' },
  { id: 3, name: '服饰鞋包' },
  { id: 4, name: '美妆个护' },
  { id: 5, name: '食品生鲜' },
  { id: 6, name: '家居日用' },
]

const GOODS_ADJ = ['旗舰', '臻选', '热销', '典藏', '轻奢', '爆款', '限量', '经典', '新品', '甄选']
const GOODS_NOUN = ['智能', '无线', '便携', '全场景', '高定', '冰鲜', '轻奢', '纳米', '全景', '超薄']

function mockGoodsTitle(): string {
  return `${Random.pick(GOODS_ADJ)}${Random.pick(GOODS_NOUN)}${Random.ctitle(2, 4)}`
}

// SVG 占位图：mockjs 的 dataImage 在 Nitro(Node ESM) 下依赖原生 canvas 会报错，
// 自生成 SVG data URL 零依赖、体积小、不依赖外部图床
function svgPlaceholder(w: number, h: number, text: string): string {
  const bg = Random.color()
  const fontSize = Math.max(12, Math.round(h / 6))
  const svg
    = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">`
    + `<rect width="100%" height="100%" fill="${bg}"/>`
    + `<text x="50%" y="50%" font-size="${fontSize}" fill="#ffffff" text-anchor="middle" dominant-baseline="middle">${text}</text>`
    + `</svg>`
  return `data:image/svg+xml;base64,${Buffer.from(svg, 'utf8').toString('base64')}`
}

function mockGoodsImage(id: number): string {
  return svgPlaceholder(200, 200, String(id).padStart(3, '0'))
}

function mockPrice(): number {
  return Number(Random.float(9, 4999, 2, 2).toFixed(2))
}

interface Catalog {
  categories: Category[]
  goods: GoodsItem[]
  goodsMap: Map<number, GoodsItem>
  detailMap: Map<number, ProductDetail>
}

let catalog: Catalog | null = null

function buildCatalog(): Catalog {
  const goods: GoodsItem[] = []
  let id = 0

  for (const cat of CATEGORY_DEFS) {
    const count = Random.integer(10, 14)
    for (let i = 0; i < count; i++) {
      id++
      const title = `${cat.name} · ${mockGoodsTitle()}`
      goods.push({
      id,
      title,
      image: mockGoodsImage(id),
        price: mockPrice(),
        originPrice: Random.bool() ? mockPrice() : undefined,
        sales: Random.integer(10, 99999),
        categoryId: cat.id,
      })
    }
  }

  // 详情：每个商品固定一套 SKU（颜色 × 版本）
  const COLORS = ['曜石黑', '釉白', '远峰蓝', '薄暮金']
  const VERSIONS = ['标准版', '高配版', '顶配版']
  const detailMap = new Map<number, ProductDetail>()

  for (const g of goods) {
    const skus: Sku[] = []
    let skuId = 0
    for (const c of COLORS) {
      for (const v of VERSIONS) {
        skuId++
        skus.push({
          id: skuId,
          title: `${c} ${v}`,
          price: Number((g.price + skuId * 50).toFixed(2)),
          stock: Random.integer(0, 999),
          specs: { 颜色: c, 版本: v },
        })
      }
    }
    detailMap.set(g.id, {
      ...g,
      images: [
        svgPlaceholder(375, 375, '主图'),
        svgPlaceholder(375, 375, '细节'),
        svgPlaceholder(375, 375, '场景'),
      ],
      description: Random.cparagraph(2, 4),
      specNames: ['颜色', '版本'],
      skus,
      params: [
        { key: '品牌', value: Random.ctitle(2, 3) },
        { key: '产地', value: Random.city() },
        { key: '保修', value: `${Random.integer(12, 36)}个月` },
        { key: '上架时间', value: Random.date('yyyy-MM-dd') },
      ],
    })
  }

  return {
    categories: CATEGORY_DEFS,
    goods,
    goodsMap: new Map(goods.map((g) => [g.id, g])),
    detailMap,
  }
}

export function getCatalog(): Catalog {
  if (!catalog) catalog = buildCatalog()
  return catalog
}

export function getHomeData() {
  const { categories, goods } = getCatalog()

  const banners: Banner[] = Array.from({ length: 5 }, (_, i) => ({
    id: i + 1,
    title: `${Random.ctitle(4, 6)}`,
    image: svgPlaceholder(750, 300, `banner ${i + 1}`),
  }))

  const navIcons: NavIcon[] = categories.map((c) => ({
    id: c.id,
    name: c.name,
    image: svgPlaceholder(60, 60, c.name.slice(0, 2)),
  }))

  const recommend = [...goods].sort(() => Math.random() - 0.5).slice(0, 10)

  return { banners, navIcons, recommend }
}
