// 已登录不该再看登录页：访问 /login 时跳回首页
export default defineNuxtRouteMiddleware(() => {
  const user = useUserStore()
  if (user.isLogged) {
    return navigateTo('/', { replace: true })
  }
})
