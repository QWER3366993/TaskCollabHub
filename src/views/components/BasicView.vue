<script setup lang="ts">
import { ref, onMounted } from 'vue';
import '@/assets/main.css'

// src（图片路径）、alt（图片描述）属性
const slides = ref([
    { src: '/carousel/1.png', alt: 'Slide 1' },
    { src: '/carousel/2.png', alt: 'Slide 2' },
    { src: '/carousel/3.png', alt: 'Slide 3' },
    { src: '/carousel/4.png', alt: 'Slide 4' },
    { src: '/carousel/5.png', alt: 'Slide 5' },
]);

// 在组件加载时预加载图片，避免轮播时出现空白
onMounted(() => {
  slides.value.forEach(slide => {
    const img = new Image();
    img.src = slide.src;
  });
});
</script>

<template>
    <v-app>
        <v-container fluid class="fill-container">
            <!-- Vuetify 的轮播图组件 -->
            <!--导航控制部分仅在鼠标悬停时才出现、cycle属性自动轮播、interval设置其轮播间隔、隐藏轮播分隔符 hide-delimiters -->
            <v-carousel show-arrows="hover" cycle interval='5000' hide-delimiters>
                <v-carousel-item v-for="(slide, i) in slides" :key="i">
                    <div>
                        <img :src="slide.src" :alt="slide.alt" class="carousel-image" loading="lazy" />                    </div>
                </v-carousel-item>
            </v-carousel>
        </v-container>
        <!-- 覆盖层，放在轮播图之上 -->
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
