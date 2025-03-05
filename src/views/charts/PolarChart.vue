<script setup>
import { defineProps, onMounted, ref } from 'vue'
import * as echarts from 'echarts'

const chartRef = ref(null)

onMounted(() => {
  const myChart = echarts.init(chartRef.value)
  myChart.setOption({
    tooltip: {},
    legend: {
      data: ['My First dataset', 'My Second dataset']
    },
    radar: {
      indicator: [
        { name: 'Male', max: 100 },
        { name: 'Female', max: 100 },
        { name: 'Child', max: 100 },
        { name: 'Old', max: 100 }
      ]
    },
    series: [
      {
        name: 'Dataset',
        type: 'radar',
        data: [
          {
            value: [28, 48, 40, 19],
            name: 'My First dataset'
          },
          {
            value: [65, 59, 90, 81],
            name: 'My Second dataset'
          }
        ]
      }
    ]
  })
})
</script>

<template>
  <div ref="chartRef" style="width: 100%; height: 400px"></div>
</template>
