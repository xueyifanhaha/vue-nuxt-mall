# vue-nuxt-mall 开发计划

> 移动端商城练习项目（Nuxt 4）
> 依据：原项目空间「搭建nuxt vue移动端商城计划」对话确认的决策
> 更新日期：2026-10-23

## 一、技术栈（已确认并安装）

| 类别 | 选型 | 状态 |
|---|---|---|
| 框架 | Nuxt 4.5.2 + Vue 3 | ✅ 已安装 |
| UI 库 | Vant 4.10.2 | ✅ 已安装 |
| 状态管理 | Pinia 4.1.0 + @pinia/nuxt + pinia-plugin-persistedstate | ✅ 已安装 |
| Mock | mockjs 1.1.0 跑在 Nitro `server/api/` 里 | ✅ 已安装 |
| 样式 | sass-embedded + Vant 主题变量（不上 UnoCSS，减少噪音） | ✅ 已安装 |
| 移动端适配 | postcss-px-to-viewport（375 设计稿，排除 Vant） | ✅ 已配置 |

当前进度：项目骨架已就位（`package.json`、`nuxt.config.ts`、`app/app.vue`），依赖安装完成，未写任何页面/接口代码。

## 二、已确认的关键决策（来自原对话）

1. **mock 方案 = mockjs 写在 `server/api/*.ts` 里，由 Nitro 返回数据**。不走浏览器 XHR 拦截（SSR 首屏请求不经过浏览器，拦截不到）；也不用 vite-plugin-mock。好处：SSR/CSR 都能取数，顺便练 Nuxt 服务端目录。
2. **保留拦截器练习点**：虽然请求的是同源 `/api/xxx`（用不到 axios baseURL），但前端统一封装一个 `$request` composable，保留请求/响应拦截器逻辑的练习。
3. **购物车持久化用 cookie 而非 localStorage**，避免 SSR 水合不一致——这是刻意要踩的 Nuxt 典型坑。
4. 项目目录 `D:/0328/vue-nuxt-mall`（已建）。

## 三、页面结构（7 页）

```
app/pages/
  index.vue          首页（轮播、金刚区、推荐商品流）
  category.vue       分类页（左分类右商品）
  cart.vue           购物车
  user/index.vue     我的
  product/[id].vue   商品详情（SKU 弹层）
  search.vue         搜索（历史记录）
  login.vue          登录（假 token）
```

核心目录：

```
server/api/            home.ts / category.ts / product/[id].ts / cart.ts ...
                       ← 内部用 mockjs 的 Random 生成商品图/标题/价格
app/composables/       $request.ts（拦截器封装）、useApi 等
app/stores/            cart.ts、user.ts
app/layouts/           default.vue（Tabbar）
```

## 四、开发阶段（每阶段可独立验收）

1. [x] **脚手架** ✅ 已完成（依赖、nuxt.config、app.vue）
2. [x] **骨架**：Tabbar 四页路由 + `layouts/default.vue` + `app.vue` 补 `NuxtLayout`（详情/搜索/登录页隐藏 Tabbar）
3. [x] **Mock 数据层**：`server/api` 5 个接口 + mockjs 数据 + `shared/types.ts` 共享类型 + `$request` composable（含拦截器）
4. [x] **首页**：轮播 + 金刚区 + 推荐商品流（`useAsyncData` + `request`）
5. [~] **分类 + 搜索**：分类页 ✅（Sidebar + List 触底分页 + GoodsCard 复用，首页同步组件化）；搜索页待做（防抖 + 搜索历史）
6. [ ] **详情页**：SKU 选择、加入购物车（练 params 路由 + 组件通信）
7. [ ] **购物车**：Pinia + cookie 持久化、全选/结算逻辑（练习重点）
8. [ ] **登录 + 我的**：cookie 存 token、路由中间件守卫（练 Nuxt middleware）
9. [ ] **收尾**：SEO meta（`useSeoMeta`）、加载态、错误页

## 五、风险与注意

- Vant 4 与 Nuxt 4 的 SSR 兼容：遇 hydration 报错用 `<ClientOnly>` 包裹
- `nuxt prepare` 生成的 `.nuxt` 类型文件首次 `npm run dev` 时自动生成
- Git：每完成一个阶段提交一次，commit message 简洁中文（≤20 字），不自动 push
