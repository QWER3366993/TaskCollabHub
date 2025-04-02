<script setup lang="ts">
import { ref, watch, computed, onMounted, onBeforeUnmount } from 'vue'
import * as echarts from 'echarts'
import { useTheme } from 'vuetify'
import { useUserStore } from '@/stores/user'
import { useTaskStore } from '@/stores/task'
import { useTeamStore } from '@/stores/team'
import type { StatusDataItem } from '@/types/report'
import dayjs from 'dayjs';

const theme = useTheme()
const userStore = useUserStore()
const taskStore = useTaskStore()
const teamStore = useTeamStore()

const sortDirection = ref(-1) // 默认降序

// 统计任务的不同状态数据
const statusData = computed<StatusDataItem[]>(() => taskStore.statusData)
const projects = computed(() => taskStore.projects)

// 图表引用
const priorityChart = ref(null)
const statusTrendChart = ref(null)
const contributionChart = ref(null)
let priorityInstance: echarts.ECharts | null = null;
let statusTrendInstance: echarts.ECharts | null = null;
let contributionInstance: echarts.ECharts | null = null;

// 计算属性
const sortedProjects = computed(() => {
  return [...projects.value].sort((a, b) =>
    sortDirection.value * (b.progress - a.progress)
  )
})

// 计算进度颜色
const getProgressColor = (progress: number): string => {
  if (progress >= 90) return 'success';
  if (progress >= 70) return 'warning';
  return 'error';
}

const formatDate = (dateString: string): string => {
  return dayjs(dateString).format('YYYY-MM-DD');
}

// 定义导出类型
type ExportType = 'excel' | 'pdf';

const handleExport = (type: ExportType) => {
  console.log(`Exporting as ${type}...`);
  // 实际应实现导出逻辑
};


// 定义 timeRange 和 timeOptions
const timeRange = ref('month') // 默认值为 "month"
const timeOptions = ref([
  { value: 'day', text: '每日' },
  { value: 'week', text: '每周' },
  { value: 'month', text: '每月' },
  { value: 'year', text: '每年' }
]) // 定义统计周期选项

const getPieColor = (index: number): string => {
  const colors = ['#FF5252', '#FFC107', '#4CAF50'];
  return colors[index % colors.length];
};
// 图表初始化
const initCharts = () => {
  // 优先级饼图初始化
  priorityInstance = echarts.init(priorityChart.value)
  priorityInstance.setOption({
    tooltip: { trigger: 'item' },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      data: taskStore.priorityDistribution,
      itemStyle: {
        color: (params: any) => getPieColor(params.dataIndex as number)
      }
    }]
  })

  // 状态趋势折线图
  statusTrendInstance = echarts.init(statusTrendChart.value)
  statusTrendInstance.setOption({
    xAxis: {
      type: 'category',
      data: taskStore.statusTrendData.dates // 从 store 获取状态趋势数据
    },
    yAxis: { type: 'value' },
    series: [{
      data: taskStore.statusTrendData.values, // 从 store 获取趋势数据
      type: 'line',
      smooth: true,
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#2196F3' },
          { offset: 1, color: '#E3F2FD' }
        ])
      }
    }]
  })

  // 贡献度柱状图
  contributionInstance = echarts.init(contributionChart.value)
  contributionInstance.setOption({
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: teamStore.contributionData.names // 从 store 获取贡献数据
    },
    yAxis: { type: 'value' },
    series: [{
      data: teamStore.contributionData.values, // 从 store 获取贡献度数据
      type: 'bar',
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#2196F3' },
          { offset: 1, color: '#64B5F6' }
        ])
      }
    }]
  })
}

watch(
  () => taskStore.tasks,
  () => {
    // 重新渲染图表
    initCharts()
  },
  { deep: true }
)

onMounted(async () => {
  await taskStore.getAllTasks()
  await taskStore.getAllProjects()
  await teamStore.getEmployees()
  initCharts()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  [priorityInstance, statusTrendInstance, contributionInstance].forEach(
    chart => chart?.dispose()
  )
  window.removeEventListener('resize', handleResize)
})

const handleResize = () => {
  [priorityInstance, statusTrendInstance, contributionInstance].forEach(
    chart => chart?.resize()
  )
}
</script>

<template>
  <v-container fluid class="dashboard-container">
    <!-- 导出控制 -->
    <div class="export-controls">
      <v-btn color="primary" @click="handleExport('excel')">
        <v-icon left>mdi-microsoft-excel</v-icon>
        导出Excel
      </v-btn>
      <v-btn color="error" class="ml-2" @click="handleExport('pdf')">
        <v-icon left>mdi-file-pdf-box</v-icon>
        导出PDF
      </v-btn>
    </div>

    <!-- 任务状态概览 -->
    <v-row class="status-overview">
      <v-col v-for="(item, index) in statusData" :key="index" cols="12" sm="6" md="3">
        <v-card :color="item.color" dark>
          <v-card-text class="d-flex justify-space-between align-center">
            <div>
              <div class="text-h5">{{ item }}</div>
              <div>{{ item.title }}</div>
            </div>
            <v-avatar size="60" :color="item.lightColor">
              <v-icon large>{{ item.icon }}</v-icon>
            </v-avatar>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- 数据分析行 -->
    <v-row class="data-analysis">
      <!-- 优先级分析 -->
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title class="d-flex justify-space-between">
            <span>任务优先级分布</span>
            <v-chip small color="grey lighten-3">实时更新</v-chip>
          </v-card-title>
          <div ref="priorityChart" class="chart-container"></div>
        </v-card>
      </v-col>

      <!-- 状态分布 -->
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title>任务状态趋势</v-card-title>
          <div ref="statusTrendChart" class="chart-container"></div>
        </v-card>
      </v-col>
    </v-row>

    <!-- 成员贡献度 -->
    <v-card class="member-contribution">
      <v-card-title>团队成员绩效分析</v-card-title>
      <div ref="contributionChart" class="chart-container"></div>
      <v-card-actions>
        <v-select v-model="timeRange" :items="timeOptions" label="统计周期" dense outlined
          style="max-width: 200px"></v-select>
      </v-card-actions>
    </v-card>

    <!-- 项目进度 -->
    <v-card class="project-progress">
      <v-card-title class="d-flex align-center">
        <v-icon left>mdi-chart-timeline</v-icon>
        项目执行进度
        <v-spacer></v-spacer>
        <v-btn small @click="sortDirection = -sortDirection">
          排序 {{ sortDirection > 0 ? '↓' : '↑' }}
        </v-btn>
      </v-card-title>
      <v-list>
        <v-list-item v-for="project in sortedProjects" :key="project.projectId" :class="{ 'late-project': project.isLate }">
          <v-list-item-content>
            <div class="project-item">
              <div class="project-info">
                <div class="project-name">{{ project.title }}</div>
                <div class="project-deadline">
                  截止: {{ formatDate(project.deadline || '未设置') }}
                </div>
              </div>
              <v-progress-linear :value="project.progress" height="20" :color="getProgressColor(project.progress)"
                rounded>
                <template v-slot:default="{ value }">
                  <strong>{{ Math.ceil(value) }}%</strong>
                </template>
              </v-progress-linear>
            </div>
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-card>
  </v-container>
</template>

<style scoped>
.dashboard-container {
  max-width: 1600px;
  margin: 0 auto;
  padding: 20px;
}

.chart-container {
  height: 400px;
  padding: 15px;
}

.status-overview .v-card {
  transition: transform 0.3s;
}

.status-overview .v-card:hover {
  transform: translateY(-5px);
}

.project-progress .late-project {
  border-left: 4px solid #F44336;
  background-color: #FFEBEE;
}

.project-item {
  width: 100%;
}

.project-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.project-name {
  font-weight: 500;
}

.project-deadline {
  color: rgba(0, 0, 0, 0.6);
}

.export-controls {
  position: fixed;
  top: 70px;
  right: 20px;
  z-index: 100;
}

@media (max-width: 960px) {
  .chart-container {
    height: 300px;
  }

  .export-controls {
    position: static;
    margin-bottom: 20px;
  }
}
</style>