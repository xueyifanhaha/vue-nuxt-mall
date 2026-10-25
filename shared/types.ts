// 前后端共享的 API 类型定义（server 与 pages 通过 #shared/types 引用）

export interface GoodsItem {
  id: number
  title: string
  image: string
  price: number
  originPrice?: number
  sales: number
  categoryId: number
  /** 上架时间（ISO 字符串），供「上新」排序 */
  createdAt: string
}

export interface Banner {
  id: number
  title: string
  image: string
}

export interface NavIcon {
  id: number
  name: string
  image: string
}

export interface HomeData {
  banners: Banner[]
  navIcons: NavIcon[]
  recommend: GoodsItem[]
}

export interface Category {
  id: number
  name: string
}

export interface PageResult<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

export interface Sku {
  id: number
  title: string
  price: number
  stock: number
  specs: Record<string, string>
}

export interface ProductDetail extends GoodsItem {
  images: string[]
  description: string
  specNames: string[]
  skus: Sku[]
  params: { key: string; value: string }[]
}

export interface UserInfo {
  id: number
  username: string
  nickname: string
  avatar: string
}

export interface LoginResult {
  token: string
  user: UserInfo
}
