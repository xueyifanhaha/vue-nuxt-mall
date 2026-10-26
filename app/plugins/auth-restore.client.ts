// 会话恢复：access token 失效但 refresh 还在时，页面一加载就静默换新
// 触发场景：关掉页面超过 60 秒再回来——token cookie 还在（7 天）但 JWT 已过期，
// isLogged 仍是 true，可实际上任何受保护接口都会 401，靠这里提前补上
export default defineNuxtPlugin(() => {
  const user = useUserStore()

  // 从没登录过：HttpOnly 里大概率也没有 refresh，白打一次请求没意义
  if (!localStorage.getItem('had-session')) {
    return
  }

  // 已有有效 token 时也可能已过期，但那种情况交给拦截器的 401 分支即可，
  // 这里只处理「本地连 token 都没有」的彻底失效
  if (user.isLogged) {
    return
  }

  // 前端读不到 refresh cookie（HttpOnly），只能试一次——成功就静默恢复，失败就忘了它
  ensureToken().catch(() => {
    localStorage.removeItem('had-session')
  })
})
