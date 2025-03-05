<script setup>
import { ref, onMounted } from 'vue'
import * as echarts from 'echarts'

const chartRef = ref(null)

onMounted(() => {
  const myChart = echarts.init(chartRef.value)
  myChart.setOption({
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
      type: 'category',
      data: ['January', 'February', 'March', 'April', 'May', 'June', 'July']
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: 'Achievement',
        type: 'line',
        data: [20, 39, 70, 15, 50, 80, 22],
        color: '#2EBFAF'
      }
    ]
  })
})
</script>

<template>
  <div ref="chartRef" style="width: 100%; height: 400px"></div>
</template>
