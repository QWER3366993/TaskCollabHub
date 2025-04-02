
export interface Memo {
    id?: string
    title: string
    content: string
    category: string
    completed: boolean
    createdAt: string
    attachments: File[]
  }