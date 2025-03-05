import { defineStore } from 'pinia'
import { ref } from 'vue'
import { login, getInfo } from '@/api/user'
import { getToken, setToken, removeToken } from '@/utils/auth'
import type { User } from '@/types/user'
import { createToast } from 'mosha-vue-toastify'

export const useUserStore = defineStore('user', () => {
  const token = ref<string | null>(getToken() || '')  // 存储token
  const user = ref<User>({})  // 存储用户信息
  const errorMessage = ref<string>('')  // 存储错误信息

  // 登录
  const loginUser = async (userInfo: { username: string; password: string }) => {
    const { data } = await login(userInfo)

    if (data.errno) {
      errorMessage.value = '登录失败：' + data.message
      createToast(errorMessage.value, { position: 'top-center', showIcon: true })
      return
    }

    setToken(data.token)  // 设置token
    token.value = data.token  // 更新token
  }

  // 获取用户信息
  const getUserInfo = async () => {
    const { data } = await getInfo()
    user.value = data  // 更新用户信息
  }

  // 登出
  const logout = () => {
    token.value = ''  // 清空token
    removeToken()  // 清除token
    user.value = {}  // 清空用户信息
  }

  return { token, user, errorMessage, loginUser, getUserInfo, logout }
})
