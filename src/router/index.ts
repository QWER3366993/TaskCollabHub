import { createRouter, createWebHistory } from 'vue-router'

// 创建路由实例
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'basic',
      component: () => import('@/views/components/BasicView.vue'),  // 基本视图
      children: [
        {
          path: '',
          name: 'login',
          component: () => import('@/views/UserLogin.vue')  // 登录页面
        },
        {
          path: 'register',
          name: 'register',
          component: () => import('@/views/UserRegister.vue')  // 注册页面
        },
        {
          path: 'forget',
          name: 'forget',
          component: () => import('@/views/UserForget.vue')  // 忘记密码页面
        }
      ]
    }, {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('@/views/DashBoard.vue'),  // 仪表盘,主页
    },
    {
      path: '/tasklist',
      name: 'tasklist',
      component: () => import('@/views/components/TaskList.vue'),  // 任务列表
      meta: { requiresAuth: true }  // 需要认证
    },
    {
      path: '/task/:id',
      name: 'task',
      component: () => import('@/views/TaskDetail.vue'),  // 任务详情
      meta: { requiresAuth: true }
    },
    {
      path: '/taskmanagement',
      name: 'taskmanagement',
      component: () => import('@/views/TaskManagement.vue'),  // 任务管理
      meta: { requiresAuth: true }
    },
    {
      path: '/taskscheduling',
      name: 'taskscheduling',
      component: () => import('@/views/components/TaskScheduling.vue'),  // 任务调度
      meta: { requiresAuth: true }
    },
    {
      path: '/team',
      name: 'team',
      component: () => import('@/views/TeamManagement.vue'),  // 团队管理
      meta: { requiresAuth: true }
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('@/views/UserProfile.vue'),  // 个人资料
      meta: { requiresAuth: true }
    },
    {
      path: '/reports',
      name: 'reports',
      component: () => import('@/views/StatisticalReport.vue'),  // 统计与报告
      meta: { requiresAuth: true }
    },
    // {
    //   path: '/1',
    //   name: '1',
    //   component: () => import('../views/charts/LineChart.vue'),  
    // },
  

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
