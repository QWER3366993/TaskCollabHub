<!-- 个人资料 -->
<script lang='ts' setup>
import { ref, watch, reactive, computed, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { useTeamStore } from '@/stores/team'
import type { Team, Employee } from '@/types/team'
import type { User } from '@/types/user'
import { createToast } from 'mosha-vue-toastify'
import {
  passwordRules,
  confirmPasswordRules,
  emailRules,
} from '@/hooks/useValidRule'

// 公共状态
const loading = ref(true)
const tab = ref('basic')

// 编辑状态
const isEditing = ref(false)
const originalProfile = reactive({
  name: '',
  email: '',
  phone: ''
})

// 个人信息表单
const profileForm = reactive({
  name: '',
  email: '',
  phone: ''
})

// 密码修改相关状态
const showPasswordDialog = ref(false)
const passwordLoading = ref(false)
const showPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)

const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// 邮箱修改相关状态
const showEmailDialog = ref(false)
const emailForm = reactive({
  newEmail: '',
  verificationCode: '',
  currentPassword: ''
})

const emailError = ref<string>('')
const isEmailValid = ref(false)
const emailLoading = ref(false)
const showVerification = ref(false)
const codeCountdown = ref(0)

// 表单验证规则
const requiredRule = (v: string) => !!v || '必须输入内容'
const phoneRules = [
  (v: string) => !!v || '请输入手机号',
  (v: string) => /^1[3-9]\d{9}$/.test(v) || '手机号格式不正确'
]

// Store 初始化
const userStore = useUserStore()
const teamStore = useTeamStore()

// 头像相关
const avatarFile = ref<File>()

// 定义默认的 Employee 对象
const defaultEmployee: Employee = {
  teamId: '',
  employeeId: '',
  userId: '',
  name: '未设置',
  position: '未设置',
  authorities: [],
  workload: 0,
  status: '未知',
  online: false,
  avatar: '/default-avatar.png'
};

const isPasswordFormValid = computed(() => {
  return (
    passwordForm.oldPassword &&
    passwordForm.newPassword &&
    passwordForm.confirmPassword &&
    passwordForm.newPassword === passwordForm.confirmPassword
  )
})

// 计算属性（当前员工）
const employee = computed(() => {
  // 优先使用已存储的当前员工
  if (teamStore.currentEmployee) {
    return teamStore.currentEmployee
  }
  // 次之从用户信息关联获取
  if (userStore.employee) {
    const emp = teamStore.employees.find(
      e => e.employeeId === userStore.employee?.employeeId
    )
    if (emp) return emp
  }

  return defaultEmployee
})

const user = computed<User>(() => userStore.user || {})

const involvedTeam = computed<Team | null>(() =>
  teamStore.availableTeams.find(t => t.id === employee.value.teamId) || null
)
const userAvatar = computed(() =>
  user.value.avatar || employee.value.avatar || '/default-avatar.png'
)
const statusColor = computed(() =>
  employee.value.online
    ? employee.value.status === '在职' ? 'success' : 'warning'
    : 'error'
)

// 初始化表单数据
const initProfileForm = () => {
  const nameSource = employee.value.name || ''
  const emailSource = user.value.email || ''
  const phoneSource = user.value.phone || ''

  profileForm.name = employee.value.name
  profileForm.email = user.value.email || ''
  profileForm.phone = user.value.phone || ''

  // 保存原始数据用于取消时恢复
  originalProfile.name = nameSource
  originalProfile.email = emailSource
  originalProfile.phone = phoneSource
}

// 进入编辑模式
const enterEditMode = () => {
  isEditing.value = true
}

// 取消编辑
const cancelEdit = () => {
  Object.assign(profileForm, originalProfile)
  isEditing.value = false
}

const passwordPanel = ref<number | null>(null)
const emailPanel = ref<number | null>(null)

// 修改原对话框相关逻辑
watch(passwordPanel, (newVal) => {
  if (newVal === null) {
    // 重置表单
    Object.assign(passwordForm, {
      oldPassword: '',
      newPassword: '',
      confirmPassword: ''
    })
  }
})

watch(emailPanel, (newVal) => {
  if (newVal === null) {
    Object.assign(emailForm, {
      newEmail: '',
      verificationCode: '',
      currentPassword: ''
    })
  }
})

// 保存个人信息
const saveProfile = async () => {
  try {
    const updatedUser = await userStore.updateUser({
      ...user.value,
      ...profileForm
    })
    createToast('个人信息更新成功', { type: 'success' })
    isEditing.value = false
  } catch (error) {
    console.error('个人信息更新失败:', error)
    createToast('更新失败，请稍后重试', { type: 'danger' })
  }
}

// 头像上传方法
const uploadAvatar = async () => {
  if (!avatarFile.value) return
  try {
    const newAvatarUrl = await userStore.updateAvatar(avatarFile.value)

    if (teamStore.currentEmployee) {
      await teamStore.updateEmployee(
        teamStore.currentEmployee.employeeId,
        { avatar: newAvatarUrl }
      )
    }

    createToast('头像更新成功', { type: 'success' })
  } catch (error) {
    console.error('头像上传失败:', error)
    createToast('头像更新失败', { type: 'danger' })
  } finally {
    avatarFile.value = undefined
  }
}

// 密码修改提交
const handlePasswordSubmit = async () => {
  try {
    passwordLoading.value = true;

    // 调用 updateUser 进行密码更新
    await userStore.updateUserPassword({
      oldPassword: passwordForm.oldPassword,
      newPassword: passwordForm.newPassword,
    });

    createToast('密码修改成功', { type: 'success' });
    showPasswordDialog.value = false;
    passwordPanel.value = null

    // 清空密码输入框
    Object.assign(passwordForm, {
      oldPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
  } catch (error) {
    console.error('密码修改失败:', error);
    const message = (error as any).response?.data?.message || '密码修改失败';
    createToast(message, { type: 'danger' });
  } finally {
    passwordLoading.value = false;
  }
};

// 邮箱验证方法
const validateEmail = async () => {
  try {
    // 执行所有验证规则
    const rules = emailRules.value
    for (const rule of rules) {
      const result = await rule(emailForm.newEmail)
      if (typeof result === 'string') {
        emailError.value = result
        isEmailValid.value = false
        return
      }
    }
    emailError.value = ''
    isEmailValid.value = true
  } catch (error) {
    emailError.value = '邮箱验证失败'
    isEmailValid.value = false
  }
}

// 发送验证码
const sendVerificationCode = async () => {
  if (!isEmailValid.value) {
    createToast('请输入有效的邮箱地址', { type: 'warning' })
    return
  }
  try {
    // 显示加载状态
    emailLoading.value = true
    // 调用发送验证码接口
    await userStore.sendEmailVerification(emailForm.newEmail)
    createToast('验证码已发送至您的邮箱', { type: 'success' })
    // 开始60秒倒计时
    codeCountdown.value = 60
    const timer = setInterval(() => {
      codeCountdown.value--
      if (codeCountdown.value <= 0) clearInterval(timer)
    }, 1000)
  } catch (error) {
    console.error('发送验证码失败:', error)
    createToast('验证码发送失败', { type: 'danger' })
  } finally {
    emailLoading.value = false
  }
}

// 添加输入监听
watch(() => emailForm.newEmail, (newVal) => {
  if (newVal) validateEmail()
})

// 邮箱表单验证状态
const isEmailFormValid = computed(() => {
  return emailForm.newEmail &&
    emailForm.verificationCode &&
    emailForm.currentPassword &&
    emailRules.value.every(rule =>
      rule(emailForm.newEmail) === true
    )
})

// 提交邮箱修改
const handleEmailSubmit = async () => {
  try {
    emailLoading.value = true
    await userStore.updateEmail({
      newEmail: emailForm.newEmail,
      code: emailForm.verificationCode,
      password: emailForm.currentPassword
    })
    createToast('邮箱更新成功', { type: 'success' })
    // 清空表单
    Object.assign(emailForm, {
      newEmail: '',
      verificationCode: '',
      currentPassword: ''
    })
    showVerification.value = false
  } catch (error) {
    console.error('邮箱更新失败:', error)
    const message = (error as any).response?.data?.message || '邮箱更新失败'
    createToast(message, { type: 'danger' })
  } finally {
    emailLoading.value = false
  }
}

// 初始化加载
onMounted(async () => {
  try {
    await userStore.getUserInfo()
    if (userStore.user?.userId) {
      await teamStore.getEmployeeById(userStore.user.userId)
      if (teamStore.currentEmployee?.employeeId) {
        await teamStore.getTeamByemployId(teamStore.currentEmployee.employeeId)
        // console.log('[DEBUG] 员工所属团队列表:', teamStore.availableTeams);
        if (teamStore.availableTeams.length > 0) {
          await teamStore.getTeamById(teamStore.availableTeams[0].id);
          // console.log('[DEBUG] 加载员工所在团队列表中的第一个团队详情:', teamStore.teamDetail);
        }
      }
    }
    initProfileForm()
  } catch (error) {
    console.error('加载个人资料失败:', error)
    createToast('数据加载失败', { type: 'danger' })
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <v-container class="profile-container">
    <v-progress-circular v-if="loading" indeterminate color="primary"
      class="mx-auto d-block my-8"></v-progress-circular>

    <template v-else>
      <v-row class="equal-height">
        <!-- 左侧个人信息栏 -->
        <v-col cols="12" md="4">
          <v-card class="profile-card" elevation="2">
            <div class="avatar-section text-center pa-6 bg-gradient">
              <v-avatar size="140" class="elevation-6 hover-zoom">
                <v-img :src="userAvatar">
                  <div class="online-indicator" :class="statusColor"></div>
                </v-img>
              </v-avatar>
              <v-file-input v-model="avatarFile" prepend-icon="camera" label="更换头像" variant="underlined"
                density="compact" class="mt-4 avatar-uploader" @change="uploadAvatar"></v-file-input>
            </div>

            <v-form @submit.prevent="saveProfile" class="pa-4">
              <v-text-field v-model="profileForm.name" label="姓名" :rules="[requiredRule]" :readonly="!isEditing"
                :class="{ 'readonly-field': !isEditing }" variant="outlined"></v-text-field>

              <v-text-field v-model="profileForm.email" label="邮箱" :rules="emailRules" :readonly="!isEditing"
                :class="{ 'readonly-field': !isEditing }" variant="outlined" type="email"></v-text-field>

              <v-text-field v-model="profileForm.phone" label="联系电话" :rules="phoneRules" :readonly="!isEditing"
                :class="{ 'readonly-field': !isEditing }" variant="outlined" type="tel"></v-text-field>

              <div v-if="!isEditing">
                <v-btn @click="enterEditMode" color="primary" block>
                  编辑信息
                </v-btn>
              </div>
              <div v-else>
                <v-btn type="submit" color="primary" block>
                  保存修改
                </v-btn>
                <v-btn @click="cancelEdit" color="secondary" block class="mt-2">
                  取消
                </v-btn>
              </div>
            </v-form>
          </v-card>
        </v-col>

        <!-- 右侧详细信息栏 -->
        <v-col cols="12" md="8">
          <v-card class="detail-card" d-flex flex-column elevation="2">
            <v-tabs v-model="tab" grow>
              <v-tab value="basic">基本信息</v-tab>
              <v-tab value="team">团队信息</v-tab>
              <v-tab value="security">账号安全</v-tab>
            </v-tabs>

            <v-card-text>
              <v-window v-model="tab">
                <!-- 基本信息 -->
                <v-window-item value="basic">
                  <v-list lines="two">
                    <v-list-item>
                      <template #prepend>
                        <v-icon>badge</v-icon>
                      </template>
                      <v-list-item-title>
                        员工ID：{{ employee.employeeId }}
                      </v-list-item-title>
                    </v-list-item>

                    <v-list-item>
                      <template #prepend>
                        <v-icon>admin_panel_settings</v-icon>
                      </template>
                      <v-list-item-title>
                        职位：{{ employee.position }}
                        <v-chip v-for="(auth, index) in employee.authorities" :key="index" size="small" color="primary"
                          class="ml-2">
                          {{ auth }}
                        </v-chip>
                      </v-list-item-title>
                    </v-list-item>

                    <v-list-item>
                      <template #prepend>
                        <v-icon>favorite</v-icon>
                      </template>
                      <v-list-item-title>
                        当前工作负载：
                        <v-progress-linear :model-value="employee.workload" height="20" color="orange-accent-4" rounded
                          class="mt-2">
                          <template #default="{ value }">
                            <strong>{{ Math.ceil(value) }}%</strong>
                          </template>
                        </v-progress-linear>
                      </v-list-item-title>
                    </v-list-item>

                    <v-list-item>
                      <template #prepend>
                        <v-icon>psychology</v-icon>
                      </template>
                      <v-list-item-title>
                        状态：
                        <v-chip :color="statusColor" size="small" class="ml-2">
                          {{ employee.status }}
                          <v-icon end>
                            {{ employee.online ? 'check_circle' : 'cancel' }}
                          </v-icon>
                        </v-chip>
                      </v-list-item-title>
                    </v-list-item>
                  </v-list>
                </v-window-item>

                <!-- 团队信息 -->
                <v-window-item value="team">
                  <div v-if="involvedTeam" class="team-info">
                    <h3 class="text-h6 mb-4">{{ involvedTeam.name }}</h3>
                    <p class="text-grey">{{ involvedTeam.description }}</p>

                    <v-divider class="my-4"></v-divider>

                    <h4 class="text-subtitle-1 mb-2">
                      团队成员 ({{ involvedTeam.employees.length }})
                    </h4>
                    <v-list lines="two">
                      <v-list-item v-for="member in involvedTeam.employees" :key="member.employeeId">
                        <template #prepend>
                          <v-avatar size="40">
                            <v-img :src="member.avatar || '/default-avatar.png'"></v-img>
                          </v-avatar>
                        </template>

                        <v-list-item-title>
                          {{ member.name }}
                          <v-chip v-if="member.employeeId === employee.employeeId" size="x-small" color="info"
                            class="ml-2">
                            本人
                          </v-chip>
                        </v-list-item-title>
                        <v-list-item-subtitle>
                          {{ member.position }}
                          <v-icon :color="member.online ? 'success' : 'grey'" size="small" class="ml-2">
                            admin_panel_settings
                          </v-icon>
                        </v-list-item-subtitle>
                      </v-list-item>
                    </v-list>
                  </div>
                  <v-alert v-else type="info">
                    当前未加入任何团队
                  </v-alert>
                </v-window-item>

                <!-- 账号安全 -->
                <v-window-item value="security">
                  <v-list lines="two">
                    <v-list-item>
                      <template #prepend>
                        <v-icon>key</v-icon>
                      </template>
                      <v-list-item-title>
                        登录账号（用户名）：{{ user.username }}
                      </v-list-item-title>
                    </v-list-item>

                    <!-- 密码修改区域 -->
                    <v-expansion-panels v-model="passwordPanel" class="mb-4">
                      <v-expansion-panel>
                        <v-expansion-panel-title>
                          <v-icon class="mr-6">edit</v-icon>
                          修改密码
                        </v-expansion-panel-title>
                        <v-expansion-panel-text>
                          <v-form @submit.prevent="handlePasswordSubmit" class="pa-3">
                            <v-text-field v-model="passwordForm.oldPassword" :type="showPassword ? 'text' : 'password'"
                              label="原密码"  autocomplete="current-password" required :rules="[requiredRule]"
                              :append-inner-icon="showPassword ? 'visibility_off' : 'visibility'"
                              @click:append-inner="showPassword = !showPassword"></v-text-field>
                            <v-text-field v-model="passwordForm.newPassword"
                              :type="showNewPassword ? 'text' : 'password'" label="新密码" autocomplete="new-password" required :rules="passwordRules"
                              :append-inner-icon="showNewPassword ? 'visibility_off' : 'visibility'"
                              @click:append-inner="showNewPassword = !showNewPassword"></v-text-field>

                            <v-text-field v-model="passwordForm.confirmPassword"
                              :type="showConfirmPassword ? 'text' : 'password'" label="确认新密码" autocomplete="new-password" required
                              :rules="confirmPasswordRules"
                              :append-inner-icon="showConfirmPassword ? 'visibility_off' : 'visibility'"
                              @click:append-inner="showConfirmPassword = !showConfirmPassword"></v-text-field>
                            <v-card-actions class="px-0">
                              <v-spacer></v-spacer>
                              <v-btn color="primary" type="submit" :loading="passwordLoading"
                                :disabled="!isPasswordFormValid">
                                确认修改
                              </v-btn>
                              <v-btn variant="text" @click="passwordPanel = null">取消</v-btn>
                            </v-card-actions>
                          </v-form>
                        </v-expansion-panel-text>
                      </v-expansion-panel>

                      <!-- 邮箱修改区域 -->
                      <v-expansion-panel value="email">
                        <v-expansion-panel-title>
                          <v-icon class="mr-6">email</v-icon>
                          {{ user.email ? '修改邮箱' : '绑定邮箱' }}
                        </v-expansion-panel-title>
                        <v-expansion-panel-text>
                          <v-form @submit.prevent="handleEmailSubmit" class="pa-3">
                            <v-text-field v-model="emailForm.newEmail" label="新邮箱地址" :rules="emailRules" autocomplete="email" required
                              outlined></v-text-field>

                            <v-text-field v-model="emailForm.currentPassword" label="当前密码"
                              :type="showPassword ? 'text' : 'password'"
                              :append-inner-icon="showPassword ? 'visibility_off' : 'visibility'"
                              @click:append-inner="showPassword = !showPassword" :rules="passwordRules" autocomplete="current-password" required
                              outlined @blur="validateEmail"></v-text-field>

                            <v-text-field v-model="emailForm.verificationCode" label="验证码"
                              :rules="[v => !!v || '必填项', v => v.length === 6 || '6位验证码']" autocomplete="one-time-code" required outlined>
                              <template #append>
                                <v-btn :disabled="!isEmailValid || codeCountdown > 0" @click="sendVerificationCode"
                                  variant="text" color="primary">
                                  {{ codeCountdown > 0 ? `${codeCountdown}秒后重试` : '获取验证码' }}
                                </v-btn>
                              </template>
                            </v-text-field>

                            <v-card-actions class="px-0">
                              <v-spacer></v-spacer>
                              <v-btn color="primary" type="submit" :loading="emailLoading"
                                :disabled="!isEmailFormValid">
                                确认修改
                              </v-btn>
                              <v-btn variant="text" @click="emailPanel = null">取消</v-btn>
                            </v-card-actions>
                          </v-form>
                        </v-expansion-panel-text>
                      </v-expansion-panel>
                    </v-expansion-panels>

                  </v-list>
                </v-window-item>
              </v-window>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>




    </template>
  </v-container>
</template>

<style scoped lang='scss'>
.equal-height {
  display: flex;
  align-items: stretch;
  /* 让子元素撑满父容器 */
}

.profile-card {
  border-radius: 16px;
  display: flex;
  flex-direction: column;
}

.avatar-section {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 8px 8px 0 0;
  padding: 24px;
}

.hover-zoom {
  transition: transform 0.3s ease;

  &:hover {
    transform: scale(1.05);
  }
}

.online-indicator {
  position: absolute;
  bottom: 8px;
  right: 8px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid white;

  &.success {
    background: #7ED321;
  }

  &.warning {
    background: #F5A623;
  }

  &.error {
    background: #D0021B;
  }
}

.bg-gradient {
  background: linear-gradient(135deg, rgba(74, 144, 226, 0.1) 0%, rgba(255, 255, 255, 1) 100%);
}

.readonly-field {
  :deep(.v-input__control) {
    background-color: #f5f5f5;
    border-radius: 8px;
  }

  :deep(input) {
    color: rgba(0, 0, 0, 0.6);
    cursor: not-allowed;
  }
}

.detail-card {
  border-radius: 16px;
  height: 100%;

  // 团队描述文字
  .text-grey {
    font-size: 1.1rem;
    line-height: 1.7;
  }

  // 标签页标题
  .v-tab {
    font-size: 1.3rem;
    letter-spacing: 0.5px;
  }
}

.team-info {
  h3 {
    color: var(--v-primary-base);
    font-weight: 600;
  }
}

.v-progress-linear {
  max-width: 80%;
}

.v-chip {
  vertical-align: middle;
}

// 增加微交互动画
.v-btn {
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-1px);
  }
}

// 优化文字排版
.v-list-item-title {
  font-size: 15px;
  letter-spacing: 0.1px;
}


.v-list-item {
  &__title {
    font-weight: 500;
  }

  &--active {
    background: rgba(var(--v-theme-primary), 0.05);
  }
}

// 统一边框样式
.v-card {
  border: 1px solid rgba(0, 0, 0, 0.08);
}

// 优化对话框标题栏
.v-toolbar {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.v-expansion-panel {
  margin-bottom: 8px;
  border-radius: 8px !important;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05) !important;

  &-title {
    font-weight: 500;
    background: rgba(245, 245, 245, 0.5);

    &__icon {
      .v-icon {
        color: rgba(0, 0, 0, 0.54);
      }
    }
  }

  &-text {
    border-top: 1px solid rgba(0, 0, 0, 0.08);

    .v-form {
      background: rgba(255, 255, 255, 0.9);
      padding: 16px;
      border-radius: 0 0 8px 8px;
    }
  }
}

// 验证码按钮样式优化
.v-btn[disabled] {
  opacity: 0.6;
}
</style>