<script setup lang="ts">
import { useRouter } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';

const props = defineProps<{
    menuList: RouteRecordRaw[]; // 一级菜单数据
}>();

const router = useRouter();
const emit = defineEmits(['menu-click']); // 定义事件

const goRoute = (item: RouteRecordRaw) => {
    emit('menu-click', item.path); // 触发事件，通知父组件更新 activeMenu
    router.push(item.path); // 跳转到一级菜单对应的路径
};
</script>

<template>
    <v-list class="primary-menu">
        <template v-for="item in props.menuList" :key="item.path">
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