<script setup lang="ts">
import { onMounted, computed, ref, nextTick, onUnmounted } from 'vue';
import { useTaskStore } from '@/stores/task';
import * as echarts from 'echarts';

// 使用 Pinia store
const taskStore = useTaskStore();
const isLoading = ref(true);
const errorMessage = ref('');

// 处理图表错误
const handleChartError = (error: Error) => {
  console.error('ECharts error:', error);
  errorMessage.value = '图表渲染失败，请检查数据格式或网络连接。';
};

// 组件加载时获取数据
onMounted(async () => {
  try {
    await taskStore.getTaskOverview();
    await taskStore.getEmployeeTaskCompletion();
  } catch (error) {
    console.error('Failed to fetch data:', error);
    errorMessage.value = '数据加载失败，请稍后重试。';
  } finally {
    nextTick(() => {
      isLoading.value = false;
    });
  }
});

// **折线图：任务完成趋势**
const taskTrendOption = computed(() => {
  const trendData = taskStore.employeeTaskCompletion;
  if (!trendData || trendData.length === 0) {
    return {
      title: {
        text: '任务完成趋势',
        left: 'center',
      },
      xAxis: { type: 'category', data: [] },
      yAxis: { type: 'value' },
      series: [{ type: 'line', data: [] }],
    };
  }
  return {
    title: {
      text: '任务完成趋势',
      left: 'center',
    },
    tooltip: {
      trigger: 'axis',
    },
    xAxis: {
      type: 'category',
      data: trendData.map(item => item.month),
    },
    yAxis: {
      type: 'value',
    },
    series: [
      {
        name: '任务完成数',
        type: 'line',
        data: trendData.map(item => item.completed),
        color: '#2EBFAF',
      },
    ],
  };
});

// **任务完成情况饼图**
const taskCompletionOption = computed(() => ({
  title: {
    text: '任务完成情况',
    left: 'center',
  },
  tooltip: {
    trigger: 'item',
  },
  legend: {
    orient: 'vertical',
    left: 'left',
  },
  series: [
    {
      name: '任务状态',
      type: 'pie',
      radius: '50%',
      data: [
        { value: taskStore.taskOverview.completedTasks, name: '已完成' },
        { value: taskStore.taskOverview.totalTasks - taskStore.taskOverview.completedTasks, name: '未完成' },
        { value: taskStore.taskOverview.overdueTasks, name: '逾期未完成' },
      ],
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.5)',
        },
      },
    },
  ],
}));

// **员工任务完成情况柱状图**
const employeeTaskData = computed(() => {
  if (!taskStore.employeeTaskCompletion || taskStore.employeeTaskCompletion.length === 0) {
    return null;
  }
  return {
    title: {
      text: '员工任务完成情况',
      left: 'center',
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
    },
    xAxis: {
      type: 'category',
      data: taskStore.employeeTaskCompletion.map((emp) => emp.name),
    },
    yAxis: {
      type: 'value',
    },
    series: [
      {
        name: '已完成任务',
        type: 'bar',
        data: taskStore.employeeTaskCompletion.map((emp) => emp.completed),
        itemStyle: {
          color: '#4CAF50',
        },
      },
      {
        name: '未完成任务',
        type: 'bar',
        data: taskStore.employeeTaskCompletion.map((emp) => emp.pending),
        itemStyle: {
          color: '#FFC107',
        },
      },
      {
        name: '逾期未完成',
        type: 'bar',
        data: taskStore.employeeTaskCompletion.map((emp) => emp.overdue),
        itemStyle: {
          color: '#F44336',
        },
      },
    ],
  };
});

// 监听容器大小变化
const resizeObserver = ref<ResizeObserver | null>(null);

onMounted(() => {
  resizeObserver.value = new ResizeObserver(() => {
    const charts = document.querySelectorAll('.v-chart');
    charts.forEach((chart) => {
      const chartElement = chart as HTMLElement; // 类型断言
      const instance = echarts.getInstanceByDom(chartElement);
      if (instance) {
        instance.resize();
      }
    });
  });

  const chartContainers = document.querySelectorAll('.chart-container');
  chartContainers.forEach((container) => {
    if (resizeObserver.value && container instanceof HTMLElement) {
      resizeObserver.value.observe(container);
    }
  });
});

onUnmounted(() => {
  if (resizeObserver.value) {
    resizeObserver.value.disconnect();
  }
});
</script>

<template>
  <v-container>
    <v-row>
      <!-- 任务概览 -->
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title>任务概览</v-card-title>
          <v-card-text>
            <div class="d-flex justify-space-between">
              <div>
                <div class="text-h6">任务总数</div>
                <div class="text-h4">{{ taskStore.taskOverview.totalTasks }}</div>
              </div>
              <div>
                <div class="text-h6">已完成</div>
                <div class="text-h4 text-success">{{ taskStore.taskOverview.completedTasks }}</div>
              </div>
              <div>
                <div class="text-h6">逾期未完成</div>
                <div class="text-h4 text-error">{{ taskStore.taskOverview.overdueTasks }}</div>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- 任务完成情况饼图 -->
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title>任务完成情况</v-card-title>
          <v-card-text class="chart-container">
            <v-chart v-if="!isLoading" :option="taskCompletionOption" style="height: 400px;" @error="handleChartError" />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- 新增图表 -->
    <v-row>
      <!-- 任务完成趋势折线图 -->
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title>任务完成趋势</v-card-title>
          <v-card-text class="chart-container">
            <v-chart v-if="!isLoading" :option="taskTrendOption" style="height: 400px;" />
          </v-card-text>
        </v-card>
      </v-col>

      <!-- 员工任务完成情况柱状图 -->
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title>员工任务完成情况</v-card-title>
          <v-card-text class="chart-container">
            <v-chart v-if="!isLoading && employeeTaskData" :option="employeeTaskData" style="height: 400px;" />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>