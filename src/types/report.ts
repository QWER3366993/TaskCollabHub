export interface StatusTrendData {
    dates: string[]
    values: number[]
  }
  
  export interface ContributionData {
    names: string[]
    values: number[]
  }

  export interface StatusDataItem {
    value: number // 任务数量
    title: string // 状态名称
    color: string // 状态颜色
    lightColor: string // 浅色背景
    icon: string //图标
  }
