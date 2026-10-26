<script setup lang="ts">
import { NavBar, List, Empty, Grid, GridItem } from 'vant'
import type { Category, GoodsItem, PageResult } from '#shared/types'
import type { GoodsSort } from '~/components/GoodsFilterBar.vue'

useSeoMeta({ title: '分类 - 拾光百货' })

// 页面保活：返回本页不重挂载（列表/滚动位置/已加载分页原样保留，setup 不重跑）
definePageMeta({ keepalive: true })

const PAGE_SIZE = 10

// SSR 取分类列表（注意：一个 useAsyncData handler 里只能发一次请求——
// 连续 await 多次时，第二次的拦截器 useCookie 会丢失 Nuxt 上下文报 E1001）
const { data: cats, error: catError } = await useAsyncData('category-list', () =>
  request<Category[]>('/api/category'),
)

// SSR 取第一个分类的第一页商品（setup 顶层顺序 await，无嵌套上下文问题）
const firstId = cats.value?.[0]?.id ?? 0
const { data: firstPage, error: pageError } = await useAsyncData('category-first', () =>
  firstId
    ? request<PageResult<GoodsItem>>(`/api/category/${firstId}`, {
        query: { page: 1, pageSize: PAGE_SIZE },
      })
    : Promise.resolve(null),
)

const error = computed(() => catError.value || pageError.value)

// 列表状态（首屏由 SSR 数据水合）
const activeId = ref<number>(firstId)
const list = ref<GoodsItem[]>(firstPage.value?.list ?? [])
const page = ref(2) // 第一页已在 SSR 取走，下一页从 2 开始
const finished = ref(!firstPage.value?.hasMore)
const loading = ref(false)
const loadError = ref(false)
const seq = ref(0) // 请求序号：丢弃过期响应（快速切分类的竞态守卫）
const sort = ref<GoodsSort>('default') // 排序：切换时重置分页重新拉首屏

// 拉取一页：手动首屏与 List 触底共用
async function fetchPage(reset: boolean) {
  if (!activeId.value) {
    loading.value = false
    return
  }
  const mySeq = ++seq.value
  loading.value = true
  try {
    loadError.value = false
    const res = await request<PageResult<GoodsItem>>(`/api/category/${activeId.value}`, {
      query: { page: page.value, pageSize: PAGE_SIZE, sort: sort.value },
    })
    if (mySeq !== seq.value) {
      return // 期间已切到别的分类，本次响应过期，丢弃
    }
    if (reset) {
      list.value = []
    }
    list.value.push(...res.list)
    page.value++
    finished.value = !res.hasMore
  }
  catch {
    if (mySeq === seq.value) {
      loadError.value = true
    }
  }
  finally {
    if (mySeq === seq.value) {
      loading.value = false
    }
  }
}

// List 触底：加载下一页
function onLoad() {
  if (finished.value) {
    loading.value = false
    return
  }
  fetchPage(false)
}

// 切换排序：重置后手动拉第一页（seq 竞态守卫同样覆盖快速连点的场景）
watch(sort, () => {
  page.value = 1
  finished.value = false
  window.scrollTo({ top: 0 })
  fetchPage(true)
})

// 切换顶部 Tab：重置后手动拉第一页（loading 已在 fetchPage 置 true，
// 会挡住 List 的自动 check，避免双请求）
function onClickTab(id: number) {
  if (id === activeId.value) {
    return
  }
  activeId.value = id
  list.value = []
  page.value = 1
  finished.value = false
  window.scrollTo({ top: 0 })
  fetchPage(true)
}
</script>

<template>
  <div class="category">
    <NavBar title="分类" />

    <Empty v-if="error" description="加载失败，请刷新重试" />

    <template v-else-if="cats">
      <!-- 顶部吸顶分类 Tab（自绘：Vant Tabs 的标题靠子组件 setup 注册，
           SSR 不触发重渲染会输出空 nav，自绘保证首屏完整） -->
      <div class="cat-tabs">
        <button
          v-for="c in cats"
          :key="c.id"
          class="cat-tab"
          :class="{ active: c.id === activeId }"
          @click="onClickTab(c.id)"
        >
          {{ c.name }}
        </button>
      </div>

      <!-- 排序筛选栏（吸顶叠在分类 Tab 下方） -->
      <GoodsFilterBar v-model="sort" class="cat-filter" />

      <!-- 商品流：页面级滚动 + List 触底分页 -->
      <List
        v-model:loading="loading"
        :finished="finished"
        :error="loadError"
        finished-text="没有更多了"
        error-text="加载失败，点击重试"
        @load="onLoad"
      >
        <!-- 首屏骨架：切分类后 list 已清空、首屏数据未回时占位（尺寸与真实卡一致，防布局跳动） -->
        <GoodsSkeleton v-if="loading && list.length === 0" :count="6" />

        <Grid class="goods-grid" :column-num="2" :border="false" :gutter="8">
          <GridItem v-for="g in list" :key="g.id">
            <GoodsCard :goods="g" />
          </GridItem>
        </Grid>
      </List>

      <!-- 当前分类没有商品 -->
      <Empty
        v-if="finished && !loading && list.length === 0"
        description="该分类暂无商品"
      />
    </template>
  </div>
</template>

<style scoped lang="scss">
/* Tab 栏：吸顶 + 横向滚动，墨绿选中 + 铜金下划线 */
.cat-tabs {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  height: 40px; /* 固定高度，给筛选栏的 sticky 偏移用 */
  gap: 4px;
  overflow-x: auto;
  padding: 0 8px;
  background: var(--c-bg);
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

/* 筛选栏：分类 Tab 吸顶后叠在其下方 */
.cat-filter {
  position: sticky;
  top: 40px;
  z-index: 10;
}

.cat-tab {
  position: relative;
  flex-shrink: 0;
  padding: 9px 14px;
  border: none;
  background: none;
  font-size: 14px;
  color: var(--c-ink);
  cursor: pointer;

  &.active {
    color: var(--c-primary);
    font-weight: 600;

    &::after {
      content: '';
      position: absolute;
      left: 50%;
      bottom: 3px;
      width: 20px;
      height: 3px;
      border-radius: 2px;
      background: var(--c-accent);
      transform: translateX(-50%);
    }
  }
}

.goods-grid {
  padding: 10px;
}
</style>
