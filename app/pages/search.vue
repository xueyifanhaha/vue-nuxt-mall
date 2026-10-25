<script setup lang="ts">
import { NavBar, Search, List, Empty, Grid, GridItem, Icon, showToast } from 'vant'
import type { Category, GoodsItem, PageResult } from '#shared/types'
import type { GoodsSort } from '~/components/GoodsFilterBar.vue'

useSeoMeta({ title: '搜索 - 拾光百货' })

const PAGE_SIZE = 10
const DEBOUNCE_MS = 300
const HISTORY_KEY = 'mall:search-history'
const HISTORY_MAX = 10

const keyword = ref('')
const list = ref<GoodsItem[]>([])
const page = ref(1)
const finished = ref(true) // 初始=未搜过，List 不会触发加载
const loading = ref(false)
const loadError = ref(false)
const searched = ref(false) // 已执行过搜索（控制空结果 Empty）
const seq = ref(0) // 请求序号：丢弃过期响应（防抖连续搜索的竞态守卫）
const sort = ref<GoodsSort>('default') // 排序：切换时重置分页重新拉首屏

const scroller = ref<HTMLElement | null>(null)

// 拉取一页：手动首屏与 List 触底共用
async function fetchPage(reset: boolean) {
  const kw = keyword.value.trim()
  if (!kw) {
    return
  }
  const mySeq = ++seq.value

  loading.value = true
  try {
    loadError.value = false
    const res = await request<PageResult<GoodsItem>>('/api/search', {
      query: { keyword: kw, page: page.value, pageSize: PAGE_SIZE, sort: sort.value },
    })
    if (mySeq !== seq.value) {
      return // 期间用户又输入了新词，本次响应已过期，丢弃
    }
    if (reset) {
      list.value = []
    }
    list.value.push(...res.list)
    page.value++
    finished.value = !res.hasMore
    searched.value = true
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

// 切换排序：重置后手动拉第一页（无关键词时不动作；seq 守卫覆盖快速连点）
watch(sort, () => {
  if (!keyword.value.trim()) {
    return
  }
  page.value = 1
  finished.value = false
  fetchPage(true)
})

// 发起新搜索：重置状态后手动拉第一页
// （loading 先置 true 挡住 List 的自动 check，避免双请求）
function doSearch(kw: string) {
  list.value = []
  page.value = 1
  finished.value = false
  searched.value = false
  loading.value = true
  scroller.value?.scrollTo({ top: 0 })
  fetchPage(true)
}

// 输入防抖 300ms：停顿才自动搜索；清空则回到初始态
let timer: ReturnType<typeof setTimeout> | null = null

watch(keyword, (v) => {
  if (timer) {
    clearTimeout(timer)
  }
  const kw = v.trim()
  if (!kw) {
    seq.value++ // 作废在途请求
    list.value = []
    searched.value = false
    finished.value = true
    loading.value = false
    return
  }
  timer = setTimeout(() => doSearch(kw), DEBOUNCE_MS)
})

onUnmounted(() => {
  if (timer) {
    clearTimeout(timer)
  }
})

// 回车/搜索键：立即搜索并记入历史（防抖自动搜不记，避免半截词污染历史）
function onConfirm() {
  const kw = keyword.value.trim()
  if (kw) {
    saveHistory(kw)
    doSearch(kw)
  }
}

// ---------- 搜索历史（localStorage 仅客户端；SSR 首帧不渲染，避免水合不一致） ----------
const history = ref<string[]>([])
const hotWords = ref<string[]>([])

onMounted(() => {
  history.value = readHistory()
  // 热门词兜底：分类名（复用接口）
  request<Category[]>('/api/category').then((cats) => {
    hotWords.value = cats.map((c) => c.name)
  })
})

function readHistory(): string[] {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]')
  }
  catch {
    return []
  }
}

function saveHistory(kw: string) {
  const next = [kw, ...readHistory().filter((k) => k !== kw)].slice(0, HISTORY_MAX)
  history.value = next
  localStorage.setItem(HISTORY_KEY, JSON.stringify(next))
}

function clearHistory() {
  history.value = []
  localStorage.removeItem(HISTORY_KEY)
  showToast('已清空搜索历史')
}

function onClickWord(w: string) {
  keyword.value = w // 触发防抖自动搜索
  saveHistory(w)
}
</script>

<template>
  <div class="search">
    <NavBar title="搜索" left-arrow @click-left="$router.back()" />

    <Search v-model="keyword" class="search-box" placeholder="搜索商品" />

    <!-- 初始态：历史 + 热门词（历史仅客户端渲染） -->
    <template v-if="!keyword.trim()">
      <section v-if="history.length" class="panel">
        <div class="panel-head">
          <span class="panel-title serif-title">搜索历史</span>
          <Icon name="delete-o" size="16" @click="clearHistory" />
        </div>
        <div class="chips">
          <span v-for="w in history" :key="w" class="chip" @click="onClickWord(w)">{{ w }}</span>
        </div>
      </section>

      <section v-if="hotWords.length" class="panel">
        <div class="panel-head">
          <span class="panel-title serif-title">热门搜索</span>
        </div>
        <div class="chips">
          <span v-for="w in hotWords" :key="w" class="chip" @click="onClickWord(w)">{{ w }}</span>
        </div>
      </section>
    </template>

    <!-- 结果区（List 观察页面滚动） -->
    <template v-else>
      <GoodsFilterBar v-model="sort" class="result-filter" />

      <List
        v-model:loading="loading"
        :finished="finished"
        :error="loadError"
        :finished-text="list.length ? '没有更多了' : ''"
        error-text="加载失败，点击重试"
        @load="onLoad"
      >
        <div ref="scroller">
          <Grid class="goods-grid" :column-num="2" :border="false" :gutter="8">
            <GridItem v-for="g in list" :key="g.id">
              <GoodsCard :goods="g" />
            </GridItem>
          </Grid>
        </div>
      </List>

      <Empty
        v-if="searched && finished && !loading && list.length === 0"
        description="没有找到相关商品"
      />
    </template>
  </div>
</template>

<style scoped lang="scss">
.search-box {
  position: sticky;
  top: var(--van-nav-bar-height);
  z-index: 10;
  background: var(--c-bg);
}

/* 筛选栏：吸顶叠在 NavBar + 搜索框下方（van-search 默认高 54px） */
.result-filter {
  position: sticky;
  top: calc(var(--van-nav-bar-height) + 54px);
  z-index: 10;
}

.panel {
  padding: 14px 12px 4px;
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  color: var(--c-muted);

  .panel-title {
    font-size: 13px;
    color: var(--c-ink);
  }
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.chip {
  padding: 4px 12px;
  border: 1px solid var(--c-line);
  border-radius: 14px;
  background: #fff;
  font-size: 12px;
  color: var(--c-ink);
  cursor: pointer;
}

.goods-grid {
  padding: 10px;
}
</style>
