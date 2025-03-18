<!-- src/views/ForgotPassword.vue -->
<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { createToast } from 'mosha-vue-toastify'
import { post } from '@/utils/request'
import {
  emailRules,
  passwordRules,
  confirmPasswordRules
} from '@/hooks/useValidRule'
import {
  email,
  password,
  confirmpassword,
  show1,
  show2
} from '@/hooks/useValidRule'

const router = useRouter()
// 用于追踪当前激活的步骤（0表示邮箱验证，1表示密码重置）
const activeStep = ref(0)
// 用于追踪发送验证码后的冷却时间（秒）
const coldTime = ref(0)
// 引用表单的DOM元素
const formRef = ref()

// 用于存储验证码的表单数据
const form = reactive({
  email: '',
  code: '',
  password: '',
  password_repeat: ''
})

// 验证电子邮件格式
const isEmailValid = ref(false)
const onEmailValidate = (valid: boolean) => {
  isEmailValid.value = valid
}

// 发送验证码
const sendVerificationCode = async () => {
  if (!isEmailValid.value) return // 如果邮箱无效，则不发送

  coldTime.value = 60 // 设置冷却时间为60秒
  post('/auth/valid-reset-email', { email: email.value },
    (message: string) => {
      createToast(message, { position: 'top-center', showIcon: true })
      // 设置一个定时器来减少冷却时间
      const timer = setInterval(() => {
        coldTime.value--
        // 冷却时间结束则停止定时器
        if (coldTime.value <= 0) clearInterval(timer)
      }, 1000)
    },
    (error: string) => {
      createToast(error, { position: 'top-center', showIcon: true, type: 'danger' })
      coldTime.value = 0 // 重置冷却时间
    }
  )
}

// 提交验证
const verifyCode = async () => {
  const { valid } = await formRef.value.validate() // 验证表单
  if (valid) {
    // 如果表单有效，发送请求以开始重置密码流程
    post('/auth/start-reset', {
      email: email.value,
      code: form.code
    }, () => {
      activeStep.value = 1 // 成功则切换到密码重置步骤
    })
  }
}

// 执行密码重置
const resetPassword = async () => {
  const { valid } = await formRef.value.validate()
  if (valid) {
    post('/auth/do-reset', { password: password.value },
      (message: string) => {
        createToast(message, { position: 'top-center', showIcon: true })
        router.push('/') // 重置成功后重定向到登录页面
      }
    )
  }
}
</script>

<template>
  <div class="container">
    <div class="drop">
      <div class="content">
        <!-- v-stepper 实现步骤条 -->
        <v-stepper v-model="activeStep" alt-labels>
          <v-stepper-header>
            <v-stepper-item title="验证邮箱" value="0"></v-stepper-item>
            <v-divider></v-divider>
            <v-stepper-item title="重置密码" value="1"></v-stepper-item>
          </v-stepper-header>
        </v-stepper>
        <!-- 使用Vue的过渡效果来切换步骤内容 -->
        <transition name="slide-fade" mode="out-in">
          <!-- 邮箱验证步骤 -->
          <div v-if="activeStep === 0" key="step1">
            <h2>重置密码</h2>
            <p class="tip-text">请输入注册时使用的电子邮件地址</p>
            <v-form ref="formRef" @submit.prevent="verifyCode">
              <div class="inputBox">
                <v-text-field v-model="email" label="电子邮箱" placeholder="example@domain.com" :rules="emailRules"
                  @update:modelValue="onEmailValidate" variant="underlined"></v-text-field>
              </div>

              <div class="inputBox">
                <v-text-field v-model="form.code" label="验证码" placeholder="6位数字验证码"
                  :rules="[(v: string) => !!v || '验证码不能为空']" variant="underlined">
                  <!-- 是 v-model 中绑定的变量，这里是 form.code -->
                  <template #append>
                    <v-btn :disabled="!isEmailValid || coldTime > 0" @click="sendVerificationCode" color="success"
                      variant="text">
                      {{ coldTime > 0 ? `${coldTime}秒后重试` : '获取验证码' }}
                    </v-btn>
                  </template>
                </v-text-field>
              </div>

              <div class="inputBox">
                <button type="submit">下一步</button>
              </div>
            </v-form>
          </div>
          <!-- 密码重置步骤 -->
          <div v-else key="step2">
            <h2>设置新密码</h2>
            <p class="tip-text">请输入您的新密码</p>

            <v-form ref="formRef" @submit.prevent="resetPassword">
              <div class="inputBox">
                <v-text-field v-model="password" label="新密码" placeholder="6-16位字符" :rules="passwordRules"
                  :type="show1 ? 'text' : 'password'" variant="underlined">
                  <template #append>
                    <v-icon @click="show1 = !show1">
                      {{ show1 ? 'search_off' : 'search' }}
                    </v-icon>
                  </template>
                </v-text-field>
              </div>

              <div class="inputBox">
                <v-text-field v-model="confirmpassword" label="确认密码" placeholder="再次输入密码" :rules="confirmPasswordRules"
                  :type="show2 ? 'text' : 'password'" variant="underlined">
                  <template #append>
                    <v-icon @click="show2 = !show2">
                      {{ show2 ? 'search_off' : 'search' }}
                    </v-icon>
                  </template>
                </v-text-field>
              </div>

              <div class="inputBox">
                <button type="submit">确认重置</button>
              </div>
            </v-form>
          </div>
        </transition>

        <a href="#" class="btns signup" @click.prevent="router.push('/')">返回登录</a>
        <a href="#" class="btns forget" @click.prevent="router.push('/register')">立即注册</a>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import '/src/assets/css/style.css';

.v-stepper-header {
  height: 60px;
  /* 设置固定高度 */
  display: flex;
  align-items: center;
}

/* 自定义 v-stepper 样式 */
.v-stepper {
  background-color: transparent;
  /* 盒子阴影 */
  box-shadow: none;
  /* 确保步骤条宽度充满容器 */
  width: 290px;
  /* 调整与下方内容的间距 */
  margin-bottom: 3px;

}

.v-stepper-item {
  font-size: 1em;
  color: #333;
  background-color: transparent;
  /* 透明背景 */
}

.v-stepper-item--active {
  color: #01b4ff;
  /* 激活状态的颜色 */
  font-weight: bold;
}

.v-divider {
  flex-grow: 10;
  margin: 0 10px;
  /* 调整分隔线的间距 */
}
</style>