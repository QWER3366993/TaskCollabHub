export interface User {
  userId?: string

  username?: string

  password?: string

  phone?: string

  email?: string
  // 用户头像
  avatar?: string
  // 用户的权限
  authorities?: string[]
}

// 用户类型过滤参数
export interface UserQueryParams {
  keyword?: string
  page?: number
  pageSize?: number
  role?: string
}

// 角色类型定义
export interface Role {
  roleId: string
  roleName: string
}