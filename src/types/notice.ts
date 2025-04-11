export interface Notice {
  noticeId: string;
  title: string
  type: NoticeType
  coverImage?: string
  url?: string
  createdAt: string
  content: string
  summary?: string
  hit: number
}

// 扩展分类类型
export type NoticeType =
  'carousel'     // 轮播公告
  | 'technology'  // 科技热点 
  | 'policy'      // 政策法规
  | 'other'       // 其他公告