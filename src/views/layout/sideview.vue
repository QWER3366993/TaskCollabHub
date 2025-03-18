<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';

const props = defineProps<{
    menuList: RouteRecordRaw[];
    activeMenu: string; // 当前选中的一级菜单
}>();

const router = useRouter();
const search = ref(''); // 搜索框的内容

// 默认显示当前一级菜单下的二级菜单
const defaultMenuList = computed(() => {
    return props.menuList.filter(item => item.path.startsWith(props.activeMenu));
});

// 全局搜索：过滤所有菜单项（包括一级菜单和二级菜单）
const filteredMenuList = computed(() => {
    if (!search.value) return defaultMenuList.value; // 如果没有搜索内容，返回当前一级菜单下的二级菜单
    return props.menuList.filter(item => {
        const title = (item.meta?.title || '').toString().toLowerCase();
        const query = search.value.toLowerCase();
        return title.includes(query); // 根据标题匹配搜索内容
    });
});

const goRoute = (vc: RouteRecordRaw) => {
    if (vc.name === 'taskscheduling') {
    router.push({
      name: 'taskscheduling',
      params: { 
        taskId: 'new',  // 创建新任务时传递标识
        projectId: 'default' 
      }
    });
  } else {
    router.push(vc.path);
  }
};
</script>

<template>
    <div class="secondary-menu-container">
        <!-- 搜索框 -->
        <!-- placeholder 属性用于输入框为空时显示提示信息; outlined:输入框会显示为带有边框的样式 -->
         <!-- dense:减小输入框的高度和内边距;  clearable:输入框添加一个清除按钮 -->
        <v-text-field v-model="search" label="搜索菜单" placeholder="输入菜单名称" outlined dense clearable
            class="search-box"></v-text-field>
        <!-- 菜单列表 -->
        <v-list class="secondary-menu">
            <template v-for="item in filteredMenuList" :key="item.path">
                <!-- 渲染二级路由 -->
                <v-list-item :value="item.path" @click="goRoute(item)">
                    <template #prepend>
                        <v-icon>{{ item.meta?.icon }}</v-icon>
                    </template>
                    <v-list-item-title>{{ item.meta?.title }}</v-list-item-title>
                </v-list-item>
            </template>
        </v-list>
    </div>
</template>

<style lang="css" scoped>
.search-box {
    margin-bottom: 20px;
    width: 100%;
    height: 50px;
}
</style>