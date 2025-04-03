<script setup lang="ts">
import { ref, watch, watchEffect, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import * as echarts from 'echarts'
import { useTaskStore } from '@/stores/task'
import { useTeamStore } from '@/stores/team'
import type { StatusDataItem } from '@/types/report'
import dayjs from 'dayjs';
import { saveAs } from "file-saver"
import * as XLSX from 'xlsx'
import { jsPDF } from 'jspdf'

const taskStore = useTaskStore()
const teamStore = useTeamStore()
// 图表引用
const priorityChart = ref(null)
const statusTrendChart = ref(null)
const contributionChart = ref(null)
let priorityInstance: echarts.ECharts | null = null;
let statusTrendInstance: echarts.ECharts | null = null;
let contributionInstance: echarts.ECharts | null = null;
// 使用防抖优化 resize 监听
let resizeTimer: number

const sortDirection = ref(-1) // 默认降序

// 统计任务的不同状态数据
const allTasks = computed(() => taskStore.allTasks)
const projects = computed(() => taskStore.projects)

// 基础统计
const statusData = computed<StatusDataItem[]>(() => [
  {
    value: allTasks.value.length,
    title: '总任务数',
    color: '#2196F3',
    lightColor: '#E3F2FD',
    icon: '📜'
  },
  {
    value: allTasks.value.filter(t => t.status === '已完成').length,
    title: '已完成',
    color: '#4CAF50',
    lightColor: '#E8F5E9',
    icon: '☕️'
  },
  {
    value: allTasks.value.filter(t => t.status === '进行中').length,
    title: '进行中',
    color: '#FF9800',
    lightColor: '#FFF3E0',
    icon: '⏳'
  },
  {
    value: allTasks.value.filter(t => t.status === '待处理').length,
    title: '待处理',
    color: '#F44336',
    lightColor: '#FFEBEE',
    icon: '🕒'
  }
])

// 计算项目进度
const calculateProjectProgress = (projectId: string) => {
  // 先筛选出当前项目的任务
  const projectTasks = allTasks.value.filter(t => t.projectId === projectId);
  if (projectTasks.length === 0) return 0;
  // 筛选已完成的任务
  const completedTasks = projectTasks.filter(t => t.status === '已完成');
  return Math.round((completedTasks.length / projectTasks.length) * 100);
};
// 计算项目进度并检查是否逾期
const projectsWithStatus = computed(() => {
  return projects.value.map(p => {
    const progress = calculateProjectProgress(p.projectId);
    let isLate = false;
    if (p.deadline) {
      const deadline = dayjs(p.deadline);
      isLate = deadline.isValid() ? dayjs().isAfter(deadline) && progress < 100 : false;
    }
    return { ...p, progress, isLate };
  });
});
// 计算项目进度并排序
const sortedProjects = computed(() => {
  return [...projectsWithStatus.value].sort((a, b) =>
    sortDirection.value * (b.progress - a.progress)
  )
})

// 计算进度颜色
const getProgressColor = (progress: number): string => {
  if (progress >= 90) return 'success';
  if (progress >= 70) return 'warning';
  return 'error';
}

// 导出 Excel 或 PDF
const handleExport = (type: 'excel' | 'pdf') => {
  if (type === 'excel') {
    const ws = XLSX.utils.json_to_sheet(projectsWithStatus.value)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Projects')
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' })
    saveAs(blob, 'projects.xlsx')
  } else if (type === 'pdf') {
    const doc = new jsPDF()
    doc.text('Projects Report', 20, 20)
    projectsWithStatus.value.forEach((projectsWithStatus, index) => {
      doc.text(`${index + 1}. ${projectsWithStatus.title} - ${projectsWithStatus.progress}%`, 20, 30 + (index * 10))
    })
    doc.save('projects.pdf')
  }
}

const formatDate = (dateString: string): string => {
  return dayjs(dateString).format('YYYY-MM-DD');
}

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

// ECharts 初始化配置
const initChartWithPassive = (element: HTMLElement) => {
  const chart = echarts.init(element, null, {
    renderer: 'canvas',
    useDirtyRect: true,  // 启用脏矩形优化
    useCoarsePointer: true,  // 优化触摸事件
    pointerSize: 10  // 增大触摸区域
  })

  // 手动设置被动事件
  chart.getZr().on('touchstart', () => { }, { passive: true })
  chart.getZr().on('mousewheel', () => { }, { passive: true })

  return chart
}

// 图表初始化
const initCharts = () => {
  // 销毁旧实例
  [priorityInstance, statusTrendInstance, contributionInstance].forEach(chart => {
    chart?.dispose()
  })
  // 优先级饼图初始化
  if (priorityChart.value) {
    priorityInstance = initChartWithPassive(priorityChart.value)
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
  }

  // 状态趋势折线图
  if (statusTrendChart.value) {
    statusTrendInstance = echarts.init(statusTrendChart.value)
    statusTrendInstance.setOption({
      xAxis: {
        type: 'category',
        data: taskStore.statusTrendData.dates,
        axisLabel: {
          rotate: 45, // 日期标签旋转防止重叠
          formatter: (value: string) => dayjs(value).format('MM/YYYY') // 更紧凑的格式
        }
      },
      yAxis: {
        type: 'value',
        minInterval: 1, // 强制整数刻度
        axisLabel: { formatter: '{value} 个' } // 添加单位
      },
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const date = dayjs(params[0].axisValue).format('YYYY-MM-DD');
          return `${date}<br/>任务数量: ${params[0].value}`;
        }
      },
      series: [{
        data: taskStore.statusTrendData.values,
        type: 'line',
        smooth: true,
        symbol: 'circle', // 显示数据点
        symbolSize: 8,
        itemStyle: { color: '#2196F3' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(33, 150, 243, 0.6)' },
            { offset: 1, color: 'rgba(227, 242, 253, 0.2)' }
          ])
        },
        lineStyle: { width: 2 }
      }],
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%', // 给旋转的标签留空间
        containLabel: true
      }
    });
  }

  // 贡献度柱状图
  if (contributionChart.value) {
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
}

// 数据更新方法
const updateChartData = () => {
  priorityInstance?.setOption({
    series: [{
      data: taskStore.priorityDistribution
    }]
  })

  statusTrendInstance?.setOption({
    xAxis: { data: taskStore.statusTrendData.dates },
    series: [{
      data: taskStore.statusTrendData.values
    }]
  })

  contributionInstance?.setOption({
    xAxis: { data: teamStore.contributionData.names },
    series: [{
      data: teamStore.contributionData.values
    }]
  })
}

watch(
  () => taskStore.allTasks,
  () => {
    // 重新渲染图表
    updateChartData()
  },
  { deep: true }
)

onMounted(async () => {
  await taskStore.getAllProjects();
  await taskStore.getAllTasks();
  await taskStore.loadAllTasksWithProjects();
  await teamStore.getEmployees();
  // 使用 nextTick 确保 DOM 就绪
  await nextTick()
  initCharts()
  // 优化事件监听
  window.addEventListener('resize', handleResize, {
    passive: true
  })
})

onBeforeUnmount(() => {
  [priorityInstance, statusTrendInstance, contributionInstance].forEach(chart => {
    chart?.dispose()
    chart = null
  })
  window.removeEventListener('resize', handleResize)
  clearTimeout(resizeTimer)
})

const handleResize = () => {
  clearTimeout(resizeTimer)
  resizeTimer = window.setTimeout(() => {
    [priorityInstance, statusTrendInstance, contributionInstance].forEach(
      chart => chart?.resize({ animation: { duration: 300 } })
    )
  }, 200)
}
</script>

<template>
  <v-container fluid class="dashboard-container">
    <!-- 导出控制 -->
    <div class="export-controls">
      <v-btn color="primary" @click="handleExport('excel')">
        <v-icon left>excel</v-icon>
        导出Excel
      </v-btn>
      <v-btn color="error" class="ml-2" @click="handleExport('pdf')">
        <v-icon left>pdfx</v-icon>
        导出PDF
      </v-btn>
    </div>

    <!-- 任务状态概览 -->
    <v-row class="status-overview">
      <v-col v-for="(item, index) in statusData" :key="index" cols="12" sm="6" md="3">
        <v-card :color="item.color" dark>
          <v-card-text class="d-flex justify-space-between align-center">
            <div>
              <!-- 显示值 -->
              <div class="text-h5">{{ item.value }}</div>
              <!-- 显示标题 -->
              <div>{{ item.title }}</div>
            </div>
            <!-- 显示图标 -->
            <v-icon :style="{ fontSize: '36px' }" style="right: 10px; bottom: 5px;">{{ item.icon }}</v-icon>
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
      <div ref="contributionChart" class="chart-container">
      </div>

      <!-- 统计周期 -->
      <v-card-actions>
        <v-select v-model="timeRange" :items="timeOptions" item-title="text" item-value="value" label="统计周期" outlined
          dense style="max-width: 200px"></v-select>
      </v-card-actions>
    </v-card>

    <!-- 项目进度 -->
    <v-card class="project-progress">
      <v-card-title class="d-flex align-center">
        <v-icon left>timeline</v-icon>
        项目执行进度
        <v-spacer></v-spacer>
        <v-btn @click="sortDirection = -sortDirection">
          排序 {{ sortDirection > 0 ? '↓' : '↑' }}
        </v-btn>
      </v-card-title>
      <v-list>
        <v-list-item v-for="project in sortedProjects" :key="project.projectId"
          :class="{ 'late-project': project.isLate }">
          <div class="project-item">
            <div class="project-info">
              <div class="project-name">
                {{ project.title }}
              </div>
              <div class="project-deadline">
                截止: {{ formatDate(project.deadline || '未设置') }}
              </div>
            </div>
            <v-progress-linear :value="project.progress" :max="100" height="20"
              :color="getProgressColor(project.progress)" rounded>
              <template v-slot:default>
                <strong>{{ project.progress }}%</strong>
              </template>
            </v-progress-linear>
          </div>
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
  display: flex;
  justify-content: center;
  align-items: center;
}

.status-overview .v-card {
  transition: transform 0.3s;
}

.status-overview .v-card:hover {
  transform: translateY(-5px);
}

.status-overview .text-h5 {
  margin-bottom: 8px;
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
  top: 120px;
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