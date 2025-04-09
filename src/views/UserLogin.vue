<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import { createToast } from 'mosha-vue-toastify';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user';
import { login } from '@/api/user';
import { usernameRules, passwordRules, username, password, show1 } from '@/hooks/useValidRule';
import { VForm } from 'vuetify/components/VForm'; // 明确导入类型
import { storeToRefs } from 'pinia';
import { convertToHash } from '@/utils/crypto'

const router = useRouter(); // 使用 useRouter 钩子获取 router 实例
const userStore = useUserStore();
const { token } = storeToRefs(userStore)


// 表单引用
const formRef = ref<InstanceType<typeof VForm>>();

// 登录模式切换：从注册页面跳转到登录页面
const switchMode: () => void = () => {
  router.push('/register'); // 跳转到注册页面
};

// 忘记密码跳转：跳转到忘记密码页面
const forgotPassword: () => void = () => {
  router.push('/forget'); // 跳转到重置密码页面
};

// 登录处理
const handleLogin = async () => {
  if (!formRef.value) {
    console.error('表单引用未初始化');
    return;
  }
  const { valid } = await formRef.value.validate();
  if (valid) {
    const user = { username: username.value, password: convertToHash(password.value) }
    try {
      // 发送登录请求返回token
      const response = await login(user)
      // 确保后端返回了 token
      if (!response) {
        throw new Error('登录失败：未返回 Token');
      }
      if (token) {
        await userStore.getUserInfo();
        await router.push('/noticeboard1');
      }
    } catch (error) {
      reset()
      throw error; // 这里要抛出错误，以便在 loginUser 方法中捕获
    }
  }
};

// 通过 instance.ctx 获取当前组件的上下文，并通过 $refs.form 访问到 v-form 元素，然后调用 reset() 方法来重置表单
// 重置表单
const reset = () => {
  if (formRef.value) {
    formRef.value.reset();
  }
};

</script>

<template>
  <div class="container">
    <div class="drop">
      <div class="content">
        <h2>登录</h2>
        <v-form ref="formRef" @submit.prevent="handleLogin">
          <!-- 用户名输入框 -->
          <div class="inputBox">
            <v-text-field variant="underlined" v-model="username" placeholder="Username" :rules="usernameRules" required
              :counter="20" label="账号"></v-text-field>
          </div>

          <!-- 密码输入框 -->
          <div class="inputBox">
            <v-text-field variant="underlined" v-model="password" placeholder="Password"
              :append-icon="show1 ? 'search' : 'search_off'" :rules="passwordRules" required :counter="20" label="密码"
              @click:append="show1 = !show1" :type="show1 ? 'text' : 'password'"
              autocomplete="current-password"></v-text-field>
          </div>

          <!-- 登录按钮 -->
          <div class="inputBox">
            <button type="submit">登录</button>
          </div>
        </v-form>
      </div>
    </div>
    <!-- 注册跳转 -->
    <a href="#" class="btns signup" @click.prevent="switchMode">没有账号，去注册</a>
    <!-- 忘记密码跳转 -->
    <a href="#" class="btns forget" @click.prevent="forgotPassword">忘记密码？</a>
  </div>
</template>

<style scoped>
@import '/src/assets/css/style.css';
</style>
