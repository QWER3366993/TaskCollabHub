<script lang="ts" setup>
import { onMounted, getCurrentInstance } from 'vue';
import { createToast } from 'mosha-vue-toastify';
import {
  usernameRules,
  passwordRules,
  confirmPasswordRules,
  emailRules
} from '@/hooks/useValidRule'
import {
  username,
  password,
  confirmpassword,
  email,
  show1, //密码显示隐藏
  show2  //确认密码显示隐藏
} from '@/hooks/useValidRule'

import { login } from '@/api/user';
import { useRouter } from 'vue-router';

let instance: any;

// 保存当前组件的实例
onMounted(() => {
  instance = getCurrentInstance();
});

const router = useRouter(); // 使用 useRouter 钩子获取 router 实例

const switchMode: () => void = () => {
  router.push('/'); // 跳转到登录页面
};

// 忘记密码跳转：跳转到忘记密码页面
const forgotPassword: () => void = () => {
  router.push('/forget'); // 跳转到重置密码页面
};

const handRegister = async () => {
  const { valid } = await instance.ctx.$refs.form.validate();
  if (valid) {
    if (username.value == '' || password.value == '') {
      createToast('用户名或密码不能为空！', { position: 'top-center', showIcon: true });
    } else {
      try {
        const res = await login({ username: username.value, password: password.value });
        createToast(res.data.msg, { position: 'top-center', showIcon: true });
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
        <h2>注册</h2>
        <v-form @submit.prevent="handRegister">
          <!-- 用户名输入框 -->
          <div class="inputBox">
            <!-- variant="underlined": 设置输入框样式为下划线样式; required: 标记这个字段为必填项。通常配合验证规则一起使用 -->
            <v-text-field variant="underlined" v-model="username" placeholder="Username" :rules="usernameRules" required
              :counter="20" label="账号"></v-text-field>
          </div>

          <!-- 密码输入框 -->
          <div class="inputBox">
            <v-text-field variant="underlined" v-model="password" placeholder="Password"
              :append-icon="show1 ? 'search' : 'search_off'" :rules="passwordRules" required :counter="20" label="密码"
              @click:append="show1 = !show1" :type="show1 ? 'text' : 'password'"></v-text-field>
          </div>

          <!-- 确认密码输入框 -->
          <div class="inputBox">
            <v-text-field variant="underlined" v-model="confirmpassword" placeholder="Confirm Password"
              :rules="confirmPasswordRules" required :counter="20" label="确认密码"
              :append-icon="show2 ? 'search' : 'search_off'" @click:append="show2 = !show2"
              :type="show2 ? 'text' : 'password'"></v-text-field>
          </div>

          <!-- 邮箱输入框 -->
          <div class="inputBox">
            <v-text-field variant="underlined" v-model="email" placeholder="Email" :rules="emailRules" required
              :counter="20" label="输入邮箱"></v-text-field>
          </div>

          <!-- 注册按钮 -->
          <div class="inputBox">
            <button type="submit">注册</button>
          </div>
        </v-form>
      </div>
    </div>
    <!-- 登录跳转 -->
    <a href="#" class="btns signup" @click.prevent="switchMode">已有账号，去登录</a>
    <!-- 忘记密码跳转 -->
    <a href="#" class="btns forget" @click.prevent="forgotPassword">忘记密码？</a>
  </div>
</template>

<style scoped>
@import '/src/assets/css/style.css';
</style>
