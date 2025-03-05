<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user';
import { fetchTasksByUser } from '@/api/task';
import type { Task } from '@/types/task';

const router = useRouter();
const userStore = useUserStore();
const username = ref(userStore.user.username || '');
const search = ref('');
const tab = ref(0);
const projects = ref<Task[]>([]);

const createProject: () => void = () => {
  router.push('/taskmanagement');
};

const loadProjects = async () => {
  try {
    const fetchedProjects = await fetchTasksByUser();
    console.log('Fetched projects:', fetchedProjects); // 添加日志输出
    projects.value = fetchedProjects;
  } catch (error) {
    console.error('获取项目失败:', error);
  }
};

const filteredProjects = computed(() => {
  return projects.value.filter(project =>
    // toLowerCase用于转换为小写,确保了搜索功能的大小写不敏感
    project.title.toLowerCase().includes(search.value.toLowerCase())
  );
});

const openAddDialog = () => {
  console.log('打开添加选项');
};

const navigateTo = (path: string) => {
  router.push(path);
};

onMounted(() => {
  loadProjects();
});
</script>

<template>
  <v-app>
    <!-- 侧边栏 -->
    <v-navigation-drawer app permanent>
      <v-list>
        <v-list-item prepend-icon="mdi-alpha-t-box" title="项目" @click="navigateTo('/projects')"></v-list-item>
        <v-list-item prepend-icon="mdi-checkbox-marked-circle-outline" title="代办"
          @click="navigateTo('/todo')"></v-list-item>
        <v-list-item prepend-icon="mdi-account" title="我的" @click="navigateTo('/my')"></v-list-item>
        <v-list-item prepend-icon="mdi-calendar" title="日历" @click="navigateTo('/calendar')"></v-list-item>
        <v-list-item prepend-icon="mdi-chat" title="聊天" @click="navigateTo('/chat')"></v-list-item>
        <v-list-item prepend-icon="mdi-dots-horizontal" title="更多" @click="navigateTo('/more')"></v-list-item>
      </v-list>

      <v-divider></v-divider>

      <v-list>
        <v-list-item prepend-icon="mdi-plus" title="添加" @click="openAddDialog"></v-list-item>
      </v-list>

      <template v-slot:append>
        <v-list-item>
          <v-avatar color="primary">{{ username.charAt(0) }}</v-avatar>
          <span class="ml-2">{{ username }}</span>
        </v-list-item>
      </template>
    </v-navigation-drawer>

    <v-main>
      <v-container fluid>
        <v-row>
          <!-- 中间栏：搜索和导航列表 -->
          <v-col cols="12" md="5">
            <v-text-field v-model="search" label="搜索项目或任务" prepend-inner-icon="mdi-magnify" clearable></v-text-field>

            <v-list>
              <v-list-item title="我的项目" @click="navigateTo('/my-projects')"></v-list-item>
              <v-list-item title="我的任务" @click="navigateTo('/participating')"></v-list-item>
            </v-list>
            <v-list>
              <v-list-item title="我指派给他人的" @click="navigateTo('/assigned-by-me')"></v-list-item>
              <v-list-item title="我创建的任务" @click="navigateTo('/created-by-me')"></v-list-item>
              <v-list-item title="我参与的任务" @click="navigateTo('/participating')"></v-list-item>
            </v-list>
          </v-col>
          <!-- 主内容栏：项目展示 -->
          <v-col cols="12" md="7">
            <v-btn color="primary" class="mb-4" @click="createProject">新建项目</v-btn>
            <v-tabs v-model="tab">
              <v-tab>我参与的项目</v-tab>
              <v-tab>我可见的项目</v-tab>
              <v-tab>更多</v-tab>
            </v-tabs>
            <v-window v-model="tab">
              <v-window-item>
                <v-row>
                  <v-col v-for="project in filteredProjects" :key="project.id" cols="12" md="4">
                    <v-card>
                      <v-img :src="project.image" height="150px"></v-img>
                      <v-card-title>{{ project.title }}</v-card-title>
                    </v-card>
                  </v-col>
                  <v-col cols="12" md="4">
                    <v-card outlined @click="createProject">
                      <v-card-title class="text-center">+ 创建项目</v-card-title>
                    </v-card>
                  </v-col>
                </v-row>
              </v-window-item>
            </v-window>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<style scoped></style>