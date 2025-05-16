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

const topPerformer = computed(() => teamStore.contributionData.topPerformer);

  // 计算首个员工提前完成任务总时长
  const totalEarlyTime = computed<{
  totalEarly: number;
  completedCount: number;
}>(() => {
   if (!teamStore.contributionData.sortedEmployees.length) {
    return { totalEarly: 0, completedCount: 0 };
  }
  const firstEmployee = teamStore.contributionData.sortedEmployees[0];
  let totalEarly = 0;
  let completedCount = 0;
  // 遍历所有任务，过滤出属于首个员工的任务
  taskStore.allTasks.forEach(task => {
    if (task.employeeId === firstEmployee.id && task.status === '已完成' && task.completedTime && task.deadline) {
      const completedTime = dayjs(task.completedTime);  // 完成时间
      const deadline = dayjs(task.deadline);  // 截止时间

      // 计算提前完成的时间（deadline - completedTime）
      const earlyCompletionTime = deadline.diff(completedTime, 'minute');
      if (earlyCompletionTime > 0) {  // 如果任务提前完成
        totalEarly += earlyCompletionTime;
        completedCount++;  // 计数已完成任务
      }
    }
  });
  return { totalEarly, completedCount };
});

// 计算首个员工的平均提前完成时间
const averageEarlyTime = computed(() => {
  const { totalEarly, completedCount } = totalEarlyTime.value;
  const average = completedCount > 0 ? totalEarly / completedCount /60/24 : 0;  // 计算平均提前时间（以天为单位）
  return average;
});

const overdueTasks = computed(() => {
  // 过滤出超期任务
  return taskStore.allTasks.filter(
    task => task.status !== '已完成' && task.deadline && dayjs().isAfter(dayjs(task.deadline))
  );
});

// 计算单个员工的KPI指数
const calculateEmployeeKPI = (completedCount: number, totalTime: number, overdueCount: number): number => {
  if (totalTime === 0 || completedCount === 0) return 0;  // 避免除零错误，返回 0 或者其他合适的默认值
  return completedCount / (totalTime * (overdueCount + 1)) * 1e6;
};

// 计算所有员工的 KPI
const employeeKPIs = computed(() => {
  return teamStore.contributionData.sortedEmployees.map(employee => {
    // 计算每个员工的平均完成时间
    const averageTime = employee.completed > 0 ? employee.totalCompletedTime / employee.completed : 0;
    // 计算 KPI
    const kpi = calculateEmployeeKPI(employee.completed, averageTime, employee.overdue);
    // 查找员工信息
    const employeeData = teamStore.employees.find(e => e.employeeId === employee.id);
    return {
      employeeId: employee.id,
      name: employeeData ? employeeData.name : '未知',
      kpi,
      teamId: employeeData ? employeeData.teamId : null
    };
  });
});


// 计算每个团队的KPI
const teamKPIs = computed(() => {
  // 按团队划分员工
  const teamKpiMap = new Map();

  // 汇总每个团队的员工KPI
  employeeKPIs.value.forEach(employeeKPI => {
    const { teamId, kpi } = employeeKPI;
    if (!teamKpiMap.has(teamId)) {
      teamKpiMap.set(teamId, { totalKPI: 0, count: 0 });
    }
    const teamData = teamKpiMap.get(teamId);
    teamData.totalKPI += kpi;
    teamData.count += 1;
  });

  // 计算每个团队的平均KPI
  const result: { teamId: string; averageKPI: number }[] = [];
  teamKpiMap.forEach((teamData, teamId) => {
    const averageKPI = teamData.count > 0 ? teamData.totalKPI / teamData.count : 0;
    result.push({ teamId, averageKPI });
  });
  // result.sort((a, b) => Number(a.teamId) - Number(b.teamId)); //  按团队id排序
  result.sort((a, b) => b.averageKPI - a.averageKPI); // 按平均KPI降序

  return result;
});

// 平均 KPI
const averageKPI = computed(() => {
  if (employeeKPIs.value.length === 0) return 0;  // 防止除零错误
  const totalKPI = employeeKPIs.value.reduce((sum, employee) => sum + employee.kpi, 0);
  return totalKPI / employeeKPIs.value.length;
});


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
  if (progress >= 95) return 'success';
  if (progress >= 80) return 'info';
  if (progress >= 50) return 'warning';
  if (progress >= 30) return 'deep-orange';
  return 'error'; // 0~29
}

// 导出 Excel
const handleExport = (type: 'excel') => {
  if (type === 'excel') {
    // 创建工作簿
    const wb = XLSX.utils.book_new();

    // 任务状态概览
    const statusDataSheet = XLSX.utils.json_to_sheet(statusData.value.map(item => ({
      标题: item.title,
      值: item.value,
      图标: item.icon
    })));
    XLSX.utils.book_append_sheet(wb, statusDataSheet, '任务状态概览');

    // 优先级分析
    const priorityDataSheet = XLSX.utils.json_to_sheet(taskStore.priorityDistribution);
    XLSX.utils.book_append_sheet(wb, priorityDataSheet, '优先级分析');

    // 状态分布
    const statusTrendDataSheet = XLSX.utils.json_to_sheet(taskStore.statusTrendData.values.map((value, index) => ({
      日期: taskStore.statusTrendData.dates[index],
      任务数量: value
    })));
    XLSX.utils.book_append_sheet(wb, statusTrendDataSheet, '状态分布');

    // 成员贡献度
    const contributionDataSheet = XLSX.utils.json_to_sheet(teamStore.contributionData.sortedEmployees.map(employee => ({
      员工ID: employee.id,
      员工姓名: teamStore.getName(employee.id),
      完成任务数: employee.completed,
      超期任务数: teamStore.contributionData.overdue[employee.overdue],
      未完成任务数: teamStore.contributionData.pending[employee.pending]
    })));
    XLSX.utils.book_append_sheet(wb, contributionDataSheet, '成员贡献度');

    // 项目进度
    const projectsSheet = XLSX.utils.json_to_sheet(projectsWithStatus.value.map(project => ({
      项目名称: project.title,
      进度: `${project.progress}%`,
      截止日期: project.deadline,
      是否逾期: project.isLate ? '是' : '否'
    })));
    XLSX.utils.book_append_sheet(wb, projectsSheet, '项目进度');

    // 导出 Excel 文件
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(blob, 'report.xlsx');
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

  // 任务数量趋势折线图
  if (statusTrendChart.value) {
    statusTrendInstance = echarts.init(statusTrendChart.value)
    statusTrendInstance.setOption({
      title: {
        subtext: '按时间统计任务总量', // 副标题
        left: 'center'
      },
      xAxis: {
        type: 'category',
        name: '日期', // x轴名称
        data: taskStore.statusTrendData.dates,
        axisLabel: {
          rotate: 45,
          formatter: (value: string) => dayjs(value).format('YYYY-MM') // 格式化日期
        }
      },
      yAxis: {
        type: 'value',
        name: '任务数量', // y轴名称
        minInterval: 1 // 强制显示整数刻度
      },
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const date = dayjs(params[0].axisValue).format('YYYY-MM-DD');
          return `${date}<br/>任务数量: ${params[0].value}`;
        },
        backgroundColor: 'rgba(255, 255, 255, 0.9)', // 背景色
        borderColor: '#ddd',
        textStyle: { color: '#333' }
      },
      series: [{
        data: taskStore.statusTrendData.values,
        type: 'line',
        smooth: true,
        symbol: 'circle', // 显示数据点
        symbolSize: 8,
        itemStyle: {
          color: '#2196F3', // 数据点颜色
          borderColor: '#fff', // 边框颜色
          borderWidth: 2
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(33, 150, 243, 0.6)' },
            { offset: 1, color: 'rgba(227, 242, 253, 0.2)' }
          ])
        },
        lineStyle: {
          width: 3, // 加粗线条
          color: '#2196F3' // 线条颜色
        },
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
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) =>
          `
        <b>${params[0].name}</b><br/>
        ✅ 已完成: ${params[0].value} 个<br/>
        ⚠️ 超期: ${teamStore.contributionData.overdue[params[0].dataIndex]} 个<br/>
        ⏳ 未完成: ${teamStore.contributionData.pending[params[0].dataIndex]} 个<br/>
        <br/>
        <i style="color: #4CAF50;">已完成：绿色</i><br/>
        <i style="color: #FF6384;">超期任务：红色</i><br/>
        <i style="color: #FFEB3B;">未完成任务：黄色</i>
      `
      },
      yAxis: {
        type: 'value',
        name: '任务数量',
        axisLabel: { formatter: '{value} 个' },
      },
      xAxis: {
        type: 'category',
        data: teamStore.contributionData.names,
        axisLabel: {
          rotate: 45,
          formatter: (name: string) => name.length > 4 ? name.slice(0, 4) + '...' : name,
        },
      },
      series: [{
        name: '已完成',
        type: 'bar',
        stack: 'tasks',
        data: teamStore.contributionData.completed,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(1, 0, 0, 0, [
            { offset: 0, color: '#4CAF50' }, // 浅绿色
            { offset: 1, color: '#008B8B' }, // 深绿色
          ]),
        },
        label: {
          show: true,
          position: 'right',
          formatter: '{@score} 个',
        },
        // 悬停高亮
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.3)'
          }
        }
      },
      {
        name: '超期',
        type: 'bar',
        stack: 'tasks',
        data: teamStore.contributionData.overdue,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(1, 0, 0, 0, [
            { offset: 0, color: '#FF6384' }, // 浅红色
            { offset: 1, color: '#FF3030' }, // 深红色
          ]),
        },
        label: {
          show: true,
          position: 'right',
          formatter: '{@score} 个',
        },
        // 悬停高亮
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.3)'
          }
        }
      },
      {
        name: '未完成',
        type: 'bar',
        stack: 'tasks',
        data: teamStore.contributionData.pending,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(1, 0, 0, 0, [
            { offset: 0, color: '#FFEB3B' }, // 浅黄色
            { offset: 1, color: '#FFC107' }, // 深黄色
          ]),
        },
        label: {
          show: true,
          position: 'right',
          formatter: '{@score} 个',
        },
        // 悬停高亮
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.3)'
          }
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

watch(() => taskStore.allTasks,
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
  await teamStore.updateContributionData();
  // 使用 nextTick 确保 DOM 就绪
  await nextTick()
  // 初始化图表
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
          <v-card-title>任务数量趋势图</v-card-title>
          <div ref="statusTrendChart" class="chart-container"></div>
        </v-card>
      </v-col>
    </v-row>

    <!-- 成员贡献度 -->
    <v-card class="member-contribution">
      <v-card-title class="d-flex align-center">
        <v-icon left>group</v-icon>
        团队成员绩效分析
      </v-card-title>

      <v-container fluid>
        <v-row>
          <!-- 左侧：柱状图 -->
          <v-col cols="8">
            <div ref="contributionChart" class="chart-container"></div>
          </v-col>
          
          <!-- 右侧：KPI 卡片 -->
          <v-col cols="4">
            <v-container class="kpi-container" style="max-height: 350px; overflow-y: auto;">
            <!-- 最佳执行者卡片 -->
            <v-card class="kpi-card">
              <v-card-title class="headline text-center">🏆 最佳执行者</v-card-title>
              <v-card-text>
                <div class="kpi-value text-h4 text-center">{{ topPerformer.name }}</div>
                <div class="kpi-subtext text-center">完成任务数: <strong>{{ topPerformer.count }}</strong></div>
                <div class="kpi-subtext text-center">平均提前完工时长: <strong>{{ averageEarlyTime.toFixed(1) }} 天</strong></div>
              </v-card-text>
            </v-card>

            <!-- 逾期任务卡片 -->
            <v-card class="kpi-card mt-4">
              <v-card-title class="headline text-center">🚨 逾期任务</v-card-title>
              <v-card-text>
                <div v-for="task in overdueTasks" :key="task.taskId" class="task-item">
                  <div><strong>任务名称:</strong> {{ task.title }}</div>
                  <div><strong>负责人:</strong> {{ teamStore.getName(task.employeeId) }}</div>
                  <div><strong>截止日期:</strong> {{ task.deadline }}</div>
                </div>
              </v-card-text>
            </v-card>

            <!-- 员工 KPI 卡片 -->
            <v-card class="kpi-card mt-4">
              <v-card-title class="headline text-center">📊 员工 KPI</v-card-title>
              <v-card-text>
                <!-- 展示每个员工的KPI -->
                <div v-for="employee in employeeKPIs" :key="employee.employeeId" class="employee-kpi">
                  <div><strong>{{ employee.name }}:</strong> {{ employee.kpi.toFixed(2) }}</div>
                </div>
                <!-- 展示每个团队的平均KPI -->
                <div v-for="teamKPI in teamKPIs" :key="teamKPI.teamId" class="team-kpi">
                  <div>团队 <strong>{{ teamKPI.teamId }}</strong> 平均KPI: {{ teamKPI.averageKPI.toFixed(2) }}</div>
                </div>
              </v-card-text>
            </v-card>
          </v-container>

          </v-col>
        </v-row>
      </v-container>

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

/* 样式增强 */
.kpi-card {
  border-left:5px solid #bdfa88;
  transition: transform 0.3s, box-shadow 0.3s ease-in-out;
  border-radius: 10px;
  box-shadow: 0 2px 6px rgba(162, 0, 255, 0.2);
}

.kpi-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
}

/* 最佳员工 */
.kpi-value {
  font-size: 2.5rem;
  font-weight: 700;
  color: #ec45ac;
  margin-bottom: 10px;
}
/* 名称 */
.kpi-subtext {
  color: #9a6600;
  font-size: 1rem;
  margin-bottom: 5px;
}
/* 数值颜色 */
.kpi-subtext strong {
  color: #02f81f;
}

.kpi-card .text-center {
  text-align: center;
}
/* 逾期任务卡片 */
.task-item {
  margin-bottom: 15px;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}
/* 名称颜色 */
.task-item strong {
  color: #f96666;
}

/* 员工 KPI行间距 */
.employee-kpi,
.team-kpi {
  margin-bottom: 5px;
}
/* 数值颜色 */
.employee-kpi div,
.team-kpi div {
  font-size: 1rem;
  color: #018342;
}
/* 名称颜色 */
.employee-kpi div strong,
.team-kpi div strong {
  color: #36A2EF;
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