import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
// 全局引入Vuetify
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import 'material-design-icons-iconfont/dist/material-design-icons.css'
import { aliases, md } from 'vuetify/iconsets/md'
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { VTimePicker } from 'vuetify/labs/VTimePicker';
import 'dayjs/locale/zh-cn';
import Echarts from 'vue-echarts'
import * as echarts from 'echarts'

const vuetify = createVuetify({
  components: {
    ...components,
    VTimePicker,
  },
  directives,
  icons: {
    defaultSet: 'md',
    aliases,
    sets: {
      md
    }
  },
  theme: {
    defaultTheme: 'light', // 设置默认主题为明亮模式
    themes: {
      light: {
        dark: false,
        colors: {
          primary: '#1867C0',    // 主色
          secondary: '#5CBBF6',  // 辅助色
          background: '#FFFFFF'  // 明亮模式背景色
        }
      },
      dark: {
        dark: true,
        colors: {
          primary: '#2196F3',     // 暗黑模式主色
          secondary: '#64B5F6',   // 暗黑模式辅助色
          background: '#121212'   // 暗黑背景色
        }
      }
    }
  }
})

const app = createApp(App)
const pinia = createPinia()
// 扩展插件
dayjs.extend(relativeTime);
// 设置中文语言
dayjs.locale('zh-cn');
app.use(router)
app.use(vuetify)
app.use(pinia)


// 全局注册 Echarts
app.component('e-charts', Echarts)
// 全局挂载 echarts
app.config.globalProperties.$echarts = echarts

app.mount('#app')
