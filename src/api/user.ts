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

// 上传头像接口
export async function uploadAvatar(avatar: File) {
  const formData = new FormData();
  formData.append('avatar', avatar);

  const response = await service.post('/user/upload-avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return response.data;
}

// 更新用户信息
export async function updateUserInfo(userInfo: Partial<User>): Promise<User> {
  const response = await service.patch('/auth/userinfo', userInfo);
  return response.data;
}

// 更新用户密码
export async function updatePassword(payload: { oldPassword: string; newPassword: string }) {
  const response = await service.patch('/auth/update-password', payload);
  return response.data;
}

// 更新邮箱
export async function updateEmail(payload: {
  newEmail: string
  code: string
  password: string
}) {
  const response = await service.put('/user/email', { payload });
  return response.data;
}

// 发送验证码
export async function sendVerificationCode(email: string) {
  const response = await service.post('/user/send-verification', { email });
  return response.data;
}
