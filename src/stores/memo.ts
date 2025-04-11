import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Memo } from '@/types/memo'
import { getMemos, createMemo, updateMemo, deleteMemo } from '@/api/memo'

export const useMemoStore = defineStore('memo', () => {
  // 储存备忘录数据
  const memos = ref<Memo[]>([])

  // 加载备忘录
  const loadMemos = async () => {
    try {
      const data = await getMemos()
      memos.value = data
    } catch (error) {
      console.error('加载备忘录失败', error)
    }
  }

  // 添加备忘录
  const addMemo = async (memo: Memo) => {
    try {
      const newMemo = await createMemo(memo)
      memos.value.push(newMemo)
    } catch (error) {
      console.error('添加备忘录失败', error)
    }
  }

  // 更新备忘录
  const updateMemoInternal = async (memo: Memo) => {
    try {
      const updatedMemo = await updateMemo(memo)
      const index = memos.value.findIndex(item => item.memoId === memo.memoId)
      if (index !== -1) {
        memos.value[index] = updatedMemo
      }
    } catch (error) {
      console.error('更新备忘录失败', error)
    }
  }

  // 删除备忘录
  const deleteMemoInternal = async (id: string) => {
    try {
      await deleteMemo(id)
      memos.value = memos.value.filter(memo => memo.memoId !== id)
    } catch (error) {
      console.error('删除备忘录失败', error)
    }
  }

  return {
    memos,
    loadMemos,
    addMemo,
    updateMemo: updateMemoInternal, // 返回时映射为 updateMemo
    deleteMemo: deleteMemoInternal 

  }
})
