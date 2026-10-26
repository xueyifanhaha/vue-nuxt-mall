<script setup lang="ts">
import { NavBar, Swipe, SwipeItem, Icon, Empty, showToast, showConfirmDialog } from 'vant'
import type { ProductDetail, Sku } from '#shared/types'

const route = useRoute()
const id = Number(route.params.id)

// SSR 取详情：key 带上商品 id——固定 key 会在不同商品间复用缓存串数据
const { data: detail, error } = await useAsyncData(
  `product-${id}`,
  () => request<ProductDetail>(`/api/product/${id}`),
  // 缓存配方已封装进 request.ts（key 带商品 id，满足参数覆盖纪律）：同 id 回访 0 请求
  { getCachedData },
)

// SEO：详情页用商品真实标题/描述（getter 响应式，数据到位后覆盖兜底）
// 注意：必须放在 detail 声明之后——unhead 注册时会立即求值 getter，写在前面会撞 TDZ
useSeoMeta({
  title: () => (detail.value ? `${detail.value.title} - 拾光百货` : '商品详情 - 拾光百货'),
  description: () => detail.value?.description.slice(0, 80) ?? '拾光百货好物精选',
  ogTitle: () => detail.value?.title,
  ogDescription: () => detail.value?.description.slice(0, 80),
})

// 接口 404（createError）→ 交给 Nuxt 错误页
if (error.value || !detail.value) {
  throw createError({ statusCode: 404, statusMessage: '商品不存在', fatal: true })
}

// ---------- SKU 选择状态 ----------
// specs 选中态：{ 颜色: '曜石黑', 版本: '标准版' }；空字符串 = 未选
const selected = ref<Record<string, string>>(
  Object.fromEntries((detail.value?.specNames ?? []).map(n => [n, ''])),
)
const skuOpen = ref(false)

// 商品卡跳转带 ?openSku=1 → 进入详情自动弹 SKU 层（无规格商品没有可选项，不弹）
onMounted(() => {
  if (route.query.openSku && detail.value?.specNames.length) {
    skuOpen.value = true
  }
})

// 已选组合 → 命中 SKU（specs 对象全等比对）
const matchedSku = computed<Sku | null>(() => {
  const d = detail.value!
  const picked = Object.values(selected.value)
  if (picked.some(v => !v)) {
    return null // 还有规格没选
  }
  return (
    d.skus.find(s => d.specNames.every(n => s.specs[n] === selected.value[n])) ?? null
  )
})

const allSpecsPicked = computed(() => matchedSku.value !== null)

/**
 * 确定售罄：无规格商品直接看唯一 SKU；有规格的商品要等选完才知道，
 * 未选时按钮保持可点（点开弹层才看得到哪个规格缺货）
 */
const soldOut = computed(() => {
  const d = detail.value
  if (!d) {
    return false
  }
  if (d.specNames.length === 0) {
    return (d.skus[0]?.stock ?? 0) <= 0
  }
  return Boolean(matchedSku.value && matchedSku.value.stock <= 0)
})

function pickSpec(name: string, value: string) {
  selected.value[name] = selected.value[name] === value ? '' : value
}

// ---------- 收藏 / 加购 ----------
// 收藏态来自全局 store：与列表页商品卡共用同一份数据，不会出现「列表已收藏、详情还是未收藏」
const favorites = useFavoritesStore()
const isFav = computed(() => (detail.value ? favorites.has(detail.value.id) : false))

function toggleFav() {
  if (!detail.value) {
    return
  }
  const nowFav = favorites.toggle(detail.value.id)
  showToast(nowFav ? '已收藏' : '已取消收藏')
}

// 加购入口：未登录 → 引导登录带回跳；未选全规格 → 弹 SKU 层；选全 → 写入 cart store
const user = useUserStore()
const cart = useCartStore()

async function onAddCart() {
  if (!user.isLogged) {
    try {
      await showConfirmDialog({ title: '加入购物车', message: '登录后才能加入购物车，现在去登录？' })
    }
    catch {
      return // 取消
    }
    navigateTo(`/login?redirect=${encodeURIComponent(route.fullPath)}`)
    return
  }
  if (!allSpecsPicked.value) {
    skuOpen.value = true
    return
  }
  const sku = matchedSku.value!
  if (sku.stock <= 0) {
    showToast('该规格已售罄')
    return
  }
  const { qty, limited } = cart.add({
    goodsId: id,
    skuId: sku.id,
    title: detail.value!.title,
    image: detail.value!.image, // 用列表小图：轮播大图是 375 SVG base64，会撑爆 4KB cookie
    price: sku.price,
    specs: { ...sku.specs },
    stock: sku.stock,
  })
  skuOpen.value = false
  showToast(limited ? `库存仅剩 ${qty} 件，已按上限加入` : '已加入购物车')
  // 选中态归位：否则下次点「加入购物车」因 allSpecsPicked 仍为真，静默复用上次 SKU 再加一件
  selected.value = Object.fromEntries(detail.value!.specNames.map(n => [n, '']))
}

function onBuy() {
  if (!allSpecsPicked.value) {
    skuOpen.value = true
    return
  }
  if (matchedSku.value!.stock <= 0) {
    showToast('该规格已售罄')
    return
  }
  showToast('立即购买（阶段 7 后接入订单流程）')
}

function formatSales(n: number): string {
  return n >= 10000 ? `${(n / 10000).toFixed(1)}万` : String(n)
}
</script>

<template>
  <div class="product">
    <NavBar
      title="商品详情"
      left-arrow
      @click-left="$router.back()"
    />

    <template v-if="detail">
      <!-- 图片轮播 -->
      <Swipe
        class="gallery"
        :autoplay="3000"
        indicator-color="#fff"
      >
        <SwipeItem
          v-for="(img, i) in detail.images"
          :key="i"
        >
          <img
            class="gallery-img"
            :src="img"
            :alt="`${detail.title} 图${i + 1}`"
          >
        </SwipeItem>
      </Swipe>

      <!-- 价格/标题卡片 -->
      <section class="info-card">
        <div class="price-row">
          <span class="price"><i>¥</i>{{ detail.price }}</span>
          <span
            v-if="detail.originPrice"
            class="origin"
          >¥{{ detail.originPrice }}</span>
          <span class="sales">已售{{ formatSales(detail.sales) }}</span>
        </div>
        <h1 class="title">
          {{ detail.title }}
        </h1>
      </section>

      <!-- 规格入口（未选全时展示提示；无规格商品不渲染） -->
      <section
        v-if="detail.specNames.length"
        class="info-card spec-entry"
        @click="skuOpen = true"
      >
        <span class="spec-label">选择</span>
        <span class="spec-value">
          {{
            allSpecsPicked
              ? detail.specNames.map((n) => selected[n]).join(' / ')
              : `${detail.specNames.join(' / ')}`
          }}
        </span>
        <Icon
          name="arrow"
          class="spec-arrow"
        />
      </section>

      <!-- 商品参数 -->
      <section class="info-card">
        <h2 class="section-title serif-title">
          商品参数
        </h2>
        <ul class="params">
          <li
            v-for="p in detail.params"
            :key="p.key"
            class="param-row"
          >
            <span class="param-key">{{ p.key }}</span>
            <span class="param-value">{{ p.value }}</span>
          </li>
        </ul>
      </section>

      <!-- 商品描述 -->
      <section class="info-card">
        <h2 class="section-title serif-title">
          商品详情
        </h2>
        <p class="description">
          {{ detail.description }}
        </p>
      </section>

      <!-- SKU 弹层（规格选择 + 底部确认） -->
      <SkuPopup
        v-model:show="skuOpen"
        :detail="detail"
        :selected="selected"
        @pick="pickSpec"
        @confirm="onAddCart"
      />

      <!-- 底部操作栏 -->
      <div class="bottom-bar">
        <button
          class="bar-fav"
          :class="{ active: isFav }"
          aria-label="收藏"
          @click="toggleFav"
        >
          <Icon :name="isFav ? 'like' : 'like-o'" />
          <span>{{ isFav ? '已收藏' : '收藏' }}</span>
        </button>
        <button
          class="bar-btn cart"
          :disabled="soldOut"
          @click="onAddCart"
        >
          {{ soldOut ? '已售罄' : '加入购物车' }}
        </button>
        <button
          class="bar-btn buy"
          :disabled="soldOut"
          @click="onBuy"
        >
          {{ soldOut ? '已售罄' : '立即购买' }}
        </button>
      </div>
      <div class="bottom-placeholder" />
    </template>

    <Empty
      v-else-if="!error"
      description="加载中..."
    />
  </div>
</template>

<style scoped lang="scss">
.product {
  min-height: 100dvh;
  padding-bottom: env(safe-area-inset-bottom);
}

.gallery {
  background: #fff;

  .gallery-img {
    display: block;
    width: 100%;
    aspect-ratio: 1;
    object-fit: cover;
  }
}

.info-card {
  margin: 10px;
  padding: 14px;
  border-radius: 10px;
  background: var(--c-card);
}

.price-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.price {
  font-size: 22px;
  font-weight: bold;
  color: var(--c-price);

  i {
    font-style: normal;
    font-size: 14px;
  }
}

.origin {
  font-size: 13px;
  color: var(--c-muted);
  text-decoration: line-through;
}

.sales {
  margin-left: auto;
  font-size: 12px;
  color: var(--c-muted);
}

.title {
  margin: 10px 0 0;
  font-size: 16px;
  line-height: 1.5;
  color: var(--c-ink);
  font-weight: 600;
}

.spec-entry {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;

  .spec-label {
    font-size: 13px;
    color: var(--c-muted);
    flex-shrink: 0;
  }

  .spec-value {
    flex: 1;
    font-size: 14px;
    color: var(--c-ink);
  }

  .spec-arrow {
    color: var(--c-muted);
  }
}

.section-title {
  margin: 0 0 10px;
  font-size: 15px;
  color: var(--c-ink);
}

.params {
  margin: 0;
  padding: 0;
  list-style: none;
}

.param-row {
  display: flex;
  padding: 7px 0;
  font-size: 13px;
  border-bottom: 1px solid var(--c-line);

  &:last-child {
    border-bottom: none;
  }

  .param-key {
    width: 72px;
    color: var(--c-muted);
    flex-shrink: 0;
  }

  .param-value {
    color: var(--c-ink);
  }
}

.description {
  margin: 0;
  font-size: 14px;
  line-height: 1.7;
  color: var(--c-ink);
  white-space: pre-line; /* 数据端按 \n 分段 */
}

/* 底部操作栏：fixed + 安全区适配 */
.bottom-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px calc(8px + env(safe-area-inset-bottom));
  background: var(--c-card);
  box-shadow: 0 -2px 10px rgba(224, 94, 15, 0.08);
}

/* 收藏钮：与右侧胶囊大按钮等高，描边透明底承载选中态 */
.bar-fav {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 16px;
  height: 40px;
  border: 1px solid var(--c-line);
  border-radius: 20px;
  background: transparent;
  font-size: 13px;
  color: var(--c-ink);
  cursor: pointer;

  :deep(.van-icon) {
    font-size: 17px;
  }

  &.active {
    border-color: var(--c-price);
    color: var(--c-price);
  }
}

.bar-btn {
  flex: 1;
  padding: 11px 0;
  border: none;
  border-radius: 22px;
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  cursor: pointer;

  &.cart {
    background: var(--c-accent);
  }

  &.buy {
    background: var(--c-primary);
  }

  &:disabled {
    background: var(--c-muted);
    cursor: not-allowed;
  }
}

/* 占位：防止内容被 fixed 底栏遮住 */
.bottom-placeholder {
  height: 60px;
}
</style>
