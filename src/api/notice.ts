import service from '@/utils/request'
import type { Notice, NoticeType } from '@/types/notice'

// 获取公告列表
export async function getNoticesByType(type: NoticeType) {
    const reponse = await service({
        url: `/notices/type/${type}`,
        method: 'get'
    })
    return reponse.data
}

// 获取公告详情并更新点击量
export async function getNoticeDetailAndUpdateHit(id: string) {
    try {
      const response = await service.get(`/notices/${id}`);
      return response.data; // 假设返回的是更新后的公告信息
    } catch (error) {
      console.error('获取公告详情并更新点击量时发生错误:', error);
      throw error; // 抛出错误以便上层调用捕获
    }
  };


// 发起 PUT 请求以更新某一资源的数据
export async function update(data: Notice, url: string) {
    const reponse = await service({
        headers: {
            'Content-Type': 'application/json; charset=utf-8'
        },
        url: url,
        method: 'put',
        data
    })
    return reponse.data
}

// 发起 POST 请求以添加新资源
export async function add(data: Omit<Notice, 'id'>, url: string) {
    const reponse = await service({
        url: url,
        method: 'post',
        data
    })
    return reponse.data
}

// 发起 DELETE 请求以删除某一资源
export async function del(id: string, url: string) {
    return service({
        url: url + '/' + id,
        method: 'delete'
    })
}
