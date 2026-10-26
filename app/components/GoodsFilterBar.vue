<script setup lang="ts">
// 商品列表排序筛选栏：综合 / 销量 / 价格（升降切换）/ 上新
// 自绘而不用 Vant DropdownMenu：后者与 Tabs 同款「子组件 setup 注册」机制，SSR 输出为空
export type GoodsSort = 'default' | 'sales' | 'price_asc' | 'price_desc' | 'new'

const sort = defineModel<GoodsSort>({ required: true })

const OPTIONS = [
  { key: 'default', label: '综合' },
  { key: 'sales', label: '销量' },
  { key: 'price', label: '价格' }, // 特殊项：点击在升/降序间切换
  { key: 'new', label: '上新' },
] as const

type OptionKey = (typeof OPTIONS)[number]['key']

const isPriceActive = computed(
  () => sort.value === 'price_asc' || sort.value === 'price_desc',
)

function isActive(key: OptionKey) {
  return key === 'price' ? isPriceActive.value : sort.value === key
}

function onClick(key: OptionKey) {
  if (key === 'price') {
    // 未选中 → 升序；升序 ⇄ 降序
    sort.value = sort.value === 'price_asc' ? 'price_desc' : 'price_asc'
    return
  }
  // 普通项：再点一次取消，回「综合」
  const target = key as Exclude<GoodsSort, 'price_asc' | 'price_desc'>
  sort.value = sort.value === target ? 'default' : target
}
</script>

<template>
  <div class="filter-bar">
    <button
      v-for="opt in OPTIONS"
      :key="opt.key"
      class="filter-item"
      :class="{ active: isActive(opt.key) }"
      @click="onClick(opt.key)"
    >
      {{ opt.label }}
      <!-- 价格项带升降箭头 -->
      <span
        v-if="opt.key === 'price'"
        class="arrows"
        :class="{ on: isPriceActive }"
      >
        <i
          class="up"
          :class="{ on: sort === 'price_asc' }"
        >↑</i>
        <i
          class="down"
          :class="{ on: sort === 'price_desc' }"
        >↓</i>
      </span>
    </button>
  </div>
</template>

<style scoped lang="scss">
.filter-bar {
  display: flex;
  background: var(--c-bg);
}

.filter-item {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
  padding: 9px 0;
  border: none;
  background: none;
  font-size: 13px;
  color: var(--c-ink);
  cursor: pointer;

  &.active {
    color: var(--c-primary);
    font-weight: 600;
  }
}

.arrows {
  display: inline-flex;
  flex-direction: column;
  line-height: 1;
  font-style: normal;

  i {
    font-style: normal;
    font-size: 11px;
    font-weight: 700;
    color: #b8b3a8;
    transform: scale(0.9);

    &.on {
      color: var(--c-accent);
      text-shadow: 0 0 1px currentColor; /* 选中箭头加粗描边更醒目 */
    }
  }

  .down {
    margin-top: -4px;
  }
}
</style>
