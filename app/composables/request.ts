// 统一请求封装：拦截器 + 401 踢回登录 + 错误统一 toast + payload 缓存配方
// 用法：await request<T>('/api/xxx')；登录等自带 401 语义的接口用 plainRequest
import { showToast } from 'vant'
import type { FetchError } from 'ofetch'
import type { NuxtApp } from '#app'

/** 提取可读的错误信息（页面 catch 里也用它） */
export function useApiError(err: unknown): string {
  const e = err as FetchError<{ statusMessage?: string }>
  return e?.data?.statusMessage || e?.message || '请求失败'
}

/**
 * payload 缓存配方：客户端导航回访同 key 直接命中，0 请求。
 * Nuxt 默认的 getCachedData 只在 SSR 水合阶段读 payload（isHydrating 闸门），这里拆掉限制。
 * 纪律：① 同一 key 的多处调用必须共用同一份函数（选项一致性要求）；
 *      ② key 必须覆盖全部请求参数（带分页/排序的接口要把参数拼进 key）。
 * 用法：useAsyncData(key, handler, { getCachedData })
 */
export function getCachedData<T = unknown>(key: string, nuxtApp: NuxtApp): T | undefined {
  return nuxtApp.payload.data[key] as T | undefined
}

// 401 踢回登录：清登录态 → /login 带回跳。仅客户端执行——
// SSR 阶段的 401 交给页面级 middleware/error 处理（fetch 上下文里 navigateTo 行为不同）
function kickToLogin() {
  useUserStore().logout()
  const { fullPath } = useRoute()
  navigateTo({
    path: '/login',
    query: fullPath.startsWith('/login') ? {} : { redirect: encodeURIComponent(fullPath) },
  })
}

function createRequest(opts: { handle401: boolean }) {
  return $fetch.create({
    // 请求拦截器：附加登录态（token cookie 由 user store 写入）
    onRequest({ options }) {
      const token = useCookie<string | null>('token')
      if (token.value) {
        const headers = new Headers(options.headers as HeadersInit | undefined)
        headers.set('Authorization', `Bearer ${token.value}`)
        options.headers = headers
      }
    },
    onResponseError({ response }) {
      // 统一错误 toast 仅客户端：SSR 端没有 Vant 弹层实例
      if (import.meta.client) {
        const msg
          = (response._data as { statusMessage?: string } | undefined)?.statusMessage
            ?? `请求失败（${response.status}）`
        showToast(msg)
      }
      // 401 = 登录态失效（token 过期/伪造）：统一踢回登录。
      // 登录接口的 401 是「账号密码错误」业务失败，走 plainRequest 豁免
      if (opts.handle401 && import.meta.client && response.status === 401) {
        kickToLogin()
      }
    },
  })
}

/** 业务请求实例：401 踢回登录 */
export const request = createRequest({ handle401: true })

/** 登录等自带 401 语义的接口用：保留统一 toast，不触发踢回登录 */
export const plainRequest = createRequest({ handle401: false })
