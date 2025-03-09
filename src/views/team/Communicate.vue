<!-- 实时通讯 -->
<script setup lang="ts">
import { ref } from 'vue'
import { ElInput, ElButton, ElCollapse, ElCollapseItem } from 'element-plus'

const comments = ref([
  { user: '张三', content: '这个任务有点复杂，能否提供更多细节？' },
  { user: '李四', content: '我已经解决了这个问题，感谢大家的支持！' }
])

const comment = ref('')
const activeNames = ref<string[]>([])

function addComment() {
  if (comment.value.trim()) {
    comments.value.push({ user: '我', content: comment.value })
    comment.value = ''
  }
}
</script>

<template>
  <div class="team-collaboration">
    <h2>任务讨论与协作</h2>
    
    <!-- 评论区域 -->
    <el-input v-model="comment" placeholder="输入评论..." />
    <el-button type="primary" @click="addComment">发表评论</el-button>
    
    <!-- 评论列表 -->
    <el-collapse v-model="activeNames">
      <el-collapse-item v-for="(comment, index) in comments" :key="index" :name="index.toString()">
        <template #title>{{ comment.user }}</template>
        <p>{{ comment.content }}</p>
      </el-collapse-item>
    </el-collapse>
  </div>
</template>

<style scoped>
/* 团队协作页面样式 */
.team-collaboration {
  padding: 20px;
}
</style>