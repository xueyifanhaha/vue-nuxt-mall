<script setup lang="ts">
import { NavBar, Cell, CellGroup, Grid, GridItem, Icon, Button, showConfirmDialog, showToast } from 'vant'

useSeoMeta({ title: '我的 - 拾光百货' })

// 页面级路由守卫：未登录会被 app/middleware/auth.ts 拦去登录页并带回跳地址
definePageMeta({ middleware: 'auth' })

// auth middleware 已保证走到这里必然已登录，页面只渲染登录态
const user = useUserStore()

const menuGrids = [
  { icon: 'star-o', label: '收藏' },
  { icon: 'underway-o', label: '浏览足迹' },
  { icon: 'service-o', label: '联系客服' },
]

const menuCells = [
  { icon: 'location-o', label: '收货地址' },
  { icon: 'setting-o', label: '设置' },
]

function onPlaceholder(label: string) {
  showToast(`${label}：功能开发中`)
}

async function onLogout() {
  // Vant 确认弹窗：确认 resolve / 取消 reject，取消走 catch 直接返回
  try {
    await showConfirmDialog({ title: '退出登录', message: '确定要退出当前账号吗？' })
  }
  catch {
    return
  }
  user.logout()
  showToast('已退出登录')
  navigateTo('/', { replace: true })
}
</script>

<template>
  <div class="user-page">
    <NavBar title="我的" />

    <!-- 用户信息头 -->
    <header class="profile-head">
      <div class="avatar">
        <img v-if="user.userInfo?.avatar" :src="user.userInfo.avatar" alt="头像">
        <span v-else class="avatar-fallback">{{ user.userInfo?.nickname?.slice(0, 1) }}</span>
      </div>
      <div class="meta">
        <p class="nickname">{{ user.userInfo?.nickname }}</p>
        <p class="username">账号：{{ user.userInfo?.username }}</p>
      </div>
      <Button size="small" plain round class="logout-btn" @click="onLogout">退出</Button>
    </header>

    <!-- 订单入口 -->
    <CellGroup inset class="orders">
      <Cell title="我的订单" is-link value="查看全部订单" @click="onPlaceholder('我的订单')" />
      <div class="order-entries">
        <div v-for="o in ['待付款', '待发货', '待收货', '评价']" :key="o" class="entry" @click="onPlaceholder(o)">
          <Icon name="orders-o" size="22" />
          <span>{{ o }}</span>
        </div>
      </div>
    </CellGroup>

    <!-- 功能格子 -->
    <CellGroup inset class="block">
      <Grid :column-num="4" :border="false" class="funcs">
        <GridItem v-for="m in menuGrids" :key="m.label" @click="onPlaceholder(m.label)">
          <template #icon>
            <Icon :name="m.icon" size="24" color="var(--c-primary)" />
          </template>
          <template #text>
            <span class="grid-text">{{ m.label }}</span>
          </template>
        </GridItem>
      </Grid>
    </CellGroup>

    <!-- 其它入口 -->
    <CellGroup inset class="block">
      <Cell
        v-for="c in menuCells"
        :key="c.label"
        :title="c.label"
        :icon="c.icon"
        is-link
        @click="onPlaceholder(c.label)"
      />
    </CellGroup>
  </div>
</template>

<style scoped lang="scss">
.user-page {
  min-height: 100dvh;
  padding-bottom: calc(50px + env(safe-area-inset-bottom)); /* Tabbar 高度兜底 */
  background: var(--c-bg);
}

.profile-head {
  display: flex;
  align-items: center;
  gap: 14px;
  margin: 12px 16px;
  padding: 18px 16px;
  border-radius: 14px;
  background: linear-gradient(135deg, var(--c-accent), var(--c-primary));
  box-shadow: var(--shadow-card);

  .avatar {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 56px;
    height: 56px;
    border-radius: 50%;
    overflow: hidden;
    background: rgba(255, 255, 255, 0.9);

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .avatar-fallback {
      font-size: 24px;
      font-weight: 700;
      color: var(--c-primary-deep);
    }
  }

  .meta {
    flex: 1;
    color: #fff;

    .nickname {
      margin: 0;
      font-size: 17px;
      font-weight: 600;
    }

    .username {
      margin: 6px 0 0;
      font-size: 12px;
      opacity: 0.85;
    }
  }

  .logout-btn {
    color: #fff;
    border-color: rgba(255, 255, 255, 0.8);
    /* Vant plain 按钮默认白底，会吃掉白字——改半透明白底保证可读 */
    background: rgba(255, 255, 255, 0.18);
  }
}

.orders {
  .order-entries {
    display: flex;
    padding: 10px 0 16px;

    .entry {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      flex: 1;
      font-size: 12px;
      color: var(--c-ink);
    }
  }
}

.block {
  margin-top: 12px;
}

.funcs {
  :deep(.van-grid-item__content) {
    background: transparent;
  }

  .grid-text {
    font-size: 12px;
    color: var(--c-ink);
  }
}

:deep(.van-cell) {
  color: var(--c-ink);
}
</style>
