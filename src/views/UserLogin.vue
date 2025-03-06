<script lang="ts" setup>
import { onMounted, getCurrentInstance } from 'vue';
import { createToast } from 'mosha-vue-toastify';
import {
  usernameRules,
  passwordRules,
} from '@/hooks/useValidRule'
import {
  username,
  password,
  show1,
} from '@/hooks/useValidRule'

import { login } from '@/api/user';
import { useRouter } from 'vue-router';

let instance: any;

// 保存当前组件的实例
onMounted(() => {
  instance = getCurrentInstance();
});

const router = useRouter(); // 使用 useRouter 钩子获取 router 实例

// 登录模式切换：从注册页面跳转到登录页面
const switchMode: () => void = () => {
  router.push('/register'); // 跳转到注册页面
};

// 忘记密码跳转：跳转到忘记密码页面
const forgotPassword: () => void = () => {
  router.push('/forget'); // 跳转到重置密码页面
};

const handleLogin = async () => {
  const { valid } = await instance.ctx.$refs.form.validate();
  if (valid) {
    if (username.value == '' || password.value == '') {
      createToast('用户名或密码不能为空！', { position: 'top-center', showIcon: true });
    } else {
      try {
        const res = await login({ username: username.value, password: password.value });
        createToast(res.data.msg, { position: 'top-center', showIcon: true });
        router.push('/index'); // 登录成功后跳转到主页
      } catch (e) {
        alert(e);
        reset(); // 调用 reset 函数重置表单
      }
    }
  }
};

// 通过 instance.ctx 获取当前组件的上下文，并通过 $refs.form 访问到 v-form 元素，然后调用 reset() 方法来重置表单
const reset = () => {
  instance.ctx.$refs.form.reset();
};
</script>

<template>
  <div class="container">
    <div class="drop">
      <div class="content">
        <h2>登录</h2>
        <form @submit.prevent="handleLogin">
          <!-- 用户名输入框 -->
          <div class="inputBox">
            <v-text-field variant="underlined" v-model="username" placeholder="Username" :rules="usernameRules" required
              :counter="20" label="账号"></v-text-field>
          </div>

          <!-- 密码输入框 -->
          <div class="inputBox">
            <v-text-field variant="underlined" v-model="password" placeholder="Password"
              :append-icon="show1 ? 'search' : 'search_off'" :rules="passwordRules" required :counter="20" label="密码"
              @click:append="show1 = !show1" :type="show1 ? 'text' : 'password'"></v-text-field>
          </div>

          <!-- 登录按钮 -->
          <div class="inputBox">
            <button type="submit">登录</button>
          </div>
        </form>
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
