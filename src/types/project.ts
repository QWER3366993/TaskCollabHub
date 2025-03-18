import type { FileItem } from './task'
// 项目基础类型
import type { Task } from './task'
export interface Project {
    id: string
    title: string
    description: string
    teamId: string  // 关联团队ID
    tasks: Task[] // 直接包含任务数组
    scheduledTime: string; // 调度时间
    deadline?: string; // 截止时间
    files?: FileItem[];
    progress: number // 进度百分比
}

export interface ProjectCreateDTO {
    title: string
    description: string
    scheduledTime: string; // 调度时间
    teamId: string
    deadline?: string; // 截止时间
}