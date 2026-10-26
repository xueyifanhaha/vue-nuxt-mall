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
const CAT_STYLE: Record<number, { from: string, to: string, emoji: string, ink: string }> = {
  1: { from: '#ffe3c8', to: '#ffc08c', emoji: '📱', ink: '#9a5410' }, // 手机数码
  2: { from: '#ffeed4', to: '#ffd08e', emoji: '📺', ink: '#a06414' }, // 家用电器
  3: { from: '#ffe0d6', to: '#ffb3a0', emoji: '👜', ink: '#a34a30' }, // 服饰鞋包
  4: { from: '#ffe0e8', to: '#ffb6c9', emoji: '💄', ink: '#a84a66' }, // 美妆个护
  5: { from: '#fff2cf', to: '#ffdb8f', emoji: '🍎', ink: '#9c6b12' }, // 食品生鲜
  6: { from: '#e3f0e4', to: '#bfe0c4', emoji: '🛋️', ink: '#4a7a52' }, // 家居日用
}

// 按分类生成真实感的商品名：品牌 + 品类词 + 款式
const CAT_NAMING: Record<number, { brands: string[], nouns: string[] }> = {
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

// ===== 详情数据真实化：让 mock 数据「互洽」而不是随机乱填 =====

/** 品牌从标题提取：标题规则 = 品牌 + 品类词 + 款式，首词即品牌，永远和标题一致 */
function brandOf(title: string): string {
  return title.split(' ')[0] || '拾光'
}

/** 产地：按分类给合理城市池（手机数码在深圳、生鲜在产区，不再全国乱飞） */
const ORIGIN_CITIES: Record<number, string[]> = {
  1: ['广东深圳', '广东东莞'],
  2: ['广东佛山', '浙江宁波', '安徽合肥'],
  3: ['浙江杭州', '福建泉州', '广东广州'],
  4: ['上海', '浙江杭州', '广东广州'],
  5: ['山东烟台', '云南昆明', '内蒙古呼和浩特', '四川成都'],
  6: ['浙江义乌', '江苏南通', '河北保定'],
}

/** 分类卖点词库：description 卖点段从这里拼，不同品类讲不同的卖点 */
const SELLING_POINTS: Record<number, string[]> = {
  1: ['新一代低功耗芯片，续航持久安心', '高清护眼屏，观感细腻通透', '快充加持，碎片时间即可回血'],
  2: ['变频节能，静音运行不扰家', '大容量设计，一次满足全家所需', '一级能效，长期使用更省电'],
  3: ['亲肤面料，上身柔软不闷汗', '版型剪裁利落，通勤休闲皆宜', '经典配色，怎么搭都不出错'],
  4: ['温和配方，敏感肌也可安心使用', '质地清爽易推开，吸收不粘腻', '核心成分足量添加，效果看得见'],
  5: ['产地直采，新鲜从源头开始', '配料表干净，给家人吃得放心', '锁鲜工艺直达，开袋即是好风味'],
  6: ['加厚材质，结实耐用不易坏', '居家收纳好帮手，整齐不费劲', '简约设计，放在哪里都顺眼'],
}

/** 分类规格集：不同品类用不同规格维度（服饰是颜色/尺码，食品是口味/规格） */
const SPEC_SETS: Record<number, { names: [string, string], values: [string[], string[]] }> = {
  1: { names: ['颜色', '版本'], values: [['曜石黑', '釉白', '远峰蓝', '薄暮金'], ['标准版', '高配版', '顶配版']] },
  2: { names: ['颜色', '规格'], values: [['雅白', '太空灰'], ['基础款', '进阶款', '旗舰款']] },
  3: { names: ['颜色', '尺码'], values: [['燕麦色', '藏青', '烟灰'], ['S', 'M', 'L', 'XL']] },
  4: { names: ['香型', '净含量'], values: [['清茉莉', '白茶', '雪松'], ['30ml', '50ml']] },
  5: { names: ['口味', '规格'], values: [['原味', '海盐味', '藤椒味'], ['袋装', '礼盒装']] },
}
// 家居日用：两条规格
SPEC_SETS[6] = {
  names: ['颜色', '规格'],
  values: [['云朵白', '雾灰绿'], ['单只装', '两件套', '四件套']],
}

/** 取规格集：未配置的分类回落数码（1）。显式抛错代替可能的 undefined，让类型收窄 */
function specSetOf(categoryId: number) {
  const set = SPEC_SETS[categoryId] ?? SPEC_SETS[1]
  if (!set) {
    throw new Error(`未配置规格集：categoryId=${categoryId}`)
  }
  return set
}

const FALLBACK_POINTS: [string, string, string] = ['品质可靠', '用料扎实', '售后无忧']

/** 取卖点：同样做兜底，保证解构出来一定是三个字符串 */
function sellingPointsOf(categoryId: number): [string, string, string] {
  const points = SELLING_POINTS[categoryId] ?? SELLING_POINTS[1]
  if (!points || points.length < 3) {
    return FALLBACK_POINTS
  }
  return [points[0] ?? FALLBACK_POINTS[0], points[1] ?? FALLBACK_POINTS[1], points[2] ?? FALLBACK_POINTS[2]]
}

/** 分类附加参数：每个品类有自己合理的参数项（食品是保质期，数码是保修） */
function extraParams(categoryId: number): { key: string, value: string }[] {
  const pick = <T>(arr: T[]): T => Random.pick(arr)
  switch (categoryId) {
    case 1:
    case 2:
      return [{ key: '保修', value: pick(['12个月', '24个月', '36个月']) }]
    case 3:
      return [{ key: '面料', value: pick(['100%纯棉', '棉聚酯混纺', '聚酯纤维', '莱赛尔纤维']) }]
    case 4:
      return [{ key: '净含量', value: pick(['30ml', '50ml', '75ml', '100g']) }]
    case 5:
      return [{ key: '保质期', value: pick(['6个月', '9个月', '12个月', '18个月']) }]
    default:
      return [{ key: '材质', value: pick(['加厚PP', '不锈钢', '无纺布', '水洗棉']) }]
  }
}

/** 描述文案：卖点段 + 规格段（引用真实 SKU 与价格档位）+ 保障段，替代随机乱句 */
function buildDescription(title: string, categoryId: number, price: number, specNames: string[], specValues: string[][]): string {
  const brand = brandOf(title)
  const [p1, p2, p3] = sellingPointsOf(categoryId)
  const tier = price >= 1000 ? '旗舰品质' : price >= 200 ? '进阶之选' : '高性价比之选'
  // 先解构再判空：noUncheckedIndexedAccess 下 specValues[0] 的类型含 undefined
  const [firstName, secondName] = specNames
  const [firstValues, secondValues] = specValues
  const specDesc
    = !firstValues
      ? ''
      : secondValues && secondName
        ? `提供${firstName}：${firstValues.join('/')}，${secondName}：${secondValues.join('/')}等多种组合，满足不同场景需求。`
        : `提供${firstName}：${firstValues.join('/')}。`
  return [
    `${p1}；${p2}；${p3}。`,
    specDesc ? `${brand}出品，${tier}定位。${specDesc}` : `${brand}出品，${tier}定位。`,
    '支持七天无理由退换，全场包邮（偏远地区除外），赠运费险，售后无忧。',
  ].join('\n')
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
        originPrice: Random.boolean() ? mockPrice() : undefined,
        sales: Random.integer(10, 99999),
        categoryId: cat.id,
        // 上架时间：按 id 确定性倒推（id 越大越晚上架），不用 Random 保证重启数据一致
        createdAt: new Date(Date.UTC(2026, 9, 24) - id * 3 * 3600_000).toISOString(),
      })
    }
  }

  // 详情：SKU 规格维度按品类走（数码是颜色×版本，服饰是颜色×尺码……）
  const detailMap = new Map<number, ProductDetail>()

  for (const g of goods) {
    const specSet = specSetOf(g.categoryId)
    const [nameA, nameB] = specSet.names
    const [valuesA, valuesB] = specSet.values

    // 前两个商品无规格（详情页点加购直接加入，不弹规格选择），其余保持双维度
    const noSpec = g.id <= 2

    // SKU id 全局唯一（商品 id ×100 + 商品内序号）：cart/订单都按 skuId 判同，
    // 商品内各自从 1 编号会让不同商品撞号 → 加购 B 被合并进 A
    const skus: Sku[] = []
    let skuId = 0
    if (noSpec) {
      skus.push({
        id: g.id * 100 + 1,
        title: '标准',
        price: g.price,
        stock: Random.integer(0, 999),
        specs: {},
      })
    }
    else {
      for (const a of valuesA) {
        for (const b of valuesB) {
          skuId++
          skus.push({
            id: g.id * 100 + skuId,
            title: `${a} ${b}`,
            price: Number((g.price + skuId * 50).toFixed(2)),
            stock: Random.integer(0, 999),
            specs: { [nameA]: a, [nameB]: b },
          })
        }
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
      description: buildDescription(
        g.title,
        g.categoryId,
        g.price,
        noSpec ? [] : specSet.names,
        noSpec ? [] : specSet.values,
      ),
      specNames: noSpec ? [] : [nameA, nameB],
      skus,
      params: [
        { key: '品牌', value: brandOf(g.title) }, // 与标题一致，不再随机品牌
        { key: '产地', value: Random.pick(ORIGIN_CITIES[g.categoryId] ?? ['浙江杭州']) },
        ...extraParams(g.categoryId),
        { key: '上架时间', value: g.createdAt.slice(0, 10) }, // 与 createdAt 字段互洽
      ],
    })
  }

  return {
    categories: CATEGORY_DEFS,
    goods,
    goodsMap: new Map(goods.map(g => [g.id, g])),
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

  const navIcons: NavIcon[] = categories.map(c => ({
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
