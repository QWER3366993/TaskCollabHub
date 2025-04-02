<!-- 个人备忘录 -->
<script lang='ts' setup>
import { ref, computed, onMounted } from 'vue'
import { useMemoStore } from '@/stores/memo'
import type { Memo } from '@/types/memo'
import { useUserStore } from '@/stores/user'
import { useTeamStore } from '@/stores/team'
const memoStore = useMemoStore()
const userStore = useUserStore()
const teamStore = useTeamStore()
// 数据状态
const searchKeyword = ref('')
const selectedCategory = ref('')
const selectedStatus = ref('')
const showEditor = ref(false)
const editingMemo = ref<Partial<Memo>>({
  title: '',
  content: '',
  category: '',
  completed: false,
  attachments: [],
})

// 分类选项
const categories = ['工作', '学习', '个人', '生活']
const statusOptions = ['已完成', '未完成']

// 表单规则
const requiredRule = (v: string) => !!v || '必填项'

// 计算属性
const filteredMemos = computed(() => {
  return memoStore.memos.filter(memo => {
    const matchKeyword = memo.title.includes(searchKeyword.value) ||
      memo.content.includes(searchKeyword.value)
    const matchCategory = selectedCategory.value ?
      memo.category === selectedCategory.value : true
    const matchStatus = selectedStatus.value ?
      memo.completed === (selectedStatus.value === '已完成') : true
    return matchKeyword && matchCategory && matchStatus
  })
})

// 方法
const openEditor = (memo?: Memo) => {
  editingMemo.value = memo ? { ...memo } : {
    title: '',
    content: '',
    category: '',
    completed: false,
    attachments: [],
  }
  showEditor.value = true
}

const closeEditor = () => {
  showEditor.value = false
  editingMemo.value = {
    title: '',
    content: '',
    category: '',
    completed: false,
    attachments: [],
  }
}

const saveMemo = async () => {
  if (editingMemo.value.id) {
    await memoStore.updateMemo(editingMemo.value as Memo)
  } else {
    await memoStore.addMemo(editingMemo.value as Memo)
  }
  closeEditor()
}

const deleteMemo = async (id: string) => {
  await memoStore.deleteMemo(id)
}

const toggleMemoStatus = async (memo: Memo) => {
  await memoStore.updateMemo({ ...memo, completed: !memo.completed })
}

// 辅助方法
const truncateContent = (content: string) => {
  return content.length > 100 ? content.slice(0, 100) + '...' : content
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString()
}

// 辅助方法
const colors = {
  '工作': 'blue',
  '学习': 'green',
  '个人': 'orange',
  '生活': 'purple'
} as const; // 使用 as const 确保 colors 的类型被精确推导

const getCategoryColor = (category: string): string => {
  return colors[category as keyof typeof colors] || 'grey'; // 确保 category 被视为 colors 的键
};
onMounted(async () => {
  await userStore.getUserInfo()
  if (userStore.user?.userId) {
    await teamStore.getEmployeeById(userStore.user.userId)
  }
  await memoStore.loadMemos()
})
</script>

<template>
  <v-container class="memo-container">
    <!-- 顶部工具栏 -->
    <v-card class="toolbar-card mb-6">
      <v-toolbar>
        <v-row dense align="center">
          <v-col cols="auto">
            <v-btn color="primary" @click="openEditor()" class="mr-4">
              <v-icon>add</v-icon>新建备忘录
            </v-btn>
          </v-col>
          <v-col>
            <v-text-field v-model="searchKeyword" density="compact" variant="solo" label="搜索备忘录"
              prepend-inner-icon="search" class="mx-8 ml-2" hide-details></v-text-field>
          </v-col>
          <v-col cols="auto">
            <v-select v-model="selectedCategory" :items="categories" label="分类" density="compact" variant="outlined"
              style="max-width: 160px" clearable></v-select>
          </v-col>
          <v-col cols="auto">
            <v-select v-model="selectedStatus" :items="statusOptions" label="状态" density="compact" variant="outlined"
              style="max-width: 160px" class="ml-2" clearable></v-select>
          </v-col>
        </v-row>
      </v-toolbar>
    </v-card>

    <!-- 备忘录列表 -->
    <v-row>
      <v-col v-for="memo in filteredMemos" :key="memo.id" cols="12" sm="6" md="4" lg="3">
        <v-card class="memo-card" :class="{ 'completed': memo.completed }">
          <v-card-title class="d-flex align-center">
            <v-checkbox v-model="memo.completed" color="success" hide-details
              @change="toggleMemoStatus(memo)"></v-checkbox>
            <span class="text-truncate">{{ memo.title }}</span>
          </v-card-title>

          <v-card-subtitle class="d-flex align-center">
            <v-chip size="small" :color="getCategoryColor(memo.category)">
              {{ memo.category }}
            </v-chip>
            <span class="text-caption ml-2">{{ formatDate(memo.createdAt) }}</span>
          </v-card-subtitle>

          <v-card-text class="memo-content">
            {{ truncateContent(memo.content) }}
          </v-card-text>

          <v-card-actions>
            <v-btn variant="text" color="primary" size="small" @click="openEditor(memo)">
              编辑
            </v-btn>
            <v-btn variant="text" color="error" size="small" @click="deleteMemo(memo.id!)">
              删除
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <!-- 编辑弹窗 -->
    <v-dialog v-model="showEditor" max-width="600">
      <v-card>
        <v-toolbar color="primary">
          <v-toolbar-title>{{ editingMemo.id ? '编辑备忘录' : '新建备忘录' }}</v-toolbar-title>
          <v-btn icon @click="closeEditor">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-toolbar>

        <v-form @submit.prevent="saveMemo">
          <v-card-text>
            <v-text-field v-model="editingMemo.title" label="标题" :rules="[requiredRule]" required></v-text-field>

            <v-select v-model="editingMemo.category" :items="categories" label="分类" :rules="[requiredRule]"
              required></v-select>

            <v-textarea v-model="editingMemo.content" label="内容" rows="4" auto-grow :rules="[requiredRule]"
              required></v-textarea>

            <v-file-input v-model="editingMemo.attachments" label="附件" multiple chips
              prepend-icon="mdi-paperclip"></v-file-input>
          </v-card-text>

          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn variant="text" @click="closeEditor">取消</v-btn>
            <v-btn color="primary" type="submit">保存</v-btn>
          </v-card-actions>
        </v-form>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<style scoped lang='scss'>
.memo-container {
  .toolbar-card {
    .v-toolbar {
      padding: 12px 24px;
      background: rgba(255, 255, 255, 0.9);
      align-items: center;

      >* {
        margin-top: 0;
        margin-bottom: 0;
      }

      .v-btn {
        height: 40px;
        padding: 0 20px;
      }

      .v-text-field,
      .v-select {
        flex: 0 0 auto;
        margin: 0 12px;
        width: 200px;

        .v-field {
          height: 40px;
          --v-field-padding-top: 10px;
          --v-field-padding-bottom: 10px;
          border-radius: 8px;

          &__input {
            padding-top: 2px;
          }
        }

        .v-label {
          top: 50%;
          transform: translateY(-50%);
        }
      }

      .v-select {
        width: 160px;

        margin-top: 23px;
      }
    }
  }

  // 备忘录卡片样式
  .memo-card {
    height: 100%;
    border-radius: 12px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
    }

    // 卡片底色
    &.completed {
      opacity: 0.6;
      background: rgba(245, 245, 245, 0.8);
    }

    .v-card-title {
      padding: 16px 16px 8px;
      min-height: 64px;

      .v-checkbox {
        margin-right: 5px;
      }

      span {
        font-size: 1.1rem;
        // 缩放
        font-weight: 600;
        // 超出部分省略号
        flex: 1;
      }
    }

    // 标题
    .v-card-subtitle {
      padding: 0 16px;
      min-height: 40px;
    }

    // 内容
    .memo-content {
      color: rgba(0, 0, 0, 0.8);
      min-height: 80px;
    }

    // 操作(编辑删除按钮)
    .v-card-actions {
      padding: 8px 30px;
      border-top: 1px solid rgba(0, 0, 0, 0.08);
    }
  }

}
</style>