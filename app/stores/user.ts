// 用户登录态 store：token 与用户信息均持久化到 cookie
// 选 cookie 不选 localStorage 的原因（与购物车决策一致）：
// cookie 会随请求发给服务端，SSR 阶段就能恢复登录态做拦截，刷新不闪「未登录」
import { defineStore } from 'pinia'
import type { LoginResult, UserInfo } from '#shared/types'

const SEVEN_DAYS = 60 * 60 * 24 * 7

// 「曾经登录过」的旁证：refresh token 在 HttpOnly cookie 里，前端读不到，
// 只能靠这个标记判断「要不要在页面加载时静默试一次续期」，避免未登录用户白打请求
const HAD_SESSION_KEY = 'had-session'

export const useUserStore = defineStore('user', () => {
  // cookie ref 放在 store setup 顶层（Nuxt 上下文内），后续 action 在事件回调里
  // 改的是同一个 ref，不再二次调用 useCookie，规避上下文丢失问题
  const tokenCookie = useCookie<string | null>('token', { maxAge: SEVEN_DAYS })
  const userCookie = useCookie<UserInfo | null>('user', { maxAge: SEVEN_DAYS })

  // computed 包装成只读视图：外部只能通过 setLogin/logout 变更，写入路径单一
  const token = computed(() => tokenCookie.value ?? null)
  const userInfo = computed(() => userCookie.value ?? null)
  const isLogged = computed(() => Boolean(tokenCookie.value))

  function setLogin(data: LoginResult) {
    tokenCookie.value = data.token
    userCookie.value = data.user
    if (import.meta.client) {
      localStorage.setItem(HAD_SESSION_KEY, '1')
    }
  }

  /** 续期成功后写回新 token：cookie 只是容器，真正的有效期在 JWT 的 exp 里 */
  function setToken(next: string) {
    tokenCookie.value = next
  }

  /** 退出：清本地 + 请服务端撤销 refresh（HttpOnly cookie 前端删不掉） */
  async function logout() {
    tokenCookie.value = null
    userCookie.value = null
    if (import.meta.client) {
      localStorage.removeItem(HAD_SESSION_KEY)
    }
    // 直接用 $fetch 而非 request 封装：logout 自己不该走 401 续期逻辑，
    // 也避免 store ↔ request 之间循环引用
    await $fetch('/api/auth/logout', { method: 'POST' }).catch(() => {})
  }

  return { token, userInfo, isLogged, setLogin, setToken, logout }
})
