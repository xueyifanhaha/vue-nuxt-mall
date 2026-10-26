// 刷新接口：用 HttpOnly 的 refresh cookie 换一张新的 access
// 注意这里不 requireAuth——它就是用来处理「access 已经不合法」的场景
import { defineEventHandler, deleteCookie, getCookie, setCookie } from 'h3'
import { ACCESS_TTL, REFRESH_TTL, rotateRefresh, signAccess } from '../../utils/tokens'
import { authError } from '../../utils/auth'

export default defineEventHandler((event) => {
  const old = getCookie(event, 'rt')
  if (!old) {
    throw authError('NO_REFRESH')
  }

  const rotated = rotateRefresh(old)
  if (!rotated) {
    // 查不到 = 过期或被用过 → 两种都按「失效」处理，顺手清掉脏 cookie
    deleteCookie(event, 'rt', { path: '/api/auth' })
    throw authError('REFRESH_INVALID')
  }

  const token = signAccess(rotated.uid)
  const isProd = process.env.NODE_ENV === 'production'

  // 轮换：把新的 refresh 写回去，旧的已在 rotateRefresh 里作废
  setCookie(event, 'rt', rotated.token, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/api/auth',
    maxAge: REFRESH_TTL,
  })

  // access 交给前端写 cookie（与登录保持同一套：cookie 是容器，exp 才是判据）
  return { token, expiresIn: ACCESS_TTL }
})
