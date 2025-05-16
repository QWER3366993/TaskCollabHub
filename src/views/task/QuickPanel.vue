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
import { useUserStore } from '@/stores/user';

// 最近访问类型定义
type RecentItem = {
    id: string
    type: 'task' | 'file' | 'comment'
    title: string
    time: number
    taskId?: string  // 添加关联任务ID
}

// 状态管理
const userStore = useUserStore()
const taskStore = useTaskStore()
const searchQuery = ref<string>('')
const teamStore = useTeamStore()
const currentEmployee = computed(() => teamStore.currentEmployee)
const router = useRouter()
const recentLogs = ref<Array<OperationLog>>([]);
const layoutMode = ref('grid') // 布局模式：grid/list
const recentItems = ref<Array<RecentItem>>([])


// 计算属性获取待办任务
const pendingTasks = computed(() => {
    return userTasks.value.filter(t => t.status !== '已完成')
})

// 待办任务到期智能提醒
const upcomingDeadlines = computed(() => {
    return pendingTasks.value
        .filter(t => t.deadline && !isTaskOverdue(t))
        .sort((a, b) => dayjs(a.deadline).diff(dayjs(b.deadline)))
        .slice(0, 3) // 仅显示最近3个
})

// 团队活跃统计
const teamStats = computed(() => ({
    // 今日新增：统计当天创建的任务
    todayTasks: taskStore.tasks.filter(t =>
        dayjs(t.scheduledTime).isSame(dayjs(), 'day')  // 使用创建时间统计今日新增
    ).length,
    // 逾期任务：精确计算未完成的过期任务
    overdueCount: taskStore.tasks.filter(t => {
        if (!t.deadline || t.status === '已完成') return false;
        // 精确到分钟的时间比较
        const now = dayjs();
        const deadline = dayjs(t.deadline);
        // 包含当日23:59:59前的任务不算逾期
        return deadline.isBefore(now.endOf('day'));
    }).length,
    myTasks: userTasks.value.length,
    weeklyTasks: taskStore.tasks.filter(t =>
        t.deadline &&
        dayjs(t.deadline).isAfter(dayjs()) &&
        dayjs(t.deadline).isBefore(dayjs().add(7, 'day')) &&
        t.status !== '已完成'
    ).length
}))

// 计算属性获取最近活动
const recentActivities = computed(() => {
    return taskStore.tasks
        .flatMap(task => task.operations || [])  // 获取所有任务的日志
        .filter(log => ['status_change', 'view'].includes(log.operationType))
        .sort((a, b) => dayjs(b.time).diff(dayjs(a.time)))  // 按时间降序排序
        .slice(0, 5);
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
        ? taskStore.tasks.find(t => t.taskId === taskOrId)
        : taskOrId;
    if (!task) return;
    updateRecent({
        id: task.taskId,
        type: 'task',
        title: task.title
    });
    if (task.projectId) {
        router.push({
            name: 'ProjectTaskDetail',
            params: {
                projectId: task.projectId,
                taskId: task.taskId
            }
        })
    } else {
        router.push({
            name: 'IndependentTaskDetail',
            params: {
                taskId: task.taskId
            }
        });
    }
};


const isTaskOverdue = (task: Task): boolean => {
    return !!task.deadline &&
        new Date(task.deadline) < new Date() &&
        task.status !== '已完成'
}



// 当前用户参与的任务（创建+负责）
const userTasks = computed(() => {
    // 使用可选链获取 employeeId
    const employeeId = userStore.employee?.employeeId;
    // 空值保护直接返回，不打印错误
    if (!employeeId) return [];
    // 过滤出当前用户参与的任务
    const filteredTasks = taskStore.tasks.filter(t =>
        t.employeeId === employeeId
    );
    // 添加日志来查看返回的任务
    // console.log('当前用户参与的任务:', filteredTasks);
    return filteredTasks;
});


const visibleTasks = computed(() => {
    // 添加空值保护
    const validTasks = pendingTasks.value.filter(t =>
        t?.title?.toLowerCase().includes(searchQuery.value.toLowerCase())
    );

    return validTasks.sort((a, b) => {
        const priorityOrder = { '高': 1, '中': 2, '低': 3 };
        return (priorityOrder[a.priority] || 4) - (priorityOrder[b.priority] || 4);
    }).slice(0, 5);
});

// 任务状态切换
const toggleTaskStatus = async (task: Task) => {
    const originalStatus = task.status;
    try {
        const newStatus = task.status === '已完成' ? '进行中' : '已完成';
        const newOperation: OperationLog = {
            id: crypto.randomUUID(),
            taskId: task.taskId,
            employeeId: currentEmployee.value?.employeeId || '',
            time: new Date().toISOString(),
            operationType: 'status_change',
            operation: `状态变更：${originalStatus} → ${newStatus}`,
            details: {
                status: { old: originalStatus, new: newStatus }
            }
        };

        // 直接更新任务状态 & 添加日志
        task.status = newStatus;
        task.operations = [...(task.operations || []), newOperation];
        await taskStore.updateTask(task.taskId, { status: newStatus, operations: task.operations });
        task.completedTime = new Date().toISOString();  // 设置任务完成时间
    } catch (error) {
        createToast('状态更新失败', { type: 'danger', timeout: 3000 });
        task.status = originalStatus; // 回滚状态
    }
};

const handleLogClick = (log: OperationLog) => {
    const task = taskStore.tasks.find(t => t.taskId === log.taskId);
    if (task) {
        router.push({
            name: 'taskdetail',
            params: { id: log.taskId },
            hash: log.operationType === 'status_change' ? '#history' : ''
        });
    }
};

// 计算剩余时间
const formatRemainingTime = (deadline: string | undefined): string => {
    if (!deadline) return '无截止日期';
    const diff = dayjs(deadline).diff(dayjs(), 'days');
    if (diff > 0) {
        return `${diff} 天`;
    } else if (diff === 0) {
        return '今天';
    } else {
        return '已逾期';
    }
};

// 获取紧急程度颜色
const getUrgencyColor = (task: Task): string => {
    if (!task.deadline) return 'grey'; // 无截止日期时返回灰色
    const diff = dayjs(task.deadline).diff(dayjs(), 'days');
    if (diff <= 0) return 'error'; // 已逾期
    if (diff <= 3) return 'warning'; // 3天内到期
    return 'success'; // 超过3天
};

// 计算任务截止日期的进度百分比
const getDeadlineProgress = (task: Task): number => {
    if (!task.deadline) return 0; // 如果没有截止日期，默认返回0%
    const now = dayjs();
    const deadline = dayjs(task.deadline);
    const start = dayjs(task.scheduledTime || now); // 使用创建时间或当前时间作为起点
    if (start.isAfter(deadline)) return 100; // 如果起点晚于截止日期，返回100%

    const totalDuration = deadline.diff(start, 'day'); // 总时长（天）
    const elapsedDuration = now.diff(start, 'day'); // 已历时长（天）
    return Math.min((elapsedDuration / totalDuration) * 100, 100); // 计算进度并限制在0-100之间
};

onMounted(async () => {
    await userStore.getUserInfo();
    // 再加载其他依赖用户信息的资源
    await Promise.all([
        taskStore.getAllTasks(),
    ]);
    // 初始化最近访问
    recentItems.value = taskStore.recentVisits.map(visit => ({
        id: visit.id,
        type: 'task',
        title: visit.title,
        time: Number(visit.time)
    }));
});

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
            <h2>团队活跃</h2>
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

                <v-card class="stat-card">
                    <div class="stat-value">{{ teamStats.weeklyTasks }}</div>
                    <div class="stat-label">本周应完成</div>
                </v-card>
            </div>


            <!-- 主内容区 -->
            <div class="main-grid" :class="layoutMode">
                <!-- 任务列 -->
                <v-card class="task-column">
                    <div class="section-header">
                        <h3>我的任务 ({{ userTasks.length }})</h3>
                    </div>
                    <template v-if="visibleTasks.length === 0">
                        <v-alert type="info" class="ma-4 text-center" variant="outlined" elevation="2">
                            <v-icon size="24" class="mr-2" color="blue">sentiment_satisfied</v-icon>
                            <strong>暂无任务</strong>，可以稍作休息 ☕
                        </v-alert>
                    </template>
                    <!-- 修改任务列表模板 -->
                    <v-list lines="two">
                        <v-list-item v-for="task in visibleTasks" :key="task.taskId"
                            @click.exclude="handleTaskClick(task)" :class="{ 'overdue-task': isTaskOverdue(task) }">
                            <template #prepend>
                                <v-checkbox :model-value="task.status === '已完成'" @click.stop
                                    @change="toggleTaskStatus(task)" color="primary" class="mr-2" />
                            </template>

                            <v-list-item-title class="font-weight-medium">
                                <v-chip v-if="task.priority === '高'" small color="red" class="ml-2">
                                    紧急
                                </v-chip>
                                {{ task.title }}
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
                    <h3>任务变更</h3>
                    <v-list>
                        <div v-if="recentActivities.length > 0" class="item-list">
                            <v-list-item v-for="log in recentActivities" :key="log.id" @click="handleLogClick(log)">
                                <template #prepend>
                                    <v-icon :color="log.operationType === 'status_change' ? 'blue' : 'brown'">
                                        {{ log.operationType === 'status_change' ? 'update' : 'visibility' }}
                                    </v-icon>
                                </template>
                                <v-list-item-title>
                                    {{ log.operation }}
                                    <div class="text-caption text-grey">
                                        {{ dayjs(log.time).fromNow() }}
                                    </div>
                                </v-list-item-title>
                            </v-list-item>
                        </div>
                        <div v-else class="empty-state">
                            <span>暂无最近变更</span>
                        </div>
                    </v-list>
                </v-card>

                <!-- 最近访问 -->
                <v-card class="recent-column mt-4">
                    <h3>最近访问</h3>
                    <v-list>
                        <div v-if="recentVisits.length > 0" class="item-list">
                            <v-list-item v-for="visit in recentVisits" :key="visit.id"
                                @click="handleTaskClick(visit.id)">
                                <template #prepend>
                                    <v-icon color="info">clock</v-icon>
                                </template>
                                <v-list-item-title>
                                    {{ visit.title }}
                                    <div class="text-caption text-grey">
                                        {{ dayjs(visit.time).fromNow() }}
                                    </div>
                                </v-list-item-title>
                            </v-list-item>
                        </div>
                        <div v-else class="empty-state">
                            <span>暂无最近访问</span>
                        </div>
                    </v-list>
                </v-card>
                <v-card class="mt-4">
                    <!-- 添加智能提醒展示 -->
                    <div class="upcoming-alert">
                        <v-alert v-if="upcomingDeadlines.length" border="start" :color="getUrgencyColor(task)"
                            elevation="4" v-for="task in upcomingDeadlines" :key="task.taskId" class="task-alert">

                            <div class="d-flex align-center">
                                <v-icon class="mr-2">alarm</v-icon>
                                <div class="flex-grow-1">
                                    <div class="font-weight-medium task-title">{{ task.title }}</div>
                                    <div class="text-caption">
                                        剩余时间: {{ formatRemainingTime(task.deadline) }}
                                        <v-progress-linear :model-value="getDeadlineProgress(task)" height="4"
                                            :color="getUrgencyColor(task)" class="mt-2 task-progress-bar">
                                        </v-progress-linear>
                                    </div>
                                </div>
                                <v-btn variant="text" @click="handleTaskClick(task)" size="small" class="view-btn">
                                    查看
                                </v-btn>
                            </div>
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
    background: linear-gradient(145deg, #ffffff, #cce4fe);
    border-radius: 12px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);

    /* 样式调整 */
    transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.stat-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
}

.stat-value {
    font-size: 2rem;
    font-weight: 600;
    color: #3b82f6;
}

.stat-label {
    color: #64748b;
    font-size: 0.875rem;
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

/* 添加空状态样式 */
.empty-state {
    color: #999;
    text-align: center;
    font-size: 15px;
    padding: 10px;
    border: 1px dashed #565c2b;
    border-radius: 8px;
    margin-top: 10px;
}

.view-btn {
    font-size: 0.85rem;
    color: #6d9eec;
    transition: color 0.3s ease;
}

.view-btn:hover {
    color: #2563eb;
}
</style>