<script lang="ts" setup>
import { ref, computed, onMounted, watchEffect } from 'vue';
import { useTeamStore } from '@/stores/team';
import { useRouter } from 'vue-router';
import type { Team, Employee } from '@/types/team';
import { useUserStore } from '@/stores/user';
import { createToast } from 'mosha-vue-toastify';

const teamStore = useTeamStore();
const router = useRouter();
const userStore = useUserStore();
const teams = ref<Team[]>([]);
// 存储员工信息的映射
const employeeMap = new Map();
const employees = teamStore.employees
// 控制创建团队对话框的显隐
const createTeamDialogVisible = ref(false);
// Omit<Team, 'id'> 是一个类型操作符，用于从 Team 类型中排除 id 属性
const newTeam = ref<Omit<Team, 'id'>>({
  name: '', description: '', employees: [],
  teamId: ''
});

const isAdmin = computed(() =>
  userStore.user?.authorities?.includes('ROLE_ADMIN') ||
  userStore.user?.authorities?.includes('ROLE_Manager')
);

// 创建团队
const createTeam = async () => {
  try {
    // 获取当前用户的员工信息
    const currentEmployee = userStore.employee;
    console.log('当前用户的员工信息:', currentEmployee);
    console.log('当前员工的id:', currentEmployee!.employeeId)
    if (!currentEmployee) {
      createToast('无法获取当前用户的员工信息', { type: 'danger' });
      return;
    }
    // 添加当前用户的员工 ID 到成员列表
    newTeam.value.employees.push(currentEmployee.employeeId);

    // 提交创建团队请求
    await teamStore.createNewTeam(newTeam.value);
    createTeamDialogVisible.value = false;
    newTeam.value = { name: '', description: '', employees: [], teamId: '' };
    createToast('创建成功', { type: 'success' });
  } catch (error) {
    createToast('创建失败', { type: 'danger' });
  } finally {
    await teamStore.getTeamList();
  }
};

// 加载员工列表(带头像)
const loadEmployees = async () => {
  try {
    const result = await teamStore.getEmployees();
    if (Array.isArray(result)) {
      // 通过员工ID将每个员工信息存储到 employeeMap 中
      result.forEach(employee => {
        employeeMap.set(employee.employeeId, {
          name: employee.name,
          avatar: employee.avatar || 'default-avatar.png', // 如果没有头像，使用默认头像
        });
      });
    } else {
      console.error('接口返回值异常:', result);
    }
  } catch (error) {
    console.error('加载员工失败:', error);
  }
};

// 加载团队列表
const loadTeams = async () => {
  try {
    await teamStore.getTeamList();
    if (Array.isArray(teamStore.teams)) {
      teams.value = teamStore.teams;
    }
  } catch (error) {
    console.error('加载团队列表失败:', error);
    throw error;
  }
};


// 编辑跳转
const editTeam = (teamId: string) => {
  router.push({ name: 'teamdetail', params: { id: teamId } });
};

// 删除团队
const deleteTeam = async (teamId: string) => {
  try {
    await teamStore.deleteTeamById(teamId);
    await loadTeams();  // 重新加载团队列表
  } catch (error) {
    console.error('删除团队失败:', error);
  }
};

// 获取团队列表
onMounted(async () => {
  await userStore.getUserInfo();
  // 先加载员工信息，再加载团队信息
  await loadEmployees();
  await loadTeams();
});

</script>

<template>
  <v-container>
    <!-- 顶部操作栏 -->
    <div class="d-flex align-center mb-4">
      <h2 class="text-h5 flex-grow-1">团队列表</h2>
      <v-btn v-if="isAdmin" color="primary" @click="createTeamDialogVisible = true">
        <v-icon>add</v-icon>
        新建团队
      </v-btn>
    </div>
    <v-card>
      <v-data-table :items="teams" :headers="[
        { title: '团队名称', key: 'name' },
        { title: '描述', key: 'description' },
        { title: '成员', key: 'memberName' },
        { title: '操作', key: 'actions' }
      ]">

        <!-- 描述列显示 -->
        <template #item.description="{ item }">
          <div>{{ item.description.length > 20 ? item.description.substring(0, 20) + '...' : item.description }}</div>
        </template>
        <!-- 成员列显示 -->
        <template #item.memberName="{ item }">
          <div class="member-list">
            <template v-if="item.employees?.length">
              <div v-for="(member, index) in item.employees" :key="index" variant="outlined" class="ma-1">
                <!-- 从 employeeMap 获取员工信息 -->
                <div class="avatar-container">
                  <v-avatar size="24" class="mr-2">
                    <img class="avatar" :src="employeeMap.get(member)?.avatar" v-if="employeeMap.get(member)?.avatar" />
                    <v-icon v-else>account</v-icon>
                  </v-avatar>
                </div>
                {{ employeeMap.get(member)?.name || '未知成员' }}
              </div>
            </template>
            <span v-else class="text-grey">暂无成员</span>
          </div>
        </template>
        <!-- 操作列  -->
        <template #item.actions="{ item }">
          <div class="action-buttons">
            <v-tooltip text="编辑">
              <template #activator="{ props }">
                <v-btn v-bind="props" icon variant="text" color="primary" @click="editTeam(item.teamId)">
                  <v-icon>edit</v-icon>
                </v-btn>
              </template>
            </v-tooltip>
            <!--  添加v-if="isAdmin"，普通员工不可见 -->
            <v-tooltip text="删除">
              <template #activator="{ props }">
                <v-btn v-if="isAdmin" v-bind="props" icon variant="text" color="grey" @click="deleteTeam(item.teamId)">
                  <v-icon>delete</v-icon>
                </v-btn>
              </template>
            </v-tooltip>
          </div>
        </template>
      </v-data-table>
    </v-card>
    <!-- 创建团队对话框 -->
    <v-dialog v-model="createTeamDialogVisible" max-width="600">
      <v-card>
        <v-card-title class="d-flex justify-space-between align-center">
          <span class="text-h5">新建团队</span>
          <v-btn variant="text" color="grey" @click="createTeamDialogVisible = false">
            取消
          </v-btn>
        </v-card-title>
        <v-card-text>
          <v-form @submit.prevent="createTeam">
            <v-text-field v-model="newTeam.name" label="团队名称" required :rules="[v => !!v || '必填项']" />
            <v-textarea v-model="newTeam.description" label="团队描述" rows="3" />
            <v-combobox v-model="newTeam.employees" :items="employees" item-title="name" item-value="employeeId"
              label="选择成员" multiple chips clearable>
              <!-- multiple：允许选择多个选项； chips：显示为标签形式； clearable：显示清除按钮 -->
              <template #selection="{ item }">
                <v-chip>
                  <v-avatar size="24" class="mr-2">
                    <!-- 标签形式下不显示头像 -->
                    <img :src="item.raw.avatar">
                  </v-avatar>
                  {{ item.title }}
                </v-chip>
              </template>
            </v-combobox>
            <v-btn type="submit" color="primary" block>创建</v-btn>
          </v-form>
        </v-card-text>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<style scoped>
.action-buttons {
  opacity: 0.5;
  transition: opacity 0.3s ease;

  .v-data-table__tr:hover & {
    opacity: 1;
  }
}

.avatar-container {
  width: 100px;
  overflow: hidden;
}

.avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.member-list {
  max-height: 120px; /* 设置最大高度 */
  overflow-y: auto; /* 启用垂直滚动条 */
}

/* 滚动条样式 */
.member-list::-webkit-scrollbar {
  width: 5px; /* 滚动条宽度 */
}

.member-list::-webkit-scrollbar-track {
  background: #f1f1f1; /* 滚动条轨道背景色 */
}

.member-list::-webkit-scrollbar-thumb {
  background: #ddd; /* 滚动条滑块颜色 */
  border-radius: 3px; /* 滑块圆角 */
}

.member-list::-webkit-scrollbar-thumb:hover {
  background: #ccc; /* 滑块悬停颜色 */
}
</style>