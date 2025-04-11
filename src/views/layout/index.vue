<script setup lang="ts">
import { onMounted, ref, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router';
import { useSettingStore } from '../../stores/setting';
import { useRouteStore } from '@/stores/route'
import SideBar from './SideBar.vue';
import SideView from './SideView.vue';
import TabBar from './TabBar.vue';
import MainContent from './MainContent.vue';

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
        <img src="../../../logo.png" alt="">
        <p style="font-family: 'Arial'; font-weight: bold; font-style: italic; color: #4CAF50;">
          Planify
        </p>
      </div>
      <SideBar :menu-list="routeStore.primaryRoutes" @menu-click="handleMenuClick"></SideBar>
    </div>
    <!-- 全宽内容区域 (当fullWidth为true时) -->
    <div v-if="route.meta.fullWidth" class="layout_fullwidth" :class="{ fold: settingStore.fold }">
      <router-view />
    </div>
    <!-- 标准布局 (当fullWidth为false时) -->
    <template v-else>
      <!-- 侧栏详情页 -->
      <div class="layout_sideview" :class="{ fold: settingStore.fold }">
        <SideView :menu-list="routeStore.secondaryRoutes" :active-menu="activeMenu"></SideView>
      </div>
      <!-- 顶部导航 -->
      <div class="layout_tabbar" :class="{ fold: settingStore.fold }">
        <TabBar />
      </div>
      <!-- 内容详情区 -->
      <div class="layout_main" :class="{ fold: settingStore.fold }">
        <MainContent />
      </div>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.layout_container {
  width: 100%;
  height: 100vh;
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
      height: 230px;
      /* 高度自动适应内容 */
      color: rgb(17, 186, 248);
      /* 文字颜色 */
      padding: 5px;
      /* 内边距，确保内容不紧贴边缘 */


      img {
        width: 125px;
        /* 图片大小 */
        height: 125px;
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
    width: 350px;
    height: 100vh;
    /* 添加高度 */
    /* 添加背景色以便查看 */
    position: absolute;
    /* 添加绝对定位 */
    top: 0;
    left: 160px;
    /* 根据侧边栏宽度调整 */
  }

  //导航栏样式
  .layout_tabbar {
    width: calc(100% - 510px);
    height: 60px;
    position: absolute;
    top: 0;
    left: 510px;
    transition: all 0.5s;
    /* 添加过渡效果 */

    &.fold {
      width: calc(100% - 220px);
      left: 220px;
      transition: all 0.5s;
    }
  }

  .layout_main {
    width: calc(100% - 440px);
    height: calc(100vh - 60px);
    position: absolute;
    top: 60px;
    /* 确保内容不紧贴顶部(修改height后同样需要修改这里，防止页面覆盖) */
    left: 475px;
    padding: 20px;
    overflow: auto;
    transition: all 0.5s;
    background-color: white;

    &.fold {
      width: calc(100% - 255px);
      left: 220px;
      transition: all 0.5s;
    }
  }

  .layout_fullwidth {
    position: absolute;
    top: 0;
    left: 160px;
    width: calc(100% - 160px);
    height: 100vh;
  }
}
</style>
