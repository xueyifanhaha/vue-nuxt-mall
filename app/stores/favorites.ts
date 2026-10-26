// 收藏 store：只存商品 id（不存整个商品对象，cookie 体积可控）
// cookie 名按用户隔离（fav_${uid}），与 cart_${uid} 保持同一套规则——换账号不会串收藏
import { defineStore } from 'pinia'

const MAX_AGE = 60 * 60 * 24 * 30 // 30 天

export const useFavoritesStore = defineStore('favorites', () => {
  const user = useUserStore()

  const favIds = ref<number[]>([])

  function cookieName() {
    return `fav_${user.userInfo?.id ?? 0}`
  }

  /** 从 cookie 恢复（旧数据里可能混入脏值，读的时候顺手过滤一遍） */
  function hydrate() {
    const cookie = useCookie<number[] | null>(cookieName(), { maxAge: MAX_AGE })
    favIds.value = Array.isArray(cookie.value)
      ? cookie.value.filter(n => typeof n === 'number')
      : []
  }

  function persist() {
    const cookie = useCookie<number[] | null>(cookieName(), { maxAge: MAX_AGE })
    cookie.value = favIds.value
  }

  // 登录/退出切换对应用户的收藏
  watch(() => user.isLogged, () => hydrate())
  hydrate()

  function has(id: number): boolean {
    return favIds.value.includes(id)
  }

  /** 切换收藏，返回切换后的状态（true=已收藏）。toast 交给调用方，store 不碰 UI */
  function toggle(id: number): boolean {
    const i = favIds.value.indexOf(id)
    if (i >= 0) {
      favIds.value.splice(i, 1)
    }
    else {
      favIds.value.unshift(id) // 新的排在前面，将来收藏列表可直接倒序渲染
    }
    persist()
    return i < 0
  }

  const count = computed(() => favIds.value.length)

  return { favIds, has, toggle, count, hydrate }
})
