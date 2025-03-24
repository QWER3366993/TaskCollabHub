import service from '@/utils/request'

import type { User } from '@/types/user'
import type { Employee } from '@/types/team'

// 登录接口
export function login(data: User) {
  return service({
    url: '/auth/login',
    method: 'post',
    data: data
  })
}

// 获取用户信息接口
export async function getInfo() {
  return service({
    url: '/auth/userinfo',
    method: 'get'
  })
}

// 获取员工信息接口
export async function fetchEmployeeInfo(userId: string): Promise<Employee> {
  return service({
    url: `/employees?userId=${userId}`,
    method: 'get',
  });
}