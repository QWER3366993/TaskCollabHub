import service from '@/utils/request'

import type { User } from '@/types/user'

export function login(data: User) {
  return service({
    url: '/auth/login',

    method: 'post',

    data: data
  })
}

export async function getInfo() {
  return service({
    url: 'auth/userinfo',

    method: 'get'
  })
}
