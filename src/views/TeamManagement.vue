<script lang="ts" setup>
import { ref, onMounted, watchEffect } from 'vue'; 
import { useTeamStore } from '@/stores/team';
import { useRouter } from 'vue-router';

// 引入 team store 和 router 实例
const teamStore = useTeamStore();
const router = useRouter();

// 控制创建团队对话框的显隐
const createTeamDialogVisible = ref(false);
// 新团队数据
const newTeam = ref({ name: '', description: '' });
// 当前选中的团队ID
const selectedTeamId = ref('');

// 获取团队列表
onMounted(() => {
  teamStore.getTeamList();  // 加载团队列表
});

// 监听 teams 数据变化，保证每次获取后更新 UI
watchEffect(() => {
  if (teamStore.teams.size > 0) {
    const firstTeam = Array.from(teamStore.teams.values())[0];
    if (firstTeam) {
    selectedTeamId.value = firstTeam.id || '';  // 设置默认选中的团队ID
    teamStore.getTeamMembers(selectedTeamId.value);  // 加载默认团队成员
  }
}
});

// 创建团队
const createTeam = async () => {
  await teamStore.createNewTeam(newTeam.value);
  createTeamDialogVisible.value = false;  // 关闭对话框
  teamStore.getTeamList();  // 重新加载团队列表
};

// 编辑团队
const editTeam = (teamId: string) => {
  router.push(`/teams/${teamId}/edit`);  // 跳转到编辑团队页面
};

// 加载团队成员
const getTeamMembers = async (teamId: string) => {
  await teamStore.getTeamMembers(teamId);  // 调用 store 获取成员
  selectedTeamId.value = teamId;  // 更新当前团队ID
};

// 添加成员
const addMember = async (teamId: string, memberId: string) => {
  await teamStore.addMember(teamId, memberId);  // 调用 store 添加成员
};

// 删除成员
const removeMember = async (teamId: string, memberId: string) => {
  await teamStore.removeMember(teamId, memberId);  // 调用 store 移除成员
};
</script>

<template>
  <div>
    <h2>Teams</h2>
    <el-button type="primary" @click="createTeamDialogVisible = true">Create Team</el-button>

    <el-table :data="teamStore.teams" style="width: 100%">
      <el-table-column prop="name" label="Name"></el-table-column>
      <el-table-column prop="description" label="Description"></el-table-column>
      <el-table-column label="Actions">
        <template #default="{ row }">
          <el-button @click="editTeam(row.id)">Edit</el-button>
          <el-button @click="getTeamMembers(row.id)">View Members</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 创建团队对话框 -->
    <el-dialog title="Create Team" v-model:visible="createTeamDialogVisible">
      <el-form :model="newTeam">
        <el-form-item label="Name">
          <el-input v-model="newTeam.name" placeholder="Enter team name"></el-input>
        </el-form-item>
        <el-form-item label="Description">
          <el-input v-model="newTeam.description" placeholder="Enter team description"></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createTeamDialogVisible = false">Cancel</el-button>
        <el-button type="primary" @click="createTeam">Create</el-button>
      </template>
    </el-dialog>

    <!-- 显示团队成员 -->
    <el-table v-if="teamStore.teamMembers.length" :data="teamStore.teamMembers" style="width: 100%">
      <el-table-column prop="name" label="Member Name"></el-table-column>
      <el-table-column label="Actions">
        <template #default="{ row }">
          <el-button @click="removeMember(selectedTeamId, row.id)">Remove</el-button>
          <el-button @click="addMember(selectedTeamId, 'newMemberId')">Add Member</el-button>
        </template>
      </el-table-column>
    </el-table>

  </div>
</template>