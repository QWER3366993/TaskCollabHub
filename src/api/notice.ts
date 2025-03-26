import service from '@/utils/request'
import type { Notice, NoticeType } from '@/types/notice'

// 获取公告列表
export async function getNoticesByType(type: NoticeType) {
    return service({
        url: `/notices/${type}`,
        method: 'get'
    })
}

// 获取公告详情
export async function getNoticeDetail(id: string) {
    return service({
        url: `/notice/${id}`,
        method: 'get'
    })
}

// 发起 PUT 请求以更新某一资源的点击数
export async function addNoticeHit(id: string) {
    return service({
      url: `/notices/${id}/hit`,
      method: 'put'
    })
  }


// 发起 PUT 请求以更新某一资源的数据
export async function update(data: Notice, url: string) {
    return service({
        headers: {
            'Content-Type': 'application/json; charset=utf-8'
        },
        url: url,
        method: 'put',
        data
    })
}

// 发起 POST 请求以添加新资源
export async function add(data: Omit<Notice, 'id'>, url: string) {
    return service({
        url: url,
        method: 'post',
        data
    })
}

// 发起 DELETE 请求以删除某一资源
export async function del(id: string, url: string) {
    return service({
        url: url + '/' + id,
        method: 'delete'
    })
}
