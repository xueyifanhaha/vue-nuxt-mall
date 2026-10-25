// 用户登录态 store：token 与用户信息均持久化到 cookie
// 选 cookie 不选 localStorage 的原因（与购物车决策一致）：
// cookie 会随请求发给服务端，SSR 阶段就能恢复登录态做拦截，刷新不闪「未登录」
import { defineStore } from 'pinia'
import type { LoginResult, UserInfo } from '#shared/types'

const SEVEN_DAYS = 60 * 60 * 24 * 7

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
  }

  function logout() {
    tokenCookie.value = null
    userCookie.value = null
  }

  return { token, userInfo, isLogged, setLogin, logout }
})
