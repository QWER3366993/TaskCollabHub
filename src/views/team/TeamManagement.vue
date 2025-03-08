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
  <v-container>
    <h2>Teams</h2>
    <v-btn color="primary" @click="createTeamDialogVisible = true">Create Team</v-btn>

    <v-data-table :items="Array.from(teamStore.teams.values())" style="width: 100%">
      <v-data-table-column header="Name" key="name">
        <template v-slot:item="{ item }">
          {{ item.name }}
        </template>
      </v-data-table-column>
      <v-data-table-column header="Description" key="description">
        <template v-slot:item="{ item }">
          {{ item.description }}
        </template>
      </v-data-table-column>
      <v-data-table-column header="Actions" key="actions">
        <template v-slot:item="{ item }">
          <v-btn @click="editTeam(item.id)">Edit</v-btn>
          <v-btn @click="getTeamMembers(item.id)">View Members</v-btn>
        </template>
      </v-data-table-column>
    </v-data-table>

    <!-- 创建团队对话框 -->
    <v-dialog v-model="createTeamDialogVisible" max-width="500px">
      <v-card>
        <v-card-title>
          <span class="text-h5">Create Team</span>
        </v-card-title>
        <v-card-text>
          <v-form>
            <v-container>
              <v-row>
                <v-col cols="12">
                  <v-text-field v-model="newTeam.name" label="Name" required></v-text-field>
                </v-col>
                <v-col cols="12">
                  <v-text-field v-model="newTeam.description" label="Description" required></v-text-field>
                </v-col>
              </v-row>
            </v-container>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue darken-1"  @click="createTeamDialogVisible = false">Cancel</v-btn>
          <v-btn color="blue darken-1"  @click="createTeam">Create</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 显示团队成员 -->
    <v-data-table v-if="teamStore.teamMembers.length" :items="teamStore.teamMembers" style="width: 100%">
      <v-data-table-column header="Member Name" key="name">
        <template v-slot:item="{ item }">
          {{ item.name }}
        </template>
      </v-data-table-column>
      <v-data-table-column header="Actions" key="actions">
        <template v-slot:item="{ item }">
          <v-btn @click="removeMember(selectedTeamId, item.id)">Remove</v-btn>
          <v-btn @click="addMember(selectedTeamId, 'newMemberId')">Add Member</v-btn>
        </template>
      </v-data-table-column>
    </v-data-table>
  </v-container>
</template>