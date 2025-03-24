import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Ref } from 'vue'
import type { RouteRecordRaw } from "vue-router";

// 引入路由
import router from '@/router'

// 定义 Store 的状态类型
interface RouteState {
    menuRoutes: RouteRecordRaw[];
}

// 定义 Store 返回的对象类型
interface RouteStore {
    primaryRoutes: Ref<RouteRecordRaw[]>
    secondaryRoutes: Ref<RouteRecordRaw[]>
    setRoutes: () => void
}

export const useRouteStore = defineStore('route', (): RouteStore => {
    // 状态
    const primaryRoutes = ref<RouteRecordRaw[]>([]); // 父路由
    const secondaryRoutes = ref<RouteRecordRaw[]>([]); // 子路由
    // 设置路由
    const setRoutes = () => {
        const routes = router.getRoutes().filter(route => !route.meta.hidden);
        // 提取一级路由
        primaryRoutes.value = routes.filter(route =>
            // 排除带父路径的子路由（路径中包含 '/' 的路由）
            // 对于路径 /index，split('/') 的结果是 ['', 'index']，长度为 2
            route.path.split('/').length ===2 );

        //提取二级路由（通过扁平化数据直接提取子路由）
        secondaryRoutes.value = routes.filter(route => {
            // 排除根路径
            if (route.path === '/') return false;
            // 找到是子路由的路由
            return routes.some(parentRoute => {
                // 父路由必须包含子路由
                return parentRoute.children?.some(child => {
                    // 判断当前路由是否是父路由的子路由
                    return `${parentRoute.path}/${child.path}` === route.path;
                });
            });
        });
        // // 打印数据到控制台
        // console.log('父 Routes:', primaryRoutes.value);
        // console.log('子 Routes:', secondaryRoutes.value);
        // console.log('All Routes:', router.getRoutes());
    };

    return {
        primaryRoutes,
        secondaryRoutes,
        setRoutes,
    };
});