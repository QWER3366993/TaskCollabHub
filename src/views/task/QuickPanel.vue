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

// 最近访问类型定义
type RecentItem = {
    id: string
    type: 'task' | 'file' | 'comment'
    title: string
    time: number
    taskId?: string  // 添加关联任务ID
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

// 智能提醒
const upcomingDeadlines = computed(() => {
    return pendingTasks.value
        .filter(t => t.deadline && !isTaskOverdue(t))
        .sort((a, b) => dayjs(a.deadline).diff(dayjs(b.deadline)))
        .slice(0, 3) // 仅显示最近3个
})

// 团队活跃统计
const teamStats = computed(() => ({
    todayTasks: taskStore.tasks.filter(t =>
        dayjs(t.scheduledTime).isSame(dayjs(), 'day')  // 使用创建时间统计今日新增
    ).length,
    overdueCount: taskStore.tasks.filter(t =>
        t.deadline &&
        dayjs(t.deadline).isBefore(dayjs()) &&
        t.status !== '已完成'  // 直接计算逾期任务
    ).length,
    myTasks: userTasks.value.length
}))

// 计算属性获取最近活动
const recentActivities = computed(() => {
    // 添加类型校验和空数组回退
    const logs = (taskStore.operationLogs || []) as OperationLog[]
    return logs
        .filter(log => ['status_change', 'view'].includes(log.operationType))
        .sort((a, b) => dayjs(b.time).diff(dayjs(a.time)))
        .slice(0, 5)
})

// 计算属性获取最近访问
const recentVisits = computed(() => {
    return taskStore.recentVisits
        .sort((a, b) => dayjs(b.time).diff(dayjs(a.time)))
        .slice(0, 5);
});


const updateRecent = (item: Omit<RecentItem, 'time'>) => {
    const existingIndex = recentItems.value.findIndex(i => i.id === item.id);
    // 如果已存在则更新时间
    if (existingIndex > -1) {
        recentItems.value[existingIndex].time = Date.now();
    } else {
        recentItems.value.unshift({
            ...item,
            time: Date.now()
        });
    }
    // 保持最多5条记录
    if (recentItems.value.length > 5) {
        recentItems.value = recentItems.value
            .sort((a, b) => b.time - a.time)
            .slice(0, 5);
    }
}

// 任务点击处理
const handleTaskClick = (taskOrId: Task | string) => {
    const task = typeof taskOrId === 'string'
        ? taskStore.tasks.find(t => t.id === taskOrId)
        : taskOrId;
    if (!task) return;
    updateRecent({
        id: task.id,
        type: 'task',
        title: task.title
    });
    router.push({ name: 'taskdetail', params: { id: task.id } });
};


const isTaskOverdue = (task: Task): boolean => {
    return !!task.deadline &&
        new Date(task.deadline) < new Date() &&
        task.status !== '已完成'
}

// 当前用户的所有任务（包含已完成）
const currentUserTasks = computed(() => {
    const userId = currentUser.value?.employeeId
    return taskStore.tasks.filter(t =>
        t.creator === userId ||
        t.employeeId === userId
    )
})

// 当前用户的待办任务（未完成）
const pendingTasks = computed(() => {
    return currentUserTasks.value.filter(t => t.status !== '已完成')
})

const visibleTasks = computed(() => {
    return pendingTasks.value
        .filter(t => t.title.includes(searchQuery.value))
        .sort((a, b) => {
            // 按优先级排序：高 > 中 > 低
            const priorityOrder = { '高': 1, '中': 2, '低': 3 }
            return priorityOrder[a.priority] - priorityOrder[b.priority]
        })
        .slice(0, 5)
})


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

const toggleTaskStatus = async (task: Task) => {
    const originalStatus = task.status;
    try {
        // 切换状态：已完成 <-> 进行中
        const newStatus = task.status === '已完成' ? '进行中' : '已完成';
        await taskStore.updateTask(task.id, { status: newStatus })
        await taskStore.getAllTasks(); // 新增刷新列表操作
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

const handleLogClick = (log: OperationLog) => {
    const task = taskStore.tasks.find(t => t.id === log.taskId);
    if (task) {
        router.push({
            name: 'taskdetail',
            params: { id: log.taskId },
            hash: log.operationType === 'status_change' ? '#history' : ''
        });
    }
};

// 实现快捷操作栏
const handleQuickAction = (actionId: string) => {
    const actions = {
        filter: () => router.push({ name: 'MyTasks' }),
        report: async () => {
            try {
                // await taskStore.generateReport()
                createToast('日报已生成', { type: 'success' })
            } catch {
                createToast('生成失败', { type: 'danger' })
            }
        },
        meeting: () => router.push({
            name: 'ScheduleMeeting',
            query: { taskIds: visibleTasks.value.map(t => t.id) }
        })
    }
    actions[actionId as keyof typeof actions]?.()
}

// 初始化加载
onMounted(async () => {
    await Promise.all([
        taskStore.getAllTasks(),
        taskStore.getTaskOverview(),
        taskStore.getOperationLogs()
    ])

    // 初始化最近访问（从操作日志获取）
    recentItems.value = taskStore.operationLogs
        .filter((log: OperationLog) => log.operationType === 'view')
        .map(log => {
            const task = taskStore.tasks.find(t => t.id === log.taskId);
            return {
                id: log.taskId,
                type: 'task' as const,
                title: task?.title || '未知任务',
                time: new Date(log.time).getTime()
            };
        })
        .slice(0, 5);
    console.log('操作日志数据:', taskStore.operationLogs);

})

</script>

<template>
    <v-container>
        <v-card class="quick-panel" width="100%">
            <!-- 顶部操作区 -->
            <div class="header">
                <v-text-field v-model="searchQuery" placeholder="搜索任务/文件..." class="search-box"
                    prepend-inner-icon="search"></v-text-field>
            </div>
            <!-- 布局切换 -->
            <div class="layout-control">
                <v-btn-toggle v-model="layoutMode" mandatory>
                    <v-btn value="grid" size="small">
                        <v-icon>grid_view</v-icon>
                    </v-btn>
                    <v-btn value="list" size="small">
                        <v-icon>table_rows_narrow</v-icon>
                    </v-btn>
                </v-btn-toggle>
            </div>
            <div>
                <!-- 添加快捷操作栏 -->
                <v-speed-dial v-if="filteredActions.length" class="quick-actions">
                    <template v-slot:activator>
                        <v-btn fab color="primary">
                            <v-icon>home</v-icon>
                        </v-btn>
                    </template>
                    <v-btn v-for="action in filteredActions" :key="action.id" fab small
                        @click="handleQuickAction(action.id)">
                        <v-icon>{{ action.icon }}</v-icon>
                    </v-btn>
                </v-speed-dial>
            </div>
            <!-- 统计卡片 -->
            <div class="stats-grid">
                <v-card class="stat-card">
                    <div class="stat-value">{{ teamStats.todayTasks }}</div>
                    <div class="stat-label">今日新增</div>
                </v-card>
                <v-card class="stat-card">
                    <div class="stat-value">{{ teamStats.overdueCount }}</div>
                    <div class="stat-label">逾期任务</div>
                </v-card>
            </div>

            <!-- 主内容区 -->
            <div class="main-grid" :class="layoutMode">
                <!-- 任务列 -->
                <v-card class="task-column">
                    <div class="section-header">
                        <h3>我的任务 ({{ pendingTasks.length }})</h3>
                    </div>

                    <!-- 修改任务列表模板 -->
                    <v-list lines="two">
                        <v-list-item v-for="task in visibleTasks" :key="task.id" @click.exclude="handleTaskClick(task)">
                            <template #prepend>
                                <v-checkbox :model-value="task.status === '已完成'" @click.stop
                                    @change="toggleTaskStatus(task)" color="primary" class="mr-2" />
                            </template>

                            <v-list-item-title class="font-weight-medium">
                                {{ task.title }}
                                <v-chip v-if="task.priority === '高'" small color="red" class="ml-2">
                                    紧急
                                </v-chip>
                            </v-list-item-title>

                            <v-list-item-subtitle>
                                <div class="d-flex align-center mt-1">
                                    <v-icon class="mr-1">pending_actions</v-icon>
                                    {{ dayjs(task.deadline).format('MM/DD') }}
                                    <v-chip v-if="isTaskOverdue(task)" small color="error" class="ml-2">
                                        逾期
                                    </v-chip>
                                    <v-chip v-else-if="dayjs(task.deadline).isSame(dayjs(), 'day')" small
                                        color="warning" class="ml-2">
                                        今日到期
                                    </v-chip>
                                </div>
                            </v-list-item-subtitle>
                        </v-list-item>
                    </v-list>
                </v-card>

                <!-- 最近访问 -->
                <v-card class="recent-column">
                    <h3>最近活动</h3>
                    <v-list>
                        <v-list-item v-for="log in recentActivities" :key="log.id" @click="handleLogClick(log)">
                            <template #prepend>
                                <v-icon :color="log.operationType === 'status_change' ? 'primary' : 'grey'">
                                    {{ log.operationType === 'status_change' ? 'mdi-update' : 'mdi-eye' }}
                                </v-icon>
                            </template>
                            <v-list-item-title>
                                {{ log.operation }}
                                <div class="text-caption text-grey">
                                    {{ dayjs(log.time).fromNow() }}
                                </div>
                            </v-list-item-title>
                        </v-list-item>
                    </v-list>
                </v-card>

                <!-- 最近访问 -->
                <v-card class="recent-column mt-4">
                    <h3>最近访问</h3>
                    <v-list>
                        <v-list-item v-for="visit in recentVisits" :key="visit.id" @click="handleTaskClick(visit.id)">
                            <template #prepend>
                                <v-icon color="info">mdi-clock</v-icon>
                            </template>
                            <v-list-item-title>
                                {{ visit.title }}
                                <div class="text-caption text-grey">
                                    {{ dayjs(visit.time).fromNow() }}
                                </div>
                            </v-list-item-title>
                        </v-list-item>
                    </v-list>
                </v-card>
                <v-card class="mt-4">
                    <!-- 添加智能提醒展示 -->
                    <div class="upcoming-alert">
                        <v-alert v-if="upcomingDeadlines.length" border="start" color="grey" elevation="2">
                            <template v-slot:title>
                                <div class="d-flex align-center">
                                    <v-icon color="warning" class="mr-2">alarm</v-icon>
                                    即将到期任务 ({{ upcomingDeadlines.length }})
                                </div>
                            </template>
                            <v-list density="compact">
                                <v-list-item v-for="task in upcomingDeadlines" :key="task.id" :title="task.title"
                                    :subtitle="`剩余时间: ${dayjs(task.deadline).diff(dayjs(), 'day')}天`">
                                    <template v-slot:prepend>
                                        <v-icon color="warning">hourglass_top</v-icon>
                                    </template>
                                </v-list-item>
                            </v-list>
                        </v-alert>
                    </div>
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