// 受保护接口示例：第一个需要 access token 的接口，也是「401 → 续期 → 重放」的触发点
// 页面拿它显示会话有效期，access 一过期就会当场触发刷新链路
import { defineEventHandler } from 'h3'
import { requireAuth } from '../../utils/auth'

export default defineEventHandler((event) => {
  const { uid, exp } = requireAuth(event)
  return {
    uid,
    exp,
    ttl: Math.max(0, exp - Math.floor(Date.now() / 1000)),
  }
})
