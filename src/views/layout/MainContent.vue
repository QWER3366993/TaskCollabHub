<script setup lang="ts">
import { watch, ref, nextTick } from 'vue'
import { useSettingStore } from '@/stores/setting'

const settingStore = useSettingStore()

// 控制当前组件是否重建销毁（一开始存在数据）
const flag = ref(true)

// 点击刷新按钮，路由组件销毁
watch(() => settingStore.refresh, () => {
  flag.value = false
  // nextTick：当 DOM 更新完毕，立即执行方法体
  nextTick(() => {
    flag.value = true
  })
})
</script>

<template>
<div class="main-content-wrapper">
    <router-view v-slot="{ Component }">
      <transition name="fade">
        <!-- v-if 可以控制组件重建与销毁 -->
        <component :is="Component" v-if="flag" />
      </transition>
    </router-view>
  </div>
</template>

<style lang="scss" scoped>
.main-content-wrapper {
  width: 100%;
  max-width: 2628px; /* 统一最大宽度 */
  margin: 0 auto;    /* 居中 */
}

.fade-enter-from {
  opacity: 0; //透明度
  transform: scale(0);
}

.fade-enter-active {
  transition: all 0.5s; //过渡动画时间
}

.fade-enter-to {
  opacity: 1;
  transform: scale(1);
}

</style>