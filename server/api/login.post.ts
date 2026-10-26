// mock 登录接口：固定演示账号 demo / 123456
// 登录成功签发两张令牌：短命 access（响应体返回，前端写进 cookie）+ 长命 refresh（HttpOnly cookie）
import { defineEventHandler, readBody, createError, setCookie } from 'h3'
import type { LoginResult } from '#shared/types'
import { REFRESH_TTL, issueRefresh, signAccess } from '../utils/tokens'

const MOCK_ACCOUNT = { username: 'demo', password: '123456' }

export default defineEventHandler(async (event): Promise<LoginResult> => {
  const body = await readBody<{ username?: string, password?: string }>(event)
  const { username, password } = body ?? {}

  if (!username || !password) {
    throw createError({ statusCode: 400, statusMessage: '请输入账号和密码' })
  }
  if (username !== MOCK_ACCOUNT.username || password !== MOCK_ACCOUNT.password) {
    throw createError({ statusCode: 401, statusMessage: '账号或密码错误' })
  }

  const access = signAccess(1)
  const refresh = issueRefresh(1)

  // refresh cookie 只能由服务端下发（前端设 HttpOnly 无效）。
  // Path 收在 /api/auth 命名空间内：refresh 与 logout 都要能读到它——
  // 只写 /api/auth/refresh 的话登出接口带不上 cookie，就没法撤销令牌（踩过）
  setCookie(event, 'rt', refresh, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // 本地 http 设 true 会被浏览器静默丢弃
    sameSite: 'lax',
    path: '/api/auth',
    maxAge: REFRESH_TTL,
  })

  return {
    token: access,
    user: {
      id: 1,
      username,
      nickname: `拾光用户_${username}`,
      avatar: '', // 占位：页面用昵称首字符兜底渲染
    },
  }
  // 说明：access 的 60 秒有效期只在 JWT 的 exp 里生效，前端 cookie 仍按 7 天存——
  // cookie 只是容器，过期判断交给令牌本身，避免「cookie 先失效导致连 401 都发不出」
})
