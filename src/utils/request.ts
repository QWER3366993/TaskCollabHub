import axios from 'axios'

import { createToast } from 'mosha-vue-toastify'

import { getToken } from '@/utils/auth'

// 统一请求和响应的类型定义

interface IResponse<T = any> {
  data: T

  status: number

  headers: any

  config: any

  request?: any
}

// 从环境变量中获取 API 基础路径
const baseURL = import.meta.env.VITE_API_BASE_URL

const service = axios.create({
  baseURL: baseURL, // 使用环境变量来设置baseURL，确保敏感信息不泄露
  timeout: 5000, // request timeout
  validateStatus: (status) => {
    // 自定义HTTP状态码的验证逻辑，以决定是否抛出错误
    return status >= 200 && status < 300
  }
})

// request拦截器
service.interceptors.request.use(
  (config) => {
    const token = getToken()
    if (token) {
      // 让每个请求携带自定义token 请根据实际情况自行修改
      config.headers['Authorization'] = 'Bearer ' + token
    }
    // 动态设置Content-Type，允许在特定请求中覆盖
    if (!config.headers['Content-Type']) {
      config.headers['Content-Type'] = 'application/json'
    }
    return config
  },
  (error) => {
    // 移除错误信息打印，改为合适的错误处理
    Promise.reject(error)
  }
)

// response 拦截器
service.interceptors.response.use(
  (response) => response,

  (error) => {
    // 对错误消息进行一层包装，避免敏感信息泄露
    const errorMessage = 'An error occurred. Please try again later.'
    createToast(errorMessage, { position: 'top-center', showIcon: true })
    // 仅在开发阶段或服务器日志中记录详细错误信息
    console.error('Error details:', error)
    return Promise.reject(error)
  }
)

export default service;