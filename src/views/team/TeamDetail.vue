<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useTeamStore } from '@/stores/team';
import { useUserStore } from '@/stores/user';
import type { Team, Employee } from '@/types/team';
import { createToast } from 'mosha-vue-toastify';
import dayjs from 'dayjs';

const route = useRoute();
const router = useRouter();
const teamStore = useTeamStore();
const userStore = useUserStore();

// 对话框状态
const addMemberDialogVisible = ref(false);
const deleteTeamDialogVisible = ref(false);
const newEmployeeIds = ref<string[]>([]);

// 当前团队数据
const team = computed(() => teamStore.teamDetail);
const members = computed(() => teamStore.teamMembers);
const teamId = computed(() => route.params.id as string);

// 权限控制
const isManager = computed(() =>
  userStore.user.authorities?.includes('manager') ||
  userStore.user.authorities?.includes('admin')
);

// 加载数据
const loadTeamData = async () => {
  try {
    await Promise.all([
      teamStore.getTeamById(teamId.value),
      teamStore.getTeamMembers(teamId.value),
      teamStore.getEmployees()
    ]);
  } catch (error) {
    createToast('加载团队数据失败', { type: 'danger' });
  }
};

// 添加成员
const addMember = async () => {
  if (newEmployeeIds.value.length === 0) return;

  try {
    // 循环添加每个成员
    await Promise.all(newEmployeeIds.value.map(employeeId => {
      return teamStore.addMember(teamId.value, employeeId);
    }));
    createToast('成员添加成功', { type: 'success' });
    newEmployeeIds.value = [];
    addMemberDialogVisible.value = false;
  } catch (error) {
    createToast('添加成员失败', { type: 'danger' });
  }
};

// 移除成员
const removeMember = async (memberId: string) => {
  if (confirm('确定要移除此成员吗？')) {
    try {
      await teamStore.removeMember(teamId.value, memberId);
      createToast('成员移除成功', { type: 'success' });
    } catch (error) {
      createToast('移除成员失败', { type: 'danger' });
    }
  }
};

// 删除团队
const deleteTeam = async () => {
  try {
    await teamStore.deleteTeamById(teamId.value);
    createToast('团队删除成功', { type: 'success' });
    router.push({ name: 'teammanagement' });
  } catch (error) {
    createToast('删除团队失败', { type: 'danger' });
  }
};

// 初始化加载
onMounted(async () => {
  await userStore.getUserInfo();
  await loadTeamData();
});
</script>

<template>
  <v-container class="team-detail">
    <v-btn color="grey" variant="text" prepend-icon="arrow_back" @click="router.back()" class="mb-4">
      返回列表
    </v-btn>

    <!-- 团队基本信息 -->
    <v-card class="mb-">
      <v-card-title class="d-flex align-center">
        <v-icon large class="mr-3">group</v-icon>
        <div class="flex-grow-1">
          <h2 class="text-h4">{{ team?.name }}</h2>
          <div class="text-caption text-grey-darken-1 mt-1">
            创建时间：{{ dayjs(team?.createdAt).format('YYYY-MM-DD HH:mm') }}
          </div>
        </div>
        <v-btn v-if="isManager" variant="tonal" color="error" prepend-icon="delete"
          @click="deleteTeamDialogVisible = true">
          删除团队
        </v-btn>
      </v-card-title>

      <v-card-text>
        <v-textarea variant="plain" readonly auto-grow :model-value="team?.description" label="团队描述" class="mt-2" />
      </v-card-text>
    </v-card>

    <!-- 成员管理 -->
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2">person</v-icon>
        团队成员（{{ members.length }}人）
        <v-spacer />
        <v-btn v-if="isManager" color="primary" variant="tonal" prepend-icon="add"
          @click="addMemberDialogVisible = true">
          添加成员
        </v-btn>
      </v-card-title>

      <v-data-table :items="members" :headers="[
        { title: '姓名', key: 'name', width: '25%' },
        { title: '职位', key: 'position', width: '25%' },
        { title: '状态', key: 'status', width: '15%' },
        { title: '工作量', key: 'workload', width: '15%' },
        { title: '操作', key: 'actions', width: '20%' }
      ]">
        <template #item.name="{ item }">
          <div class="d-flex align-center">
            <v-avatar size="36" class="mr-3">
              <img :src="item.avatar" v-if="item.avatar">
              <v-icon v-else>account_circle</v-icon>
            </v-avatar>
            <div>
              <div class="font-weight-medium">{{ item.name }}</div>
              <div class="text-caption text-grey">{{ item.employeeId }}</div>
            </div>
          </div>
        </template>

        <template #item.status="{ item }">
          <v-chip :color="item.status === '在职' ? 'success' : 'warning'" variant="tonal">
            {{ item.status }}
          </v-chip>
        </template>

        <template #item.workload="{ item }">
          <v-progress-linear :model-value="item.workload" height="20" color="deep-purple-accent-4" rounded>
            <template #default="{ value }">
              <span class="text-white">{{ value }}%</span>
            </template>
          </v-progress-linear>
        </template>

        <template #item.actions="{ item }">
          <v-btn v-if="isManager" variant="text" color="error" prepend-icon="delete"
            @click="removeMember(item.employeeId)">
            移除
          </v-btn>
        </template>
      </v-data-table>
    </v-card>

    <!-- 添加成员对话框 -->
    <v-dialog v-model="addMemberDialogVisible" max-width="600">
      <v-card>
        <v-card-title class="d-flex justify-space-between align-center">
          <span class="text-h5">添加团队成员</span>
          <v-btn variant="text" color="grey" @click="addMemberDialogVisible = false">
            取消
          </v-btn>
        </v-card-title>
        <v-card-text>
          <v-combobox v-model="newEmployeeIds" :items="teamStore.employees" item-title="name" item-value="employeeId"
            label="选择要添加的成员" multiple clearable chips>
            <template #selection="{ item }">
              <v-chip>
                <v-avatar size="24" class="mr-2">
                  <img :src="item.raw.avatar" v-if="item.raw.avatar">
                  <v-icon v-else>person</v-icon>
                </v-avatar>
                {{ item.title }}
              </v-chip>
            </template>
          </v-combobox>
          <div class="d-flex justify-end mt-4">
            <v-btn color="primary" @click="addMember" class="ml-4">确认添加</v-btn>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- 删除团队确认对话框 -->
    <v-dialog v-model="deleteTeamDialogVisible" max-width="400">
      <v-card>
        <v-card-title class="text-h6">确认删除团队？</v-card-title>
        <v-card-text>
          此操作将永久删除该团队及所有关联数据！
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="error" @click="deleteTeam">确认删除</v-btn>
          <v-btn @click="deleteTeamDialogVisible = false">取消</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<style scoped>
.team-detail {
  max-width: 1200px;
  margin: 0 auto;
}

.v-progress-linear {
  min-width: 120px;
}

:deep(.v-data-table-header__content) {
  white-space: nowrap;
}
</style>