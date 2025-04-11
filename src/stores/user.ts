import { defineStore } from 'pinia'
import { ref } from 'vue'
import { login, fetchUserList, getInfo, fetchEmployeeByUserId, batchDeleteUser, reqAllRole, uploadAvatar, addUser, updateUserInfo, updatePassword, updateEmail, sendVerificationCode } from '@/api/user'
import { getToken, setToken, removeToken } from '@/utils/auth'
import type { User, UserQueryParams, Role } from '@/types/user'
import type { Employee } from '@/types/team'
import { createToast } from 'mosha-vue-toastify'

interface UserStoreType {
  token: string
  user: User
  errorMessage: string
}

export const useUserStore = defineStore('user', () => {
  const token = ref<string | null>(getToken() || '')  // 存储token
  const users = ref<User[]>([])
  const user = ref<User>({})  // 存储用户信息
  const employee = ref<Employee | null>(null)  // 存储员工信息
  const errorMessage = ref<string>('')  // 存储错误信息
  const loading = ref(false)
  const currentRoles = ref<Role[]>([])

  // 登录
  const loginUser = async (userInfo: { username: string; password: string }) => {
    try {
      const data = await login(userInfo)
      if (data.error) {
        createToast('登录失败：' + data.message, {
          position: 'top-center',
          showIcon: true
        })
        return
      }
      setToken(data.token)
      token.value = data.token
    } catch (error) {
      console.error('Login error:', error)
    }
  }

  // 获取用户列表
  const getUserList = async (params?: UserQueryParams): Promise<User[]> => {
    try {
      loading.value = true
      const data = await fetchUserList(params)
      users.value = data;
      return data
    } catch (error) {
      errorMessage.value = '获取用户列表失败';
      createToast(errorMessage.value, { position: 'top-center', showIcon: true, type: 'danger' });
      throw error;
    } finally {
      loading.value = false
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

  // 添加用户
  const createUser = async (userData: Omit<User, 'userId'>) => {
    try {
      const newUser = await addUser(userData)
      users.value = [newUser, ...users.value]
      createToast('用户创建成功', { type: 'success' })
      return newUser
    } catch (error) {
      createToast('用户创建失败', { type: 'danger' })
      throw error
    }
  }

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

  // 批量删除方法
  const batchRemoveUsers = async (userIds: string[]) => {
    try {
      await batchDeleteUser(userIds)
      users.value = users.value.filter(u => !userIds.includes(u.userId!))
      createToast(`已删除${userIds.length}个用户`, { type: 'success' })
    } catch (error) {
      createToast('删除失败', { type: 'danger' })
      throw error
    }
  }

  // 获取角色列表
  const loadRoles = async () => {
    try {
      currentRoles.value = await reqAllRole()
    } catch (error) {
      createToast('获取角色列表失败', { type: 'danger' })
    }
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
    users,
    user,
    loading,
    currentRoles,
    errorMessage,
    employee,
    loginUser,
    getUserList,
    getUserInfo,
    createUser,
    loadRoles,
    batchRemoveUsers,
    logout,
    updateAvatar,
    updateUser,
    updateUserPassword,
    updateEmail,
    sendEmailVerification
  }
})

