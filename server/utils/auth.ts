// 鉴权入口：受保护接口第一行调用 requireAuth(event)，失败统一 401
import { createError, getCookie, getHeader } from 'h3'
import type { H3Event } from 'h3'
import { verifyAccess } from './tokens'
import type { AccessPayload } from './tokens'

// 401 的两种语义必须分开，前端据此决定「续期」还是「踢登录」：
// - 没带/带错凭证 → NO_TOKEN / TOKEN_EXPIRED（可尝试用 refresh 换新）
// - refresh 也不认 → REFRESH_INVALID（只能重新登录）
const AUTH_ERRORS = {
  NO_TOKEN: '登录已失效，请重新登录',
  TOKEN_EXPIRED: '登录已过期',
  NO_REFRESH: '登录已失效，请重新登录',
  REFRESH_INVALID: '登录已失效，请重新登录',
} as const

export type AuthErrorCode = keyof typeof AUTH_ERRORS

/** 构造 401：statusMessage 给用户看，data.code 给前端判断用 */
export function authError(code: AuthErrorCode) {
  return createError({
    statusCode: 401,
    statusMessage: AUTH_ERRORS[code],
    data: { code },
  })
}

/**
 * 取出并校验 access token，返回载荷。
 * 两个来源都要认：
 * - Authorization: Bearer —— 客户端业务请求（header 不会被浏览器自动携带，天然免疫 CSRF）
 * - cookie token —— SSR 首屏渲染时服务端自己发起的请求
 */
export function requireAuth(event: H3Event): AccessPayload {
  const header = getHeader(event, 'authorization')
  const fromHeader = header?.startsWith('Bearer ') ? header.slice(7) : null
  const fromCookie = getCookie(event, 'token') ?? null
  const token = fromHeader ?? fromCookie

  if (!token) {
    throw authError('NO_TOKEN')
  }
  const payload = verifyAccess(token)
  if (!payload) {
    // 过期与伪造不区分：对前端来说都该走「刷新一次试试」
    throw authError('TOKEN_EXPIRED')
  }
  return payload
}
