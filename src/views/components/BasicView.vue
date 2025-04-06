<script setup lang="ts">
import { ref, onMounted } from 'vue';
import '@/assets/main.css'


const backgroundImage = '/background.jpg'; // 替换为您的单张图片路径

// 预加载图片，避免空白
onMounted(() => {
  const img = new Image();
  img.src = backgroundImage;
});
</script>

<template>
    <v-app>
        <v-container fluid class="fill-container">
            <!-- 显示单张背景图片 -->
            <img :src="backgroundImage" alt="Background Image" class="background-image" />
        </v-container>
        <!-- 覆盖层，放在背景图片之上 -->
        <div class="overlay">
            <router-view />
        </div>
    </v-app>
</template>

<style scoped>
.fill-container {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  width: 100vw;
}

.background-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-size: cover;  /* 确保图片覆盖整个容器 */
  background-position: center;  /* 图片居中 */
  background-repeat: no-repeat;  /* 防止图片重复 */
  z-index: 1;
}

.overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 2;
  display: flex;
  justify-content: center;
  align-items: center;
  pointer-events: none;
  /* 使覆盖层不响应鼠标事件，鼠标事件透过覆盖层作用于下面的背景图 */
}

.overlay>* {
  pointer-events: auto;
  /* 使覆盖层内的子元素响应鼠标事件 */
}

.fill-container {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    width: 100vw;
}

.carousel-image {
    position: absolute;
    width: 100%;
    height: 100%;
    /* 保持图片的纵横比并覆盖整个容器 */
    object-fit: contain ;
    overflow-x: hidden;

}

.overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 2;
    display: flex;
    justify-content: center;
    align-items: center;
    pointer-events: none;
    /* 使覆盖层不响应鼠标事件，鼠标事件透过覆盖层作用于下面的轮播图 */
}



.overlay>* {
    pointer-events: auto;
    /* 使覆盖层内的子元素响应鼠标事件 */
}
</style>
