<script setup lang="ts">
import { NavBar, Sidebar, SidebarItem, List, Empty, Grid, GridItem } from 'vant'
import type { Category, GoodsItem, PageResult } from '#shared/types'

useSeoMeta({ title: '分类 - mall 商城' })

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
      query: { page: page.value, pageSize: PAGE_SIZE },
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

// 切换左侧分类：重置后手动拉第一页
// （loading 先置 true 挡住 List 的自动 check，避免依赖 List 触发时机）
const scroller = ref<HTMLElement | null>(null)

function onSelect(item: { name: string | number }) {
  const id = Number(item.name)
  if (id === activeId.value) {
    return
  }
  activeId.value = id
  list.value = []
  page.value = 1
  finished.value = false
  scroller.value?.scrollTo({ top: 0 })
  fetchPage(true)
}

const activeName = computed(() => String(activeId.value))
</script>

<template>
  <div class="category">
    <NavBar title="分类" />

    <Empty v-if="error" description="加载失败，请刷新重试" />

    <div v-else-if="cats" class="cat-body">
      <!-- 左侧分类栏 -->
      <Sidebar v-model="activeName" class="cat-side" @select="onSelect">
        <SidebarItem
          v-for="c in cats"
          :key="c.id"
          :name="String(c.id)"
          :title="c.name"
        />
      </Sidebar>

      <!-- 右侧商品流（触底分页） -->
      <div ref="scroller" class="cat-main">
        <List
          v-model:loading="loading"
          :finished="finished"
          :error="loadError"
          finished-text="没有更多了"
          error-text="加载失败，点击重试"
          @load="onLoad"
        >
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
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
/* NavBar + Tabbar 之外全部给分栏（高度跟随 Vant 变量，避免魔法数字） */
.cat-body {
  display: flex;
  height: calc(100dvh - var(--van-nav-bar-height) - var(--van-tabbar-height));
  overflow: hidden;
}

/* 左栏：墨绿主题覆盖 Vant Sidebar 默认红 */
.cat-side {
  flex-shrink: 0;
  width: 88px;

  :deep(.van-sidebar-item) {
    background: #fffdf9;
    color: var(--c-ink);
  }

  :deep(.van-sidebar-item--selected) {
    background: #fff;
    color: var(--c-pine);
    border-color: var(--c-brass); /* 选中项左侧铜金竖条 */
    font-weight: 600;
  }
}

/* 右栏：内部滚动 */
.cat-main {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
  box-sizing: border-box;

  /* 两列卡片与首页一致的呼吸感 */
  .goods-grid {
    padding: 0;
  }
}
</style>
