import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getNoticesByType, addNoticeHit, add, update, del } from '@/api/notice'
import type { Notice, NoticeType } from '@/types/notice'

export const useNoticeStore = defineStore('notice', () => {
  // 状态定义
  const toggle = ref(false)
  const listUrl = ref('')
  const listType = ref('')
  const name = ref('')
  const title = ref('')
  const icon = ref('')
  const itemContent = ref({
    content: '',
    title: '',
    updateTime: '',
    hit: 0
  })
  const uploadFileUrl = ref(import.meta.env.VITE_BASE_URL + '/uploadFile')

  const carouselNotices = ref<Notice[]>([]) // 轮播公告
  const techNotices = ref<Notice[]>([]) // 科技热点
  const policyNotices = ref<Notice[]>([]) // 时政新闻
  const isLoading = ref(false) // 加载状态

  // 操作方法
  const setUrl = (data: any) => {
    listUrl.value = data.url
    listType.value = data.type
    icon.value = data.icon
  }

  const setTitle = (data: any) => {
    name.value = data.name
    title.value = data.title
  }

  const setContent = (data: any) => {
    itemContent.value = data
  }

  // 加载公告数据
  const loadNotices = async () => {
    try {
      isLoading.value = true
      const [carouselRes, techRes, policyRes] = await Promise.all([
        getNoticesByType('carousel'),
        getNoticesByType('technology'),
        getNoticesByType('policy')
      ])
      carouselNotices.value = carouselRes.data.data
      techNotices.value = techRes.data.data
      policyNotices.value = policyRes.data.data
    } catch (error) {
      console.error('数据加载失败:', error)
    } finally {
      isLoading.value = false
    }
  }
  // 删除公告
  const deleteNotice = async (noticeId: string) => {
    try {
      await del(noticeId, '/notices')
      loadNotices()
    } catch (error) {
      console.error('删除失败:', error)
    }
  }

  // 更新公告
  const updateNotice = async (payload: Notice) => {
    try {
      await update(payload, '/notices')
      loadNotices()
    } catch (error) {
      console.error('更新失败:', error)
    }
  }

  // 添加公告
  const addNotice = async (payload: Notice) => {
    try {
      await add(payload, '/notices')
      loadNotices()
    } catch (error) {
      console.error('添加失败:', error)
    }
  }

  return {
    carouselNotices,
    techNotices,
    policyNotices,
    isLoading,
    toggle,
    listUrl,
    listType,
    name,
    title,
    icon,
    itemContent,
    uploadFileUrl,
    setUrl,
    setTitle,
    setContent,
    loadNotices,
    deleteNotice,
    updateNotice,
    addNotice,
    persist: true
  }
})