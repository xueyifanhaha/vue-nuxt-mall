<script setup lang="ts">
import { NavBar, Checkbox, Button, Stepper, SwipeCell, Empty, showToast, showConfirmDialog } from 'vant'

useSeoMeta({ title: '购物车 - 拾光百货' })

const user = useUserStore()
const cart = useCartStore()

function goLogin() {
  navigateTo('/login?redirect=/cart')
}

function goShopping() {
  navigateTo('/')
}

function onDelete(skuId: number) {
  cart.remove(skuId)
  showToast('已删除')
}

async function onRemoveChecked() {
  if (!cart.checkedItems.length) {
    showToast('请先选择商品')
    return
  }
  // checkedItems 取值即快照，remove 重建 items 数组不影响本次遍历
  const count = cart.checkedItems.length
  cart.checkedItems.forEach(i => cart.remove(i.skuId))
  showToast(`已删除 ${count} 件商品`)
}

async function onClear() {
  try {
    await showConfirmDialog({ title: '清空购物车', message: '将移除全部商品，确定吗？' })
  }
  catch {
    return // 取消是 reject，不是 resolve false
  }
  cart.clear()
  showToast('已清空')
}

function onSettle() {
  if (!cart.checkedItems.length) {
    showToast('请先选择商品')
    return
  }
  showToast(`结算 ${cart.checkedItems.length} 件商品（订单流程开发中）`)
}

function formatPrice(n: number): string {
  return n.toFixed(2).replace(/\.00$/, '')
}
</script>

<template>
  <div class="cart">
    <NavBar title="购物车" />

    <!-- 态一：未登录 → 引导登录（与 auth 守卫的 302 拦截对照：本页可浏览，操作时才拦） -->
    <div
      v-if="!user.isLogged"
      class="state-login"
    >
      <Empty
        image="search"
        description="登录后同步你的购物车"
      >
        <Button
          round
          type="primary"
          class="login-btn"
          @click="goLogin"
        >
          去登录
        </Button>
      </Empty>
    </div>

    <!-- 态二：已登录但空车 -->
    <Empty
      v-else-if="!cart.items.length"
      description="购物车还是空的"
    >
      <Button
        round
        type="primary"
        class="login-btn"
        @click="goShopping"
      >
        去逛逛
      </Button>
    </Empty>

    <!-- 态三：购物车列表 -->
    <template v-else>
      <div class="list-tools">
        <button
          class="tool-btn"
          @click="onRemoveChecked"
        >
          删除选中
        </button>
        <span class="tool-divider" />
        <button
          class="tool-btn"
          @click="onClear"
        >
          清空购物车
        </button>
      </div>
      <!-- 注意：行内 Checkbox 不能包 CheckboxGroup——组会接管选中态，没绑 v-model 时永远点不动 -->
      <div class="list">
        <SwipeCell
          v-for="item in cart.items"
          :key="item.skuId"
        >
          <div class="cart-item">
            <Checkbox
              :model-value="item.checked"
              checked-color="var(--c-primary)"
              @update:model-value="cart.toggleChecked(item.skuId)"
            />
            <img
              class="thumb"
              :src="item.image"
              :alt="item.title"
              loading="lazy"
            >
            <div class="info">
              <p class="title">
                {{ item.title }}
              </p>
              <p class="specs">
                <template v-if="Object.keys(item.specs).length">
                  <span
                    v-for="(v, k) in item.specs"
                    :key="k"
                  >{{ k }}: {{ v }}</span>
                </template>
                <span v-else>标准</span>
              </p>
              <div class="row">
                <span class="price"><i>¥</i>{{ formatPrice(item.price) }}</span>
                <Stepper
                  :model-value="item.qty"
                  integer
                  :min="1"
                  :max="99"
                  button-size="24px"
                  @update:model-value="(v: number) => cart.setQty(item.skuId, v)"
                />
              </div>
            </div>
          </div>
          <template #right>
            <Button
              square
              type="danger"
              text="删除"
              class="del-btn"
              @click="onDelete(item.skuId)"
            />
          </template>
        </SwipeCell>
      </div>

      <!-- 底部结算栏：fixed 让位于 Tabbar（50px）+ 安全区 -->
      <div class="settle-bar">
        <Checkbox
          :model-value="cart.allChecked"
          checked-color="var(--c-primary)"
          @update:model-value="cart.toggleAll"
        >
          全选
        </Checkbox>
        <div class="total">
          <span>合计：</span>
          <strong class="total-price"><i>¥</i>{{ formatPrice(cart.totalPrice) }}</strong>
        </div>
        <Button
          round
          type="primary"
          class="settle-btn"
          @click="onSettle"
        >
          去结算<template v-if="cart.checkedItems.length">
            ({{ cart.checkedItems.length }})
          </template>
        </Button>
      </div>
    </template>
  </div>
</template>

<style scoped lang="scss">
.cart {
  min-height: 100dvh;
  padding-bottom: calc(130px + env(safe-area-inset-bottom)); /* 结算栏 62 + Tabbar 50 + 余量 */
  background: var(--c-bg);
}

.state-login,
.cart :deep(.van-empty) {
  padding-top: 80px;
}

.login-btn {
  padding: 0 32px;
}

.list-tools {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 10px;
  padding: 10px 12px 0;

  .tool-btn {
    border: none;
    background: none;
    font-size: 12px;
    color: var(--c-muted);
    cursor: pointer;
  }

  .tool-divider {
    width: 1px;
    height: 10px;
    background: var(--c-line);
  }
}

.list {
  display: block; /* 列表容器若默认 flex 会撑乱 SwipeCell 布局 */
  padding: 12px 12px 0;
}

.cart-item {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
  padding: 12px;
  border-radius: 12px;
  background: var(--c-card);
  box-shadow: var(--shadow-card);

  .thumb {
    width: 84px;
    height: 84px;
    border-radius: 8px;
    flex-shrink: 0;
    object-fit: cover;
  }

  .info {
    flex: 1;
    min-width: 0;

    .title {
      margin: 0;
      font-size: 14px;
      color: var(--c-ink);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .specs {
      display: flex;
      gap: 10px;
      margin: 6px 0 0;
      font-size: 12px;
      color: var(--c-muted);
    }

    .row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 10px;
    }
  }

  .price {
    color: var(--c-price);
    font-weight: 700;
    font-size: 16px;

    i {
      font-style: normal;
      font-size: 12px;
    }
  }
}

.del-btn {
  height: 100%;
}

.settle-bar {
  position: fixed;
  right: 0;
  bottom: calc(50px + env(safe-area-inset-bottom)); /* Tabbar 之上 */
  left: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  background: var(--c-card);
  border-top: 1px solid var(--c-line);

  .total {
    flex: 1;
    text-align: right;
    font-size: 13px;
    color: var(--c-ink);
  }

  .total-price {
    color: var(--c-price);
    font-size: 18px;

    i {
      font-style: normal;
      font-size: 12px;
    }
  }

  .settle-btn {
    padding: 0 22px;
  }
}
</style>
