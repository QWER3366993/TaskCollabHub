
export interface Memo {
    memoId?: string
    title: string
    content: string
    category: string
    completed: boolean
    createdAt: string
    attachments: File[]
  }