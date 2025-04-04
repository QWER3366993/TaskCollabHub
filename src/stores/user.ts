import { defineStore } from 'pinia'
import { ref } from 'vue'
import { login, getInfo, fetchEmployeeByUserId, uploadAvatar, updateUserInfo, updatePassword, updateEmail, sendVerificationCode } from '@/api/user'
import { getToken, setToken, removeToken } from '@/utils/auth'
import type { User } from '@/types/user'
import type { Employee } from '@/types/team'
import { createToast } from 'mosha-vue-toastify'

export const useUserStore = defineStore('user', () => {
  const token = ref<string | null>(getToken() || '')  // 存储token
  const user = ref<User>({})  // 存储用户信息
  const employee = ref<Employee | null>(null)  // 存储员工信息
  const errorMessage = ref<string>('')  // 存储错误信息

  // 登录
  const loginUser = async (userInfo: { username: string; password: string }) => {
    const data = await login(userInfo);
    if (!data) {
      throw new Error('登录失败，未获取到有效Token');
    }
    setToken(data)
    token.value = data
    await getUserInfo(); // 获取用户信息
    if (data.error) {
      errorMessage.value = '登录失败：' + data.message
      createToast(errorMessage.value, { position: 'top-center', showIcon: true })
    }
  }

  // 获取用户信息
  const getUserInfo = async () => {
    try {
      // 获取用户信息
      const userResponse = await getInfo();
      // 更新用户信息
      user.value = userResponse;
      // 获取员工信息
      if (user.value.userId) {
        const employeeData = await fetchEmployeeByUserId(user.value.userId);
        employee.value = employeeData; // 直接存储 Employee 对象
        // 更新用户在线状态
        if (employee.value) { // 非空检查
          employee.value.online = true;
        }
      }
    } catch (error) {
      createToast('获取用户信息失败', { position: 'top-center', showIcon: true });
      throw error; // 重新抛出错误以便调用方处理
    }
  }

  // 登出
  const logout = () => {
    token.value = ''  // 清空token
    removeToken()  // 清除token
    user.value = {}  // 清空用户信息
  }

  // 更新头像
  const updateAvatar = async (avatar: File): Promise<string | undefined> => {
    try {
      const data = await uploadAvatar(avatar);
      if (data && data.avatarUrl) {
        user.value.avatar = data.avatarUrl;
        createToast('头像更新成功', { position: 'top-center', showIcon: true });
        return data.avatarUrl; // 返回头像 URL
      }
    } catch (error) {
      createToast('头像更新失败', { position: 'top-center', showIcon: true });
      throw error;
    }
    return undefined;
  };


  // 更新用户信息（支持部分或完整更新）
  const updateUser = async (userData: Partial<User>): Promise<User | null> => {
    try {
      if (!user.value) throw new Error('用户未登录');

      const updatedUser = await updateUserInfo(userData); // 调用 API
      if (updatedUser) {
        user.value = { ...user.value, ...updatedUser }; // 仅合并更新的字段
        createToast('用户信息更新成功', { position: 'top-center', showIcon: true });
        return updatedUser;
      }
      return null;
    } catch (error) {
      console.error(error);
      createToast('更新用户信息失败', { position: 'top-center', showIcon: true, type: 'danger' });
      throw error;
    }
  };

  // 更新密码
  const updateUserPassword = async (payload: { oldPassword: string; newPassword: string }) => {
    try {
      await updatePassword(payload);
    } catch (error) {
      console.error('密码更新失败:', error);
      throw error;
    }
  };

  // 更新邮箱
  const updateEmail = async (payload: {
    newEmail: string
    code: string
    password: string
  }) => {
    try {
      const response = await updateEmail(payload);
      if (response) {
        user.value.email = payload.newEmail; // 更新本地存储的邮箱
        createToast('邮箱更新成功', { position: 'top-center', showIcon: true, type: 'success' });
        return true;
      }
    } catch (error) {
      createToast('更新邮箱失败', { position: 'top-center', showIcon: true, type: 'danger' });
      throw error;
    }
  };


  // 发送验证码
  const sendEmailVerification = async (email: string) => {
    try {
      const response = await sendVerificationCode(email);
      if (response) {
        createToast('验证码发送成功', { position: 'top-center', showIcon: true, type: 'success' });
        return true;
      }
    } catch (error) {
      createToast('验证码发送失败', { position: 'top-center', showIcon: true, type: 'danger' });
    }
  }

  return {
    token,
    user,
    errorMessage,
    employee,
    loginUser,
    getUserInfo,
    logout,
    updateAvatar,
    updateUser,
    updateUserPassword,
    updateEmail,
    sendEmailVerification
  }
})

