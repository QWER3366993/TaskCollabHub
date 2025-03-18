import { ref } from 'vue'

export const username = ref('')
export const password = ref('')
export const confirmpassword = ref('')
export const name = ref('')
export const phone = ref('')
export const email = ref('')
export const show1 = ref(false)
export const show2 = ref(false)


export const usernameRules = ref([
  (v: string) => !!v || '必须输入账号!',
  (v: string) => (v && v.length <= 20 && v.length >= 3) || '账号的长度为3到20个字符!'
])

export const passwordRules = ref([
  (v: string) => !!v || '必须输入密码!',
  (v: string) => (v && v.length <= 20 && v.length >= 6) || '密码的长度为6到20个字符!'
])

export const confirmPasswordRules = ref([
  (v: string) => !!v || '必须输入确认密码!',
  (v: string) => (v && v.length <= 20 && v.length >= 6) || '确认密码的长度为6到20个字符!',
  (v: string) => v === password.value || '密码和确认密码不一致'
])

export const nameRules = ref([
  (v: string) => !!v || '必须输入姓名!',

  (v: string) => (v && v.length <= 8 && v.length >= 2) || '名字的长度为4到8个字符!'
])

export const mobileRules = ref([
  (v: string) => !!v || '必须输入电话号码!',

  (v: string) => (v && v.length === 11) || '请输入有效的电话号码(11位)'
])

export const emailRules = ref([
  (v: string) => !!v || '必须输入邮箱!',

  (v: string) => /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(v) || '请输入有效的邮箱地址'
])

