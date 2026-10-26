// 登出：refresh 存在服务端才能被真正撤销，所以这一步必须走接口。
// HttpOnly cookie 前端删不掉（document.cookie 摸不到），只能由服务端代劳——
// 这也是它必须存在的原因：只清前端 token 的话，下次进页面会用残留的 rt 自动恢复登录。
import { defineEventHandler, deleteCookie, getCookie } from 'h3'
import { revokeRefresh } from '../../utils/tokens'

export default defineEventHandler((event) => {
  const rt = getCookie(event, 'rt')
  if (rt) {
    revokeRefresh(rt)
  }
  // deleteCookie 的 path 必须与设置时完全一致，否则删不掉（只剩个空壳 cookie）。
  // 第二条兼容早期 Path=/api/auth/refresh 的遗留 cookie
  deleteCookie(event, 'rt', { path: '/api/auth' })
  deleteCookie(event, 'rt', { path: '/api/auth/refresh' })
  deleteCookie(event, 'token', { path: '/' })
  return { ok: true }
})
