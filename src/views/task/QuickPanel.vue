<!-- 快捷面板 -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useTaskStore } from '@/stores/task'
import { useTeamStore } from '@/stores/team'
import { createToast } from 'mosha-vue-toastify';
import type { Task } from '@/types/task'
import { useRouter } from 'vue-router'
import type { OperationLog } from '@/types/task'
import dayjs from 'dayjs'

// 类型定义
type RecentItem = {
    id: string
    type: 'task' | 'file' | 'discussion'
    title: string
    lastAccessed: Date
}

// 状态管理
const taskStore = useTaskStore()
const searchQuery = ref<string>('')
const teamStore = useTeamStore()
const currentUser = computed(() => teamStore.currentEmployee)
const router = useRouter()

const layoutMode = ref('grid') // 布局模式：grid/list
const recentItems = ref<Array<RecentItem>>([])

// 当前用户参与的任务（创建+负责）
const userTasks = computed(() => {
    return taskStore.tasks.filter(t =>
        t.creator === currentUser.value?.employeeId ||
        t.employeeId === currentUser.value?.employeeId
    )
})

// 待办任务计算（带类型断言）
const pendingTasks = computed(() =>
    taskStore.tasks.filter((t: Task) => t.status !== '已完成')
)

// 团队活跃统计
const teamStats = computed(() => ({
    todayTasks: taskStore.tasks.filter(t =>
        dayjs(t.scheduledTime).isSame(dayjs(), 'day')
    ).length,
    pendingCount: taskStore.tasks.filter(t =>
        t.status === '待处理').length,
    myTasks: userTasks.value.length
}))

// 最近访问记录
const loadRecentItems = async () => {
    const items = await Promise.all([
        taskStore.getRecentAccessed(),
        fileStore.getRecentFiles(),
        discussionStore.getRecentDiscussions()
    ])
    recentItems.value = items.flat()
        .sort((a, b) => b.lastAccessed - a.lastAccessed)
        .slice(0, 5)
}

const updateRecent = (item: Omit<RecentItem, 'time'>) => {
    recentItems.value = [
        { ...item, time: Date.now() },
        ...recentItems.value.filter(i => i.id !== item.id)
    ].slice(0, 5)
}

// 任务点击处理
const handleTaskClick = (task: Task) => {
    updateRecent({
        id: task.id,
        type: 'task',
        title: task.title
    })
    router.push({ name: 'taskdetail', params: { id: task.id } })
}

// 跳转详情
const goToDetail = (item: RecentItem) => {
    const routeMap = {
        task: { name: 'taskdetail', params: { id: item.id } },
        file: { name: 'filedetail', query: { fileId: item.id } },
        discussion: { name: 'discussion', params: { topicId: item.id } }
    }
    router.push(routeMap[item.type])
}

// 日期处理工具
const isTaskDueToday = (deadline?: string): boolean => {
    if (!deadline) return false
    const today = new Date().toISOString().split('T')[0]
    return deadline.startsWith(today)
}

const isTaskOverdue = (task: Task): boolean => {
    return !!task.deadline &&
        new Date(task.deadline) < new Date() &&
        task.status !== '已完成'
}

const visibleTasks = computed(() =>
    pendingTasks.value
        .filter(t => t.title.includes(searchQuery.value))
        .sort((a, b) => {
            // 按优先级排序：高 > 中 > 低
            const priorityOrder = { '高': 1, '中': 2, '低': 3 }
            return priorityOrder[a.priority] - priorityOrder[b.priority]
        })
        .slice(0, 5)
)

// 快捷操作配置
const baseActions = [
    { id: 'filter', label: '我的任务', icon: 'user', roles: ['member'] },
    { id: 'report', label: '生成日报', icon: 'document', roles: ['pm'] },
    { id: 'meeting', label: '关联会议', icon: 'calendar', roles: ['pm'] }
]

const filteredActions = computed(() =>
    baseActions.filter(action => {
        const userAuthority = currentUser.value?.authorities; // 获取当前用户的权限
        if (!userAuthority || !Array.isArray(userAuthority)) return false; // 如果权限不存在或不是数组，直接返回 false
        return userAuthority.some(authority => action.roles.includes(authority)); // 检查是否有交集
    })
);

const updateTaskStatus = async (task: Task) => {
    const originalStatus = task.status;
    try {
        // 切换状态：已完成 <-> 进行中
        const newStatus = task.status === '已完成' ? '进行中' : '已完成';

        // 动态生成操作日志的完整属性
        const newOperation: OperationLog = {
            id: crypto.randomUUID(), // 使用 UUID 生成唯一 ID
            taskId: task.id, // 当前任务 ID
            employeeId: currentUser.value?.employeeId || '', // 当前用户 ID
            time: new Date().toISOString(), // 当前时间戳
            operationType: 'status_change',
            operation: `状态变更：${originalStatus} → ${newStatus}`,
            details: {
                status: {
                    old: originalStatus,
                    new: newStatus
                }
            }
        };

        await taskStore.updateTask(task.id, {
            status: newStatus,
            operations: [...(task.operations || []), newOperation] // 添加完整的操作日志
        });
    } catch (error) {
        createToast('状态更新失败', {
            type: 'danger',
            timeout: 3000,
            position: 'top-right'
        });
        task.status = originalStatus; // 回滚状态
    }
};

// 评论点击处理（使用现有comment数据）
const handleCommentClick = (comment: Comment) => {
    updateRecent({
        id: comment.id,
        type: 'comment',
        title: `评论：${comment.content.slice(0, 15)}...`
    })
    router.push({
        name: 'taskdetail',
        params: { id: comment.taskId },
        hash: `#comment-${comment.id}`
    })
}

// 初始化加载
onMounted(async () => {
    await Promise.all([
        taskStore.getAllTasks(),
        taskStore.getTaskOverview()
    ])

    // 初始化最近访问（从操作日志获取）
    recentItems.value = taskStore.operationLogs.value
        .filter(log => log.operationType === 'view')
        .map(log => ({
            id: log.taskId,
            type: 'task',
            title: log.operation,
            time: new Date(log.time).getTime()
        }))
        .slice(0, 5)
})
</script>

<template>
    <v-container>
        <v-card class="quick-panel" width="100%">
            <!-- 顶部操作区 -->
            <div class="header">
                <v-text-field v-model="searchQuery" placeholder="搜索任务/文件..." class="search-box"
                    prepend-inner-icon="mdi-magnify"></v-text-field>
            </div>
            <!-- 布局切换 -->
            <div class="layout-control">
                <v-btn-toggle v-model="layoutMode" mandatory>
                    <v-btn value="grid" size="small">
                        <v-icon>mdi-view-grid</v-icon>
                    </v-btn>
                    <v-btn value="list" size="small">
                        <v-icon>mdi-view-list</v-icon>
                    </v-btn>
                </v-btn-toggle>
            </div>

            <!-- 统计卡片 -->
            <div class="stats-grid">
                <v-card class="stat-card">
                    <div class="stat-value">{{ teamStats.todayTasks }}</div>
                    <div class="stat-label">今日新增</div>
                </v-card>
                <v-card class="stat-card">
                    <div class="stat-value">{{ teamStats.pendingCount }}</div>
                    <div class="stat-label">逾期任务</div>
                </v-card>
            </div>

            <!-- 主内容区 -->
            <div class="main-grid" :class="layoutMode">
                <!-- 任务列 -->
                <v-card class="task-column">
                    <div class="section-header">
                        <h3>我的任务 ({{ pendingTasks.length }})</h3>
                        <v-text-field v-model="searchQuery" density="compact" prepend-inner-icon="mdi-magnify" />
                    </div>

                    <v-list lines="two">
                        <v-list-item v-for="task in pendingTasks" :key="task.id" @click="handleTaskClick(task)"
                            :class="{ 'overdue-task': task.status === '待处理' && dayjs(task.deadline).isBefore(dayjs()) }">
                            <template #prepend>
                                <v-checkbox v-model="task.status" true-value="已完成" false-value="进行中"
                                    @click.stop="taskStore.updateTask(task.id, { status: task.status === '已完成' ? '进行中' : '已完成' })" />
                            </template>

                            <v-list-item-title>{{ task.title }}</v-list-item-title>
                            <v-list-item-subtitle>
                                截止：{{ dayjs(task.deadline).format('MM/DD') }}
                                <v-chip v-if="dayjs(task.deadline).isSame(dayjs(), 'day')" size="small" color="red"
                                    class="ml-2">
                                    今日到期
                                </v-chip>
                            </v-list-item-subtitle>
                        </v-list-item>
                    </v-list>
                </v-card>

                <!-- 最近访问 -->
                <v-card class="recent-column">
                    <h3>最近活动</h3>
                    <v-list>
                        <v-list-item v-for="item in recentItems" :key="item.id"
                            @click="item.type === 'comment' ? handleCommentClick : handleTaskClick(item)">
                            <template #prepend>
                                <v-icon>
                                    {{
                                        item.type === 'task' ? 'mdi-checkbox-marked' :
                                            item.type === 'file' ? 'mdi-file' : 'mdi-comment'
                                    }}
                                </v-icon>
                            </template>
                            <v-list-item-title>{{ item.title }}</v-list-item-title>
                            <v-list-item-subtitle>
                                {{ dayjs(item.time).fromNow() }}
                            </v-list-item-subtitle>
                        </v-list-item>
                    </v-list>
                </v-card>
            </div>
        </v-card>
    </v-container>
</template>

<style scoped>
.quick-panel {
    padding: 20px;
    background: #f8fafc;
    position: relative;
}

.layout-control {
    position: absolute;
    top: 20px;
    right: 20px;
    z-index: 1;
}

.stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 16px;
    margin-bottom: 24px;
}

.stat-card {
    padding: 16px;
    text-align: center;
    background: linear-gradient(145deg, #ffffff, #f1f5f9);

    .stat-value {
        font-size: 2rem;
        font-weight: 600;
        color: #3b82f6;
    }

    .stat-label {
        color: #64748b;
        font-size: 0.875rem;
    }
}

.main-grid {
    display: grid;
    gap: 24px;

    &.grid {
        grid-template-columns: 2fr 1fr;
    }

    &.list {
        grid-template-columns: 1fr;
    }
}

.section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    border-bottom: 1px solid #e2e8f0;

    h3 {
        margin: 0;
        font-size: 1.1rem;
        color: #1e293b;
    }
}

.overdue-task {
    border-left: 4px solid #ef4444;
    background: #fff5f5;
}

.recent-column {
    .v-list-item {
        transition: background 0.2s;

        &:hover {
            background: #f1f5f9;
        }
    }
}

.header {
    display: flex;
    gap: 15px;
    margin-bottom: 20px;
}

.search-box {
    flex: 1;
}

.grid-container {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
}

.task-list {
    list-style: none;
    padding: 0;
}

.task-list li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 0;
    border-bottom: 1px solid #eee;
}

.urgent {
    color: #f56c6c;
    font-weight: 500;
}

.action-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
    gap: 15px;
}

.action-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 10px;
    border-radius: 8px;
    cursor: pointer;
    transition: background 0.3s;
}

.action-item:hover {
    background: #eef1f6;
}

@media (max-width: 768px) {
    .main-grid {
        grid-template-columns: 1fr !important;
    }

    .stats-grid {
        grid-template-columns: 1fr;
    }
}

.overdue {
    border-left: 3px solid #f56c6c;
    padding-left: 8px;
}

.deadline {
    font-size: 0.8em;
    color: #666;
    margin-left: 8px;
}

.indicators {
    display: flex;
    gap: 5px;
    margin-left: 10px;
}
</style>