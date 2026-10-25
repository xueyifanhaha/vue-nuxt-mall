// 需要登录的页面挂这个 middleware：未登录 → 登录页并携带回跳地址
// 用法：页面里 definePageMeta({ middleware: 'auth' })
export default defineNuxtRouteMiddleware((to) => {
  const user = useUserStore()
  if (!user.isLogged) {
    return navigateTo(`/login?redirect=${encodeURIComponent(to.fullPath)}`)
  }
})
