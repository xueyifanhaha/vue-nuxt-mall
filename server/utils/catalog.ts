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

// 分类视觉：暖亮浅调渐变 + 品类图标（与奶油白+橘橙主题协调）
const CAT_STYLE: Record<number, { from: string; to: string; emoji: string; ink: string }> = {
  1: { from: '#ffe3c8', to: '#ffc08c', emoji: '📱', ink: '#9a5410' }, // 手机数码
  2: { from: '#ffeed4', to: '#ffd08e', emoji: '📺', ink: '#a06414' }, // 家用电器
  3: { from: '#ffe0d6', to: '#ffb3a0', emoji: '👜', ink: '#a34a30' }, // 服饰鞋包
  4: { from: '#ffe0e8', to: '#ffb6c9', emoji: '💄', ink: '#a84a66' }, // 美妆个护
  5: { from: '#fff2cf', to: '#ffdb8f', emoji: '🍎', ink: '#9c6b12' }, // 食品生鲜
  6: { from: '#e3f0e4', to: '#bfe0c4', emoji: '🛋️', ink: '#4a7a52' }, // 家居日用
}

const GOODS_ADJ = ['旗舰', '臻选', '热销', '典藏', '轻奢', '爆款', '限量', '经典', '新品', '甄选']

// 按分类生成真实感的商品名：品牌 + 品类词 + 款式
const CAT_NAMING: Record<number, { brands: string[]; nouns: string[] }> = {
  1: {
    brands: ['华为', '小米', 'OPPO', 'vivo', '荣耀', '一加', '漫步者', '安克'],
    nouns: ['旗舰手机', '无线耳机', '智能手表', '快充充电器', '蓝牙音箱', '平板电脑', '移动电源'],
  },
  2: {
    brands: ['美的', '格力', '海尔', '九阳', '苏泊尔', '小熊', '戴森', '科沃斯'],
    nouns: ['变频空调', '滚筒洗衣机', '破壁机', '空气炸锅', '电饭煲', '吸尘器', '加湿器'],
  },
  3: {
    brands: ['优衣库', '太平鸟', '海澜之家', '李宁', '安踏', '波司登', '森马'],
    nouns: ['纯棉T恤', '休闲卫衣', '直筒牛仔裤', '跑步鞋', '双肩包', '轻薄羽绒服', '衬衫'],
  },
  4: {
    brands: ['珀莱雅', '薇诺娜', '百雀羚', '自然堂', '花西子', '至本', '相宜本草'],
    nouns: ['保湿面霜', '防晒霜', '氨基酸洗面奶', '修护精华液', '丝绒口红', '补水面膜', '身体乳'],
  },
  5: {
    brands: ['三只松鼠', '良品铺子', '百草味', '洽洽', '伊利', '蒙牛', '农夫山泉'],
    nouns: ['坚果礼盒', '每日坚果', '猪肉脯', '益生菌酸奶', '纯牛奶', '脐橙', '车厘子'],
  },
  6: {
    brands: ['网易严选', '洁柔', '维达', '蓝月亮', '立白', '水星家纺', '富光'],
    nouns: ['抽纸', '洗衣液', '纯棉四件套', '收纳箱', '保温杯', '香薰蜡烛', '厨房纸巾'],
  },
}

const GOODS_EDITION = ['经典款', '升级款', '限定款', '礼盒装', '家庭装', '便携装', '2026新款']

function mockGoodsTitle(categoryId: number): string {
  const t = CAT_NAMING[categoryId] ?? { brands: ['拾光'], nouns: ['精选好物'] }
  return `${Random.pick(t.brands)} ${Random.pick(t.nouns)} ${Random.pick(GOODS_EDITION)}`
}

interface PlaceholderOpts {
  from: string
  to: string
  emoji?: string
  label?: string
  corner?: string
  /** 文字色：浅色渐变上用深色（默认白色，适合深色底） */
  ink?: string
}

// SVG 占位图：mockjs 的 dataImage 在 Nitro(Node ESM) 下依赖原生 canvas 会报错，
// 自生成渐变 + 图标 + 纹理的 SVG data URL，零依赖、体积小、不依赖外部图床
function svgPlaceholder(w: number, h: number, opts: PlaceholderOpts): string {
  const { from, to, emoji, label = '', corner = '', ink = '#ffffff' } = opts
  const m = Math.min(w, h)
  const emojiSize = Math.round(m * (emoji && label ? 0.26 : 0.3))
  const labelSize = Math.max(13, Math.round(h * 0.07))
  const cornerSize = Math.max(10, Math.round(h * 0.045))

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">`
    + `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">`
    + `<stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/>`
    + `</linearGradient></defs>`
    + `<rect width="${w}" height="${h}" fill="url(#g)"/>`
    + `<circle cx="${w * 0.86}" cy="${h * 0.12}" r="${m * 0.38}" fill="#ffffff" opacity="0.08"/>`
    + `<circle cx="${w * 0.08}" cy="${h * 0.96}" r="${m * 0.26}" fill="#000000" opacity="0.1"/>`
    + `<circle cx="${w * 0.86}" cy="${h * 0.12}" r="${m * 0.2}" fill="#ffffff" opacity="0.06"/>`
    + (emoji
        ? `<text x="50%" y="${label ? '44%' : '50%'}" font-size="${emojiSize}" text-anchor="middle" dominant-baseline="central">${emoji}</text>`
        : '')
    + (label
        ? `<text x="50%" y="72%" font-size="${labelSize}" fill="${ink}" opacity="0.9" text-anchor="middle" font-family="Georgia, 'Songti SC', SimSun, serif" letter-spacing="2">${label}</text>`
        : '')
    + (corner
        ? `<text x="${w - 8}" y="${h - 10}" font-size="${cornerSize}" fill="${ink}" opacity="0.4" text-anchor="end">${corner}</text>`
        : '')
    + `</svg>`

  return `data:image/svg+xml;base64,${Buffer.from(svg, 'utf8').toString('base64')}`
}

function mockGoodsImage(id: number, categoryId: number): string {
  const style = CAT_STYLE[categoryId] ?? { from: '#ffe9d4', to: '#ffc79c', emoji: '🛍️', ink: '#9a5410' }
  return svgPlaceholder(200, 200, {
    ...style,
    corner: String(id).padStart(3, '0'),
  })
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
      const title = mockGoodsTitle(cat.id)
      goods.push({
        id,
        title,
        image: mockGoodsImage(id, cat.id),
        price: mockPrice(),
        originPrice: Random.bool() ? mockPrice() : undefined,
        sales: Random.integer(10, 99999),
        categoryId: cat.id,
        // 上架时间：按 id 确定性倒推（id 越大越晚上架），不用 Random 保证重启数据一致
        createdAt: new Date(Date.UTC(2026, 9, 24) - id * 3 * 3600_000).toISOString(),
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
    const style = CAT_STYLE[g.categoryId] ?? { from: '#ffe9d4', to: '#ffc79c', emoji: '🛍️', ink: '#9a5410' }
    detailMap.set(g.id, {
      ...g,
      images: [
        svgPlaceholder(375, 375, { ...style, label: '主图' }),
        svgPlaceholder(375, 375, { ...style, label: '细节' }),
        svgPlaceholder(375, 375, { ...style, label: '场景' }),
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
    title: Random.ctitle(4, 6),
    image: svgPlaceholder(750, 300, {
      from: '#ffb35c',
      to: '#ff7a2e', /* 暖橘渐变主视觉，白字仍清晰 */
      emoji: '🛍️',
      label: `拾光百货 · 好物焕新`,
    }),
  }))

  const navIcons: NavIcon[] = categories.map((c) => ({
    id: c.id,
    name: c.name,
    image: svgPlaceholder(60, 60, CAT_STYLE[c.id] ?? { from: '#ffe9d4', to: '#ffc79c', emoji: '🛍️', ink: '#9a5410' }),
  }))

  const recommend = [...goods].sort(() => Math.random() - 0.5).slice(0, 10)

  return { banners, navIcons, recommend }
}

// ===== 列表排序：白名单映射，用户输入的 sort 值不直接进排序逻辑 =====
const GOODS_SORTERS: Record<string, (a: GoodsItem, b: GoodsItem) => number> = {
  default: (a, b) => a.id - b.id, // 综合（默认按上架倒序近似人气）
  sales: (a, b) => b.sales - a.sales, // 销量降序
  price_asc: (a, b) => a.price - b.price,
  price_desc: (a, b) => b.price - a.price,
  new: (a, b) => b.createdAt.localeCompare(a.createdAt), // 上新在前
}

/** 解析并校验 sort 参数，非法值回落 default */
export function parseGoodsSort(raw: unknown): string {
  const key = String(raw ?? 'default')
  return key in GOODS_SORTERS ? key : 'default'
}

/** 返回排序后的新数组（不改动入参），调用方再自行分页 */
export function sortGoods(list: GoodsItem[], sort: unknown): GoodsItem[] {
  return [...list].sort(GOODS_SORTERS[parseGoodsSort(sort)])
}
