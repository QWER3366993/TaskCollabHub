import { defineStore } from 'pinia'
import { ref } from 'vue'
import { login, getInfo, fetchEmployeeByUserId } from '@/api/user'
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

  return { token, user, errorMessage, employee, loginUser, getUserInfo, logout }
})
