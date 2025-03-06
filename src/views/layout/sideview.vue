<script setup lang="ts">
import { defineProps } from 'vue';
import { useRouter } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';

const props = defineProps<{
    menuList: RouteRecordRaw[];
}>();

const router = useRouter();

const goRoute = (vc: RouteRecordRaw) => {
    router.push(vc.path);
};
</script>

<template>
    <v-list class="secondary-menu">
        <template v-for="item in props.menuList" :key="item.path">
            <!-- 渲染二级路由 -->
                <v-list-item :value="item.path" @click="goRoute(item)">
                    <template #prepend>
                        <v-icon>{{ item.meta?.icon }}</v-icon>
                    </template>
                    <v-list-item-title>{{ item.meta?.title }}</v-list-item-title>
                </v-list-item>
        </template>
    </v-list>
</template>