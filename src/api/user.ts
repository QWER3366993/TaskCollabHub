import service from '@/utils/request'

import type { User, UserQueryParams } from '@/types/user'
import type { Employee } from '@/types/team'

// 获取用户列表
export const fetchUserList = async (params?: UserQueryParams): Promise<User[]> => {
  const response = await service.get('/users', { params });
  return response.data;
};

// 登录接口
export async function login(userInfo: User) {
  const response = await service.post('/auth/login', userInfo);
  return response.data;
}

// 获取用户信息接口
export const getInfo = async () => {
  const response = await service.get('/auth/userinfo');
  return response.data;
}

// 获取员工信息接口
export const fetchEmployeeByUserId = async (userId: string) => {
  const response = await service.get(`/employees/user-id/${userId}`);
  return response.data;
}

// 上传头像接口
export const uploadAvatar = async (avatar: File) => {
  const formData = new FormData();
  formData.append('avatar', avatar);

  const response = await service.post('/user/upload-avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return response.data;
}

// 添加用户
export const addUser = async (userData: Omit<User, 'userId'>): Promise<User> => {
  const response = await service.post('/users', userData);
  return response.data;
};


// 更新用户信息
export const updateUserInfo = async (userInfo: Partial<User>): Promise<User> => {
  const response = await service.patch('/auth/userinfo', userInfo);
  return response.data;
}

// 更新用户密码
export const updatePassword = async (payload: { oldPassword: string; newPassword: string }) => {
  const response = await service.patch('/auth/update-password', payload);
  return response.data;
}

// 更新邮箱
export const updateEmail = async (payload: {
  newEmail: string
  code: string
  password: string
}) => {
  const response = await service.put('/user/email', { payload });
  return response.data;
}

// 发送验证码
export const sendVerificationCode = async(email: string) => {
  const response = await service.post('/user/send-verification', { email });
  return response.data;
}

// 获取所有角色接口
export const reqAllRole = async() => {
  const response = await service.get('/roles');
  return response.data;
}

// 设置用户角色接口
export const reqSetUserRole = async (data: { userId: string; roleId: string }) => {
  const response = await service.post('/user/setRole', data);
  return response.data;
}

// 移除用户接口
export async function removeUser(data: { userId: string }) {
  const response = await service.delete('/user/remove', { data });
  return response.data;
}

// 批量删除用户接口
export const batchDeleteUser = async (userIds: string[]): Promise<void> => {
  const res = await service.post('/users/batch-delete', { userIds });
  if (res.data.success) {
    console.log('批量删除成功');
  } else {
    console.error('批量删除失败:', res.data.message);
  }
};




