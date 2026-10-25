<script setup lang="ts">
import { Tabbar, TabbarItem, Icon, Badge } from 'vant'

// 详情/搜索/登录是独立页，不显示底部 Tabbar
const route = useRoute()
const showTabbar = computed(() => {
  const hidden = ['product-id', 'search', 'login']
  return !hidden.includes(String(route.name))
})

const cart = useCartStore()
</script>

<template>
  <div class="layout">
    <main class="page-body" :class="{ 'has-tabbar': showTabbar }">
      <slot />
    </main>

    <Tabbar v-if="showTabbar" route safe-area-inset-bottom>
      <TabbarItem replace to="/" icon="wap-home-o">首页</TabbarItem>
      <TabbarItem replace to="/category" icon="apps-o">分类</TabbarItem>
      <TabbarItem replace to="/cart">
        <template #icon>
          <Badge v-if="cart.count" :content="cart.count" max="99">
            <Icon name="shopping-cart-o" />
          </Badge>
          <Icon v-else name="shopping-cart-o" />
        </template>
        购物车
      </TabbarItem>
      <TabbarItem replace to="/user" icon="user-o">我的</TabbarItem>
    </Tabbar>
  </div>
</template>

<style scoped lang="scss">
.page-body {
  min-height: 100vh;

  &.has-tabbar {
    padding-bottom: 70px;
  }
}
</style>
