// mock 登录接口：固定演示账号 demo / 123456
// 真实项目这里由服务端校验密码哈希并签发 JWT，本项目只做流程闭环
import { defineEventHandler, readBody, createError } from 'h3'
import type { LoginResult } from '#shared/types'

const MOCK_ACCOUNT = { username: 'demo', password: '123456' }

export default defineEventHandler(async (event): Promise<LoginResult> => {
  const body = await readBody<{ username?: string; password?: string }>(event)
  const { username, password } = body ?? {}

  if (!username || !password) {
    throw createError({ statusCode: 400, statusMessage: '请输入账号和密码' })
  }
  if (username !== MOCK_ACCOUNT.username || password !== MOCK_ACCOUNT.password) {
    throw createError({ statusCode: 401, statusMessage: '账号或密码错误' })
  }

  // mock token：时间戳拼串仅作演示，无签名不可伪造安全边界
  const token = `mock-token-${username}-${Date.now().toString(36)}`

  return {
    token,
    user: {
      id: 1,
      username,
      nickname: `拾光用户_${username}`,
      avatar: '', // 占位：页面用昵称首字符兜底渲染
    },
  }
})
