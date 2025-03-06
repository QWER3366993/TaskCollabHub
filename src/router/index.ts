import { createRouter, createWebHistory } from 'vue-router'

// 创建路由实例
export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'basic',
      component: () => import('@/views/components/BasicView.vue'),  // 初始页面基本视图
      meta: {
        title: '初始页',
        hidden: true, //代表路由标题在菜单中是否隐藏  true:隐藏 false:不隐藏
        icon: 'account_balance',
      },
      children: [
        {
          path: '',
          name: 'login',
          component: () => import('@/views/UserLogin.vue'),  // 登录页面
          meta: {
            title: '登录',
            hidden: true,
            icon: 'login',
          }
        },
        {
          path: 'register',
          name: 'register',
          component: () => import('@/views/UserRegister.vue'),  // 注册页面
          meta: {
            title: '注册',
            hidden: true,
            icon: 'key',
          }
        },
        {
          path: 'forget',
          name: 'forget',
          component: () => import('@/views/UserForget.vue'),  // 忘记密码页面
          meta: {
            title: '忘记密码',
            hidden: true,
            icon: 'sync',
          }
        }
      ]
    },
    {
      path: '/index',
      name: 'index',
      component: () => import('../views/layout/index.vue'),
      meta: {
        title: '项目',
        hidden: false,
        icon: 'home'
      },
      children: [
        {
          path: 'dashboard',
          name: 'dashboard',
          component: () => import('@/views/DashBoard.vue'),  // 仪表盘,主页
          meta: {
            title: '仪表盘',
            hidden: false,
            icon: 'dashboard'
          }
        },

      ]
    },
    {
      path: '/taskmanagement',
      name: 'taskmanagement',
      component: () => import('@/views/TaskManagement.vue'),  // 任务管理
      meta: {
        title: '任务管理',
        hidden: false,
        icon: 'list_alt'
      }
    },
    {
      path: '/teammanagement',
      name: 'teammanagement',
      component: () => import('@/views/TeamManagement.vue'),  // 团队管理
      meta: {
        title: '团队管理',
        hidden: false,
        icon: 'group'
      }
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('@/views/UserProfile.vue'),  // 个人资料
      meta: {
        title: '个人资料',
        hidden: false,
        icon: 'badge'
      }
    },
    {
      path: '/reports',
      name: 'reports',
      component: () => import('@/views/StatisticalReport.vue'),  // 统计报告
      meta: {
        title: '统计报告',
        hidden: false,
        icon: 'summarize'
      }
    },



  ]
})

// 路由守卫：检查用户是否登录
// router.beforeEach((to, from, next) => {
//   if (to.meta.requiresAuth && !localStorage.getItem('token')) {
//     next({ name: 'login' })  // 如果需要认证但没有 token，则跳转到登录页面
//   } else {
//     next()  // 放行
//   }
// })

export default router
