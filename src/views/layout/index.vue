<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router';
import { useSettingStore } from '../../stores/setting';
import { useRouteStore } from '@/stores/route'
import Sidebar from './sidebar.vue';
import Sideview from './sideview.vue';
import Tabbar from './tabbar.vue';
import Main from './main.vue';

const routeStore = useRouteStore()
const settingStore = useSettingStore()
const route = useRoute(); // 获取当前路由
const router = useRouter();
const activeMenu = ref(''); // 当前选中的一级菜单

// 根据当前路由初始化 activeMenu
const initActiveMenu = () => {
  const matched = route.matched; //当前路由匹配的路由记录数组（包含嵌套路由信息）
  if (matched.length > 1) {
    activeMenu.value = matched[0].path; // 获取一级菜单路径
  }
};

// 初始化 activeMenu
initActiveMenu();

// 监听路由变化，动态更新 activeMenu
watch(
  () => route.path,
  () => {
    initActiveMenu();
  }
);

const handleMenuClick = (path: string) => {
  activeMenu.value = path; // 更新选中的一级菜单
  router.push(path); // 跳转到一级菜单对应的路径
};

onMounted(() => {
  routeStore.setRoutes();
});
</script>

<template>
  <div class="layout_container">
    <!-- 侧栏菜单 -->
    <div class="layout_sidebar" :class="{ fold: settingStore.fold }">
      <div class="logo">
        <img src="../../../public/logo.png" alt="">
        <p>Planify</p>
      </div>
      <Sidebar :menu-list="routeStore.primaryRoutes" @menu-click="handleMenuClick"></Sidebar>
    </div>

    <!-- 侧栏详情页 -->
    <div class="layout_sideview" :class="{ fold: settingStore.fold }">
      <Sideview :menu-list="routeStore.secondaryRoutes" :active-menu="activeMenu"></Sideview>
    </div>
    <!-- 顶部导航 -->
    <div class="layout_tabbar" :class="{ fold: settingStore.fold }"></div>
    <Tabbar />
    <!-- 内容详情区 -->
    <div class="layout_main" :class="{ fold: settingStore.fold }">
      <RouterView />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.layout_container {
  width: 100%;
  height: 100vh;
  position: relative;
  /* 添加相对定位 */

  .layout_sidebar {
    width: 160px;
    height: 100vh;
    background: white;
    position: absolute;
    /* 添加绝对定位 */
    top: 0;
    left: 0;

    .logo {
      display: flex;
      flex-direction: column;
      /* 将内容排列为垂直方向 */
      align-items: center;
      /* 水平居中对齐 */
      width: 100%;
      height: 200px;
      /* 高度自动适应内容 */
      color: rgb(17, 186, 248);
      /* 文字颜色 */
      padding: 35px;
      /* 内边距，确保内容不紧贴边缘 */


      img {
        width: 80px;
        /* 图片大小 */
        height: 80px;
        margin-bottom: 30px;
        /* 图片和文字之间的间距 */
      }

      p {
        font-size: 35px;
        /* 文字大小 */
        margin: 0;
        /* 移除默认的外边距 */
      }
    }
  }

  .layout_sideview {
    width: 500px;
    height: 100vh;
    /* 添加高度 */
    /* 添加背景色以便查看 */
    position: absolute;
    /* 添加绝对定位 */
    top: 0;
    left: 160px;
    /* 根据侧边栏宽度调整 */
  }

  .layout_tabbar {
    width: calc(100% - 660px);
    height: 50px;
    position: absolute;
    top: 0;
    left: 660px;
  }

  .layout_main {
    width: calc(100% - 660px);
    height: calc(100vh - 50px);
    position: absolute;
    top: 50px;
    left: 660px;
    padding: 20px;
    overflow: auto;
  }
}
</style>