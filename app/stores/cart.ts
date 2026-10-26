// 购物车 store：数据持久化到 cookie，key 按用户隔离（cart_${uid}）
// 沿用登录态的决策：cookie 服务端可读 → SSR 首帧就能渲染出购物车内容，无闪白
import { defineStore } from 'pinia'
import Big from 'big.js'
import type { CartItem } from '#shared/types'

const MAX_AGE = 60 * 60 * 24 * 30 // 30 天

export const useCartStore = defineStore('cart', () => {
  const user = useUserStore()

  // 内存态：渲染与计算都走它，cookie 只负责持久化
  const items = ref<CartItem[]>([])

  // cookie 名随登录态变化：未登录是 cart_0，登录后切到 cart_${uid}
  function cookieName() {
    return `cart_${user.userInfo?.id ?? 0}`
  }

  /**
   * 从当前用户的 cookie 恢复到内存态（store 初始化/SSR 与登录态变化时调用）。
   * 兼容旧结构：stock 是后加的字段，历史 cookie 里没有，读出来是 undefined——
   * 类型声明说有并不代表运行时真有，不兜底会让 Math.min(undefined, qty) 算出 NaN
   */
  function hydrate() {
    const cookie = useCookie<CartItem[] | null>(cookieName(), { maxAge: MAX_AGE })
    const raw = Array.isArray(cookie.value) ? cookie.value : []
    items.value = raw.map(i => ({ ...i, stock: i.stock ?? 999 }))
  }

  /** 内存态写回 cookie（所有变更 action 的统一出口） */
  function persist() {
    const cookie = useCookie<CartItem[] | null>(cookieName(), { maxAge: MAX_AGE })
    cookie.value = items.value
  }

  // 登录/退出自动切换到对应用户的购物车（store setup 内注册，作用域随组件卸载清理）
  watch(() => user.isLogged, () => hydrate())
  hydrate() // 初始化：SSR 首帧就有数据

  // ---------- actions（客户端事件回调里调用，useCookie 在客户端可安全使用） ----------
  /**
   * 加购：数量按库存快照限幅，返回实际入车数量与被限幅标记。
   * 数据层不弹 toast——是否提示、怎么提示交给调用方，store 才能在别的场景（下单前校验）复用
   */
  function add(item: Omit<CartItem, 'qty' | 'checked'>, qty = 1): { qty: number, limited: boolean } {
    const exist = items.value.find(i => i.skuId === item.skuId)
    const max = Math.max(0, item.stock)
    if (exist) {
      // 库存可能在上次加购后变过，以本次携带的快照为准
      exist.stock = item.stock
      const wanted = exist.qty + qty
      exist.qty = Math.min(max, wanted)
      persist()
      return { qty: exist.qty, limited: wanted > max }
    }
    const real = Math.min(max, qty)
    if (real <= 0) {
      return { qty: 0, limited: true }
    }
    items.value.push({ ...item, qty: real, checked: true })
    persist()
    return { qty: real, limited: real < qty }
  }

  function remove(skuId: number) {
    items.value = items.value.filter(i => i.skuId !== skuId)
    persist()
  }

  function setQty(skuId: number, qty: number) {
    const target = items.value.find(i => i.skuId === skuId)
    if (target) {
      // 上下限都收在 store：下限 1，上限取库存（售罄商品保留 1 件以便用户自己判断去留）
      target.qty = Math.min(Math.max(1, qty), Math.max(1, target.stock))
      persist()
    }
  }

  function toggleChecked(skuId: number) {
    const target = items.value.find(i => i.skuId === skuId)
    if (target) {
      target.checked = !target.checked
      persist()
    }
  }

  function toggleAll(checked: boolean) {
    items.value.forEach(i => (i.checked = checked))
    persist()
  }

  function clear() {
    items.value = []
    persist()
  }

  // ---------- getters ----------
  const checkedItems = computed(() => items.value.filter(i => i.checked))
  // 金额用 big.js 计算：JS 浮点下 19.9 * 3 = 59.699999999999996，直接累加会漂
  const totalPrice = computed(() =>
    Number(
      checkedItems.value.reduce(
        (sum, i) => sum.plus(new Big(i.price).times(i.qty)),
        new Big(0),
      ),
    ),
  )
  const count = computed(() => items.value.reduce((sum, i) => sum + i.qty, 0))
  const allChecked = computed(() =>
    items.value.length > 0 && items.value.every(i => i.checked),
  )

  return {
    items, hydrate,
    add, remove, setQty, toggleChecked, toggleAll, clear,
    checkedItems, totalPrice, count, allChecked,
  }
})
