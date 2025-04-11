<script setup lang="ts">
import { useRouter } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';
import { computed, onMounted } from 'vue';
import { useUserStore } from '@/stores/user';

const userStore = useUserStore();
const props = defineProps<{
    menuList: RouteRecordRaw[]; // 一级菜单数据
}>();

const router = useRouter();
const emit = defineEmits(['menu-click']); // 定义事件

const goRoute = (item: RouteRecordRaw) => {
    emit('menu-click', item.path); // 触发事件，通知父组件更新 activeMenu
    router.push(item.path); // 跳转到一级菜单对应的路径
};

// 判断用户是否为管理员
const isAdmin = computed(() => {
  return userStore.user?.authorities?.includes('ROLE_ADMIN') || false;
});

// 根据角色过滤菜单
const filteredMenuList = computed(() => {
  return props.menuList.filter(item => {
    // 如果该菜单需要管理员权限，且用户是管理员，或者不需要管理员权限，则显示
    if (item.meta?.requireAdmin) {
      return isAdmin.value;
    }
    return true; // 不需要管理员权限的菜单显示
  });
});

onMounted(async () => {
    await userStore.getUserInfo();
});
</script>

<template>
    <v-list class="primary-menu">
        <template v-for="item in filteredMenuList" :key="item.path">
            <!-- 渲染一级路由 -->
            <v-list-item :value="item.path" @click="goRoute(item)">
                <template #prepend>
                    <v-icon>{{ item.meta?.icon }}</v-icon>
                </template>
                <v-list-item-title>{{ item.meta?.title }}</v-list-item-title>
            </v-list-item>
        </template>
    </v-list>
</template>