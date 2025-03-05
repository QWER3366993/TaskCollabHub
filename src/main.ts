import './assets/main.css'

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

// 引入echarts
import Echarts from 'vue-echarts'
import * as echarts from 'echarts'

const vuetify = createVuetify({
    components,
    directives,
    icons: {
      defaultSet: 'md',
      aliases,
      sets: {
        md
      }
    },
    theme: {
      themes: {
        dark: {
          colors: {
            background: '#F5F6FA' // 使用 colors.background 设置背景颜色
          }
        }
      }
    }
  })

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(vuetify)


// 全局注册 Echarts
app.component('e-charts',Echarts)
// 全局挂载 echarts
app.config.globalProperties.$echarts = echarts

app.mount('#app')
