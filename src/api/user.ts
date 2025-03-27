import service from '@/utils/request'

import type { User } from '@/types/user'
import type { Employee } from '@/types/team'

// 登录接口
export async function login(userInfo: User) {
  const response = await service.post('/auth/login', userInfo);
  return response.data;
}

// 获取用户信息接口
export async function getInfo() {
  const response = await service.get('/auth/userinfo');
  return response.data;
}

// 获取员工信息接口
export async function fetchEmployeeByUserId(userId: string) {
  const response = await service.get(`/employees/${userId}`);
  return response.data;
}