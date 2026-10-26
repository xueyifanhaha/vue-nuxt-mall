<script setup lang="ts">
import { NavBar, Icon, Swipe, SwipeItem, Grid, GridItem, Empty } from 'vant'
import type { HomeData } from '#shared/types'

useSeoMeta({ title: '首页 - 拾光百货' })

const { data, error, status } = await useAsyncData('home', () =>
  request<HomeData>('/api/home'),
)

function toSearch() {
  navigateTo('/search')
}
</script>

<template>
  <div class="home">
    <NavBar title="拾光百货">
      <template #right>
        <Icon name="search" size="18" @click="toSearch" />
      </template>
    </NavBar>

    <!-- 加载中 / 出错（首屏由 SSR 直出真数据，pending 只出现在 refresh/重试） -->
    <GoodsSkeleton v-if="status === 'pending'" :count="4" />
    <Empty v-else-if="error" description="加载失败，请刷新重试" />

    <template v-else-if="data">
      <!-- 轮播 -->
      <Swipe class="banner" :autoplay="3000" indicator-color="#fff">
        <SwipeItem v-for="b in data.banners" :key="b.id">
          <img class="banner-img" :src="b.image" :alt="b.title" />
        </SwipeItem>
      </Swipe>

      <!-- 金刚区：icon 插槽放图 + text 属性渲染文字（默认插槽会吞掉 text） -->
      <Grid class="nav-grid" :column-num="6" :border="false">
        <GridItem v-for="n in data.navIcons" :key="n.id" :text="n.name">
          <template #icon>
            <img class="nav-icon" :src="n.image" :alt="n.name" />
          </template>
        </GridItem>
      </Grid>

      <!-- 推荐商品（卡片实现统一收敛到 GoodsCard 组件） -->
      <h2 class="section-title serif-title">推荐商品</h2>
      <Grid class="goods-grid" :column-num="2" :border="false" :gutter="8">
        <GridItem v-for="g in data.recommend" :key="g.id">
          <GoodsCard :goods="g" />
        </GridItem>
      </Grid>
    </template>
  </div>
</template>

<style scoped lang="scss">
/* 轮播：卡片化，与页面留出呼吸感 */
.banner {
  height: 150px;
  margin: 10px 10px 0;
  border-radius: 10px;
  overflow: hidden;

  :deep(.van-swipe__indicator--active) {
    background-color: var(--c-accent);
  }

  .banner-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

/* 金刚区：圆形图标 + 细描边 */
.nav-grid {
  margin-top: 12px;

  :deep(.van-grid-item__text) {
    margin-top: 6px;
    color: var(--c-ink);
    font-size: 11px;
    line-height: 1.2;
  }

  .nav-icon {
    display: block;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: 1px solid var(--c-line);
  }
}

/* 衬线栏目标题 + 铜金菱形饰：全站记忆点 */
.section-title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin: 22px 0 10px;
  font-size: 16px;
  color: var(--c-ink);

  &::before,
  &::after {
    content: '';
    width: 5px;
    height: 5px;
    background: var(--c-accent);
    transform: rotate(45deg);
  }
}

.goods-grid {
  padding: 0 10px;
}
</style>
