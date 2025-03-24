<!-- 通告栏组件 -->
 <script lang='ts' setup>
 </script>
<template>
  <div class="notice-board">
    <!-- 自定义顶部区域 -->
    <div class="notice-header">
      <h1>公示公告</h1>
      <div class="actions">
        <v-btn color="primary">发布公告</v-btn>
        <v-btn>管理分类</v-btn>
      </div>
    </div>
    
    <!-- 主内容区 -->
    <div class="notice-content">
      <!-- 左侧公告列表 -->
      <div class="notice-list">
        <v-card>
          <!-- 列表内容 -->
        </v-card>
      </div>
      
      <!-- 右侧公告详情 -->
      <div class="notice-detail">
        <v-card>
          <!-- 详情内容 -->
        </v-card>
      </div>
    </div>
  </div>
</template>
<style scoped>
.notice-board {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.notice-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #eee;
}

.notice-content {
  flex: 1;
  display: flex;
  overflow: hidden;
  gap: 16px;
  padding: 16px;
}

.notice-list {
  width: 300px;
  overflow-y: auto;
}

.notice-detail {
  flex: 1;
  overflow-y: auto;
}
</style>