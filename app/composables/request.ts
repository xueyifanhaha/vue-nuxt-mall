// 统一请求封装（保留拦截器练习点）
// 用法：await request<HomeData>('/api/home')
import type { FetchError } from 'ofetch'

export const request = $fetch.create({
  // 请求拦截器：附加登录态（登录阶段会写入 token cookie）
  onRequest({ options }) {
    const token = useCookie<string | null>('token')
    if (token.value) {
      const headers = new Headers(options.headers as HeadersInit | undefined)
      headers.set('Authorization', `Bearer ${token.value}`)
      options.headers = headers
    }
  },
  // 响应拦截器：后续接口若包一层 { code, data }，在这里统一拆包
  onResponse({ response }) {},
  // 响应错误统一处理
  onResponseError({ response }) {
    console.error(`[API Error] ${response.status}`, response._data)
  },
})

// 提取可读的错误信息
export function useApiError(err: unknown): string {
  const e = err as FetchError<{ statusMessage?: string }>
  return e?.data?.statusMessage || e?.message || '请求失败'
}
