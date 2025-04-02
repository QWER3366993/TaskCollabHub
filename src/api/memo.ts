import type { Memo } from '@/types/memo'
import service from '@/utils/request'

// 获取所有备忘录
export const getMemos = async (): Promise<Memo[]> => {
  const response = await service.get('/memos')
  // 确保返回的是一个数组
  if (!Array.isArray(response.data)) {
    console.error('接口返回异常数据格式:', response.data);
    return [];
  }
  return response.data
}

// 创建备忘录
export const createMemo = async (memo: Memo): Promise<Memo> => {
  const response = await service.post('/memos', memo)
  return response.data
}

// 更新备忘录
export const updateMemo = async (memo: Memo): Promise<Memo> => {
  const response = await service.put(`${'/memos'}/${memo.id}`, memo)
  return response.data
}

// 删除备忘录
export const deleteMemo = async (id: string): Promise<void> => {
  await service.delete(`${'/memos'}/${id}`)
}