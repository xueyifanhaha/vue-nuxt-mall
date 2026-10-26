// 统一请求封装：拦截器 + 401 静默续期重放 + 错误统一 toast + payload 缓存配方
// 用法：await request<T>('/api/xxx')；登录/刷新等自带 401 语义的接口用 plainRequest
import { showToast } from 'vant'
import type { FetchContext, FetchError } from 'ofetch'
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

// 401 兜底：清登录态 → /login 带回跳。仅客户端执行——
// SSR 阶段的 401 交给页面级 middleware/error 处理（fetch 上下文里 navigateTo 行为不同）
function kickToLogin() {
  const user = useUserStore()
  void user.logout()
  const { fullPath } = useRoute()
  // query 交给 navigateTo 序列化，不要自己 encodeURIComponent：
  // 它内部会再编一次，双重编码后 /search?kw=手机 会变成 /search%3Fkw%3D... 跳 404
  navigateTo({
    path: '/login',
    query: fullPath.startsWith('/login') ? {} : { redirect: fullPath },
  })
}

// 请求拦截器：附加登录态（token cookie 由 user store 写入）
function onRequest({ options }: FetchContext) {
  const token = useCookie<string | null>('token')
  if (token.value) {
    const headers = new Headers(options.headers as HeadersInit | undefined)
    headers.set('Authorization', `Bearer ${token.value}`)
    options.headers = headers
  }
}

// 错误统一 toast：仅客户端（SSR 端没有 Vant 弹层实例）。
// 这里只负责"提示"，不做重试——ofetch 会丢弃钩子的返回值，重试必须放在实例外面
function onResponseError({ request: req, response }: FetchContext) {
  if (!import.meta.client) {
    return
  }
  // 刷新接口的失败由 ensureToken 的调用方统一提示，这里跳过避免弹两次
  if (String(req).includes('/api/auth/refresh')) {
    return
  }
  const msg
    = (response?._data as { statusMessage?: string } | undefined)?.statusMessage
      ?? `请求失败（${response?.status ?? 'network'}）`
  showToast(msg)
}

const baseFetch = $fetch.create({ onRequest, onResponseError })

/** 登录、刷新等自带 401 语义的接口用：不做任何续期与重放 */
export const plainRequest = baseFetch

// —— 静默续期 ——
// 模块级单例锁（不是组件内 ref）：并发 401 时只有第一个真正发刷新请求，
// 其余直接 await 同一个 Promise。Promise 可被无限次 await，
// 5 个 .then 回调排成一条队列由引擎维护——「等待队列」不用自己写。
let refreshing: Promise<string> | null = null

export function ensureToken(): Promise<string> {
  if (refreshing) {
    return refreshing
  }
  const task = plainRequest<{ token: string }>('/api/auth/refresh', { method: 'POST' })
    .then((r) => {
      useUserStore().setToken(r.token)
      return r.token
    })
    .finally(() => {
      // 成败都要释放：只写 then 的话，失败一次锁就永久卡在坏 Promise 上，
      // 之后所有请求挂死，用户只能刷新页面才能恢复
      refreshing = null
    })
  refreshing = task
  return task
}

/**
 * 业务请求实例：401 → 静默续期 → 用同一份参数重放一次。
 * 为什么用 Proxy 而不是 onResponseError 里重放：ofetch 会丢弃钩子返回值、
 * 之后照样抛错，调用方拿不到重放的结果。包在调用链外层才能"把重放结果当成原结果"。
 * Proxy 同时保住了 $Fetch 的泛型签名，页面照旧 request<T>(url)。
 */
export const request = new Proxy(baseFetch, {
  apply(target, thisArg, args) {
    return (async () => {
      try {
        return await Reflect.apply(target, thisArg, args)
      }
      catch (err) {
        const status = (err as { response?: { status?: number } })?.response?.status
        // 只在客户端续期：SSR 阶段写不了 cookie，交给页面级 middleware 处理
        if (status !== 401 || !import.meta.client) {
          throw err
        }
        try {
          await ensureToken()
        }
        catch {
          showToast('登录已失效，请重新登录')
          kickToLogin()
          throw err
        }
        // 重放走 plainRequest（不重试），天然不会二次刷新，省掉 _retried 标记；
        // 重放时 onRequest 会读到刚写入的新 token
        return await Reflect.apply(plainRequest, thisArg, args)
      }
    })()
  },
}) as typeof baseFetch
