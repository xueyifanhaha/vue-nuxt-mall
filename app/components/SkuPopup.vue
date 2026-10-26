<script setup lang="ts">
import { Popup, Icon } from 'vant'
import type { ProductDetail, Sku } from '#shared/types'

// SKU 选择弹层：底部弹出，规格分组按钮，组合命中后联动价格/库存
// 注意：Vant 4 主包没有 Sku 组件，移动端商城的 SKU 弹层通常自绘
const props = defineProps<{
  detail: ProductDetail
  /** 与父页共享的选中态：{ 颜色: '曜石黑', 版本: '' }，空串=未选 */
  selected: Record<string, string>
}>()

const show = defineModel<boolean>('show', { required: true })

const emit = defineEmits<{
  pick: [name: string, value: string]
  confirm: []
}>()

/** 该规格值是否可选：粗略做法是全开放，组合合法性由命中逻辑兜底 */
function optionsOf(name: string): string[] {
  const set = new Set<string>()
  for (const sku of props.detail.skus) {
    const v = sku.specs[name]
    if (v) {
      set.add(v)
    }
  }
  return [...set]
}

/** 命中的 SKU（所有规格都选过才非空） */
const matchedSku = computed<Sku | null>(() => {
  const picked = Object.values(props.selected)
  if (picked.some(v => !v)) {
    return null
  }
  return (
    props.detail.skus.find(s =>
      props.detail.specNames.every(n => s.specs[n] === props.selected[n]),
    ) ?? null
  )
})

/** 每组已选的展示文案 */
function summaryOf(name: string): string {
  return props.selected[name] || `请选择${name}`
}

function onConfirm() {
  if (!matchedSku.value) {
    return
  }
  show.value = false
  emit('confirm')
}
</script>

<template>
  <Popup
    v-model:show="show"
    position="bottom"
    round
    class="sku-popup"
  >
    <div class="sku-head">
      <img
        class="sku-img"
        :src="detail.image"
        :alt="detail.title"
      >
      <div class="sku-meta">
        <p class="sku-price">
          <i>¥</i>{{ matchedSku ? matchedSku.price : detail.price }}
        </p>
        <p class="sku-stock">
          库存：{{ matchedSku ? matchedSku.stock : '请先选择规格' }}
        </p>
        <p class="sku-picked">
          已选：{{ detail.specNames.map(summaryOf).join('；') }}
        </p>
      </div>
      <Icon
        name="cross"
        class="sku-close"
        @click="show = false"
      />
    </div>

    <div
      v-for="name in detail.specNames"
      :key="name"
      class="spec-group"
    >
      <h3 class="spec-name">
        {{ name }}
      </h3>
      <div class="spec-options">
        <button
          v-for="v in optionsOf(name)"
          :key="v"
          class="spec-option"
          :class="{ active: selected[name] === v }"
          @click="emit('pick', name, v)"
        >
          {{ v }}
        </button>
      </div>
    </div>

    <button
      class="sku-confirm"
      :disabled="!matchedSku"
      @click="onConfirm"
    >
      {{ matchedSku ? '加入购物车' : '请选择完整规格' }}
    </button>
  </Popup>
</template>

<style scoped lang="scss">
.sku-popup {
  padding: 16px 16px calc(16px + env(safe-area-inset-bottom));
}

.sku-head {
  display: flex;
  gap: 12px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--c-line);
}

.sku-img {
  width: 84px;
  height: 84px;
  border-radius: 8px;
  object-fit: cover;
  flex-shrink: 0;
}

.sku-meta {
  flex: 1;
  min-width: 0;
}

.sku-price {
  margin: 2px 0 0;
  font-size: 20px;
  font-weight: bold;
  color: var(--c-price);

  i {
    font-style: normal;
    font-size: 13px;
  }
}

.sku-stock {
  margin: 4px 0 0;
  font-size: 12px;
  color: var(--c-muted);
}

.sku-picked {
  margin: 4px 0 0;
  font-size: 12px;
  color: var(--c-ink);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sku-close {
  flex-shrink: 0;
  padding: 4px;
  color: var(--c-muted);
  cursor: pointer;
}

.spec-group {
  padding: 14px 0 4px;
}

.spec-name {
  margin: 0 0 10px;
  font-size: 14px;
  font-weight: 600;
  color: var(--c-ink);
}

.spec-options {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.spec-option {
  padding: 7px 16px;
  border: 1px solid var(--c-line);
  border-radius: 16px;
  background: var(--c-bg);
  font-size: 13px;
  color: var(--c-ink);
  cursor: pointer;

  &.active {
    border-color: var(--c-primary);
    background: rgba(255, 122, 46, 0.08);
    color: var(--c-primary);
    font-weight: 600;
  }
}

.sku-confirm {
  display: block;
  width: 100%;
  margin-top: 16px;
  padding: 12px 0;
  border: none;
  border-radius: 22px;
  background: var(--c-primary);
  font-size: 15px;
  font-weight: 600;
  color: #fff;
  cursor: pointer;

  &:disabled {
    background: var(--c-muted);
    cursor: not-allowed;
  }
}
</style>
