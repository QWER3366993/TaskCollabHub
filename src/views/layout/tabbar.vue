<script setup lang="ts">
import { ref, computed } from 'vue';
import { useSettingStore } from '@/stores/setting';
import { useRoute, useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user';

const userStore = useUserStore();
const route = useRoute();
const router = useRouter();
const settingStore = useSettingStore();

// 折叠
const changeIcon = () => {
  settingStore.fold = !settingStore.fold;
};

// 刷新
const refresh = () => {
  settingStore.refresh = !settingStore.refresh;
};

// 全屏
const fullScreen = () => {
  // DOM对象的一个属性：用于判断是否是全屏
  const full = document.fullscreenElement;
  if (!full) {
    document.documentElement.requestFullscreen(); // 全屏
  } else {
    document.exitFullscreen(); // 退出全屏
  }
};

// 面包屑图标类型定义
interface BreadcrumbItemWithIcon {
  title: string;
  href?: string;
  disabled?: boolean;
  icon?: string
}

// 不存在头像时提供默认头像
const avatarSrc = computed(() => userStore.user.avatar || '/admin.png');
// 退出登录
const logout = async () => {
  await userStore.logout();
  router.push({ path: '/', query: { redirect: route.path } });
};

// 颜色选择器
const color = ref('rgba(255, 69, 0, 0.68)');
const predefineColors = ref([
  ['#ff4500', '#ff8c00', '#ffd700'],
  ['#90ee90', '#00ced1', '#1e90ff'],
  ['#c71585', 'rgba(255, 69, 0, 0.68)', 'rgb(255, 120, 0)'],
  ['hsv(51, 100, 98)', 'hsva(120, 40, 94, 0.5)', 'hsl(181, 100%, 37%)'],
  ['hsla(209, 100%, 56%, 0.73)', '#c7158577']
]);


// 切换主题颜色
const setColor = () => {
  const el = document.documentElement;
  el.style.setProperty('--el-color-primary', color.value);
};

// 暗黑模式
const dark = ref(false);

// 处理暗黑模式
const changeDark = () => {
  const html = document.documentElement;
  dark.value ? (html.className = 'dark') : (html.className = '');
};

// 处理 breadcrumbs 数据
const breadcrumbItems = computed(() => {
  return route.matched.map(item => ({ //获取匹配到的路由
    title: String(item.meta?.title || ''), // 显式转换为字符串
    disabled: false,
    href: item.path,
    icon: item.meta?.icon ? String(item.meta.icon) : ''
  }));
});
</script>

<template>
  <div class="tabbar">
    <!-- 左侧 -->
    <div class="tabbar_left">
      <v-icon class="icon" @click="changeIcon">
        {{ settingStore.fold ? 'menu_' : 'menu_open' }}
      </v-icon>
      <!-- 面包屑 使用 divider 插槽自定义分隔线;使用 prepend 插槽添加前缀内容-->
      <v-breadcrumbs :items="breadcrumbItems" v-if="breadcrumbItems.length > 0">
        <template v-slot:divider>
          <v-icon>chevron_right</v-icon>
        </template>
        <template v-slot:item="{ item }">
          <v-breadcrumbs-item v-if="item.title" :to="item.href" :disabled="item.disabled">
            <v-icon size="18">{{ (item as BreadcrumbItemWithIcon ).icon }}</v-icon>
            {{ item.title }}
          </v-breadcrumbs-item>
        </template>
      </v-breadcrumbs>
    </div>

    <!-- 右侧 -->
    <div class="tabbar_right">
      <v-btn icon size="35px" @click="refresh">
        <v-icon>refresh</v-icon>
      </v-btn>
      <v-btn icon size="35px" @click="fullScreen">
        <v-icon>fullscreen</v-icon>
      </v-btn>
      <v-menu>
        <template v-slot:activator="{ props }">
          <v-btn icon size="35px" v-bind="props">
            <v-icon>settings</v-icon>
          </v-btn>
        </template>
        <v-card>
          <v-card-title>主题设置</v-card-title>
          <v-card-text>
            <v-form>
              <v-text-field label="主题颜色" v-model="color" />
              <v-color-picker v-model="color" @update:modelValue="setColor" show-alpha :swatches="predefineColors" />
              <v-text-field label="暗黑模式" style="margin-top: 20px;" />
              <v-switch v-model="dark" @change="changeDark" />
            </v-form>
          </v-card-text>
        </v-card>
      </v-menu>
      <v-avatar size="38" >
        <img :src="avatarSrc" alt="用户头像" />
        </v-avatar>
      <v-menu>
        <template v-slot:activator="{ props }">
          <v-btn v-bind="props">
            {{ userStore.user.username }}
            <v-icon>keyboard_arrow_down</v-icon>
          </v-btn>
        </template>
        <v-list>
          <v-list-item @click="logout">
            <v-list-item-title>退出登录</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.tabbar {
  width: 100%;
  position: absolute;
  top: 0;
  display: flex;
  justify-content: space-between;
  padding: 0 15px 0 20px;
  background-image: linear-gradient(to right, rgb(189, 245, 178), rgb(67, 240, 28), rgb(148, 225, 140));
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  /* 添加阴影 */

  .tabbar_left {
    display: flex;
    align-items: center; //竖直居中


    .icon {
      margin-right: 7px;
      // cursor: pointer;
    }
  }

  .tabbar_right {
    display: flex;
    align-items: center;
    gap: 10px;
    /* 按钮间距 */

    img {
      width: 100%;
      height:100%;
      object-fit: cover; /* 保持比例填充容器 */
      
    }
  }
}
</style>