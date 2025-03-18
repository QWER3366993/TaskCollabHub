export interface User {
  userId?: string

  username?: string

  password?: string

  name?: string

  phone?: string

  email?: string
  // 用户头像
  avatar?: string
  // 用户的权限
  authorities?: string[]
}
