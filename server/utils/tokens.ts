// 令牌签发与校验：手写 60 行只为看清 JWT 的三段结构
// 生产环境请用 jose / jsonwebtoken，不要自己实现密码学
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'

// 生产环境缺密钥直接抛错：静默使用公开的兜底值等于任何人都能伪造合法签名
if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET 未配置，拒绝在生产环境启动')
}
const SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-me'

// access 有效期：演示默认 60 秒（真实项目 15 分钟）。
// 短才能在看得到的几十秒里走完「过期 → 401 → 自动续期 → 重放」，便于验证。
// 可用环境变量覆盖：ACCESS_TTL=900 npm run dev
export const ACCESS_TTL = Number(process.env.ACCESS_TTL ?? 60)

// refresh 有效期 7 天
export const REFRESH_TTL = 7 * 24 * 3600

export interface AccessPayload {
  uid: number
  /** 过期时间（秒级时间戳，JWT 标准字段 exp 就是这个单位） */
  exp: number
}

const b64 = (v: string) => Buffer.from(v).toString('base64url')

/** 签发 access token：header.payload.signature 三段，点号分隔 */
export function signAccess(uid: number): string {
  const head = b64(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const body = b64(JSON.stringify({
    uid,
    exp: Math.floor(Date.now() / 1000) + ACCESS_TTL,
  }))
  const sig = createHmac('sha256', SECRET).update(`${head}.${body}`).digest('base64url')
  return `${head}.${body}.${sig}`
}

/**
 * 校验 access token：验签 + 查 exp，全程不查库（这就是 JWT「无状态」的价值）
 * 校验失败统一返回 null，由调用方决定抛什么错误码
 */
export function verifyAccess(token: string): AccessPayload | null {
  const [head, body, sig] = token.split('.')
  if (!head || !body || !sig) {
    return null
  }

  const expect = createHmac('sha256', SECRET).update(`${head}.${body}`).digest('base64url')
  const a = Buffer.from(sig)
  const b = Buffer.from(expect)
  // 定长 + 常量时间比较：普通的字符串比较会按位提前返回，泄露「猜对了几位」
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return null
  }

  let payload: AccessPayload
  try {
    payload = JSON.parse(Buffer.from(body, 'base64url').toString()) as AccessPayload
  }
  catch {
    return null
  }
  if (!payload?.uid || !payload.exp) {
    return null
  }
  if (payload.exp * 1000 < Date.now()) {
    return null
  }
  return payload
}

// refresh 白名单：JWT 撤销不了，所以要能撤销的就得存起来。
// 真实项目放 Redis；这里用内存 Map，dev 热重载会清空（已登录用户全部失效，mock 阶段可接受）
const refreshStore = new Map<string, { uid: number, exp: number }>()

/** 签发 refresh token：不透明随机串，本身不携带信息，全靠服务端查表 */
export function issueRefresh(uid: number): string {
  const token = randomBytes(32).toString('base64url')
  refreshStore.set(token, { uid, exp: Date.now() + REFRESH_TTL * 1000 })
  return token
}

/**
 * 轮换：旧 token 立刻作废、签发新的。
 * delete 这一步就是「一次性票据」的全部秘密——旧的再被使用就查不到，
 * 说明它被复制走了（正常客户端拿到新的就不会再用旧的），据此判定泄露。
 */
export function rotateRefresh(old: string): { uid: number, token: string } | null {
  const rec = refreshStore.get(old)
  if (!rec) {
    return null
  }
  refreshStore.delete(old)
  if (rec.exp < Date.now()) {
    return null
  }
  return { uid: rec.uid, token: issueRefresh(rec.uid) }
}

/** 登出/风控时主动吊销 */
export function revokeRefresh(token: string) {
  refreshStore.delete(token)
}
