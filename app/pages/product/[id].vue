<script setup lang="ts">
import { NavBar, Swipe, SwipeItem, Icon, Empty } from 'vant'
import type { ProductDetail, Sku } from '#shared/types'

useSeoMeta({ title: '商品详情 - mall 商城' })

const route = useRoute()
const id = Number(route.params.id)

// SSR 取详情：key 带上商品 id——固定 key 会在不同商品间复用缓存串数据
const { data: detail, error } = await useAsyncData(`product-${id}`, () =>
  request<ProductDetail>(`/api/product/${id}`),
)

// 接口 404（createError）→ 交给 Nuxt 错误页
if (error.value || !detail.value) {
  throw createError({ statusCode: 404, statusMessage: '商品不存在', fatal: true })
}

// ---------- SKU 选择状态 ----------
// specs 选中态：{ 颜色: '曜石黑', 版本: '标准版' }；空字符串 = 未选
const selected = ref<Record<string, string>>(
  Object.fromEntries(detail.value.specNames.map((n) => [n, ''])),
)
const skuOpen = ref(false)

// 已选组合 → 命中 SKU（specs 对象全等比对）
const matchedSku = computed<Sku | null>(() => {
  const d = detail.value!
  const picked = Object.values(selected.value)
  if (picked.some((v) => !v)) {
    return null // 还有规格没选
  }
  return (
    d.skus.find((s) => d.specNames.every((n) => s.specs[n] === selected.value[n])) ?? null
  )
})

const allSpecsPicked = computed(() => matchedSku.value !== null)

function pickSpec(name: string, value: string) {
  selected.value[name] = selected.value[name] === value ? '' : value
}

// ---------- 收藏 / 加购 ----------
const isFav = ref(false)

function toggleFav() {
  isFav.value = !isFav.value
  if (isFav.value) {
    showToast('已收藏')
  }
}

// 加购入口：未选全规格 → 弹 SKU 层；选全 → 确认（真实 cart store 留阶段 7）
function onAddCart() {
  if (!allSpecsPicked.value) {
    skuOpen.value = true
    return
  }
  showToast(`已加入购物车：${matchedSku.value!.title}`)
}

function onBuy() {
  showToast('立即购买（阶段 7 后接入订单流程）')
}

function formatSales(n: number): string {
  return n >= 10000 ? `${(n / 10000).toFixed(1)}万` : String(n)
}
</script>

<template>
  <div class="product">
    <NavBar title="商品详情" left-arrow @click-left="$router.back()" />

    <template v-if="detail">
      <!-- 图片轮播 -->
      <Swipe class="gallery" :autoplay="3000" indicator-color="#fff">
        <SwipeItem v-for="(img, i) in detail.images" :key="i">
          <img class="gallery-img" :src="img" :alt="`${detail.title} 图${i + 1}`" />
        </SwipeItem>
      </Swipe>

      <!-- 价格/标题卡片 -->
      <section class="info-card">
        <div class="price-row">
          <span class="price"><i>¥</i>{{ detail.price }}</span>
          <span v-if="detail.originPrice" class="origin">¥{{ detail.originPrice }}</span>
          <span class="sales">已售{{ formatSales(detail.sales) }}</span>
        </div>
        <h1 class="title">{{ detail.title }}</h1>
      </section>

      <!-- 规格入口（未选全时展示提示） -->
      <section class="info-card spec-entry" @click="skuOpen = true">
        <span class="spec-label">选择</span>
        <span class="spec-value">
          {{
            allSpecsPicked
              ? detail.specNames.map((n) => selected[n]).join(' / ')
              : `${detail.specNames.join(' / ')}`
          }}
        </span>
        <Icon name="arrow" class="spec-arrow" />
      </section>

      <!-- 商品参数 -->
      <section class="info-card">
        <h2 class="section-title serif-title">商品参数</h2>
        <ul class="params">
          <li v-for="p in detail.params" :key="p.key" class="param-row">
            <span class="param-key">{{ p.key }}</span>
            <span class="param-value">{{ p.value }}</span>
          </li>
        </ul>
      </section>

      <!-- 商品描述 -->
      <section class="info-card">
        <h2 class="section-title serif-title">商品详情</h2>
        <p class="description">{{ detail.description }}</p>
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
          class="bar-icon"
          :class="{ active: isFav }"
          aria-label="收藏"
          @click="toggleFav"
        >
          <Icon :name="isFav ? 'like' : 'like-o'" />
          <span>收藏</span>
        </button>
        <button class="bar-btn cart" @click="onAddCart">加入购物车</button>
        <button class="bar-btn buy" @click="onBuy">立即购买</button>
      </div>
      <div class="bottom-placeholder" />
    </template>

    <Empty v-else-if="!error" description="加载中..." />
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

.bar-icon {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  border: none;
  background: none;
  font-size: 11px;
  color: var(--c-ink);
  cursor: pointer;

  &.active {
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
}

/* 占位：防止内容被 fixed 底栏遮住 */
.bottom-placeholder {
  height: 60px;
}
</style>
