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
      component: () => import('@/views/layout/Index.vue'),
      meta: {
        title: '项目管理',
        hidden: false,
        icon: 'folder'
      },
      redirect: '/index/taskmanagement', // 默认跳转到任务管理
      children: [
        {
          path: 'taskmanagement',
          name: 'taskmanagement',
          component: () => import('@/views/task/TaskManagement.vue'), // 任务首页
          meta: {
            title: '任务管理',
            hidden: false,
            icon: 'dashboard'
          }
        },
        {
          path: 'taskdetail/:id',
          name: 'taskdetail',
          component: () => import('@/views/task/TaskDetail.vue'), // 任务列表及操作
          meta: {
            title: '任务详情',
            hidden: true,
            icon: 'details'
          }
        },
        {
          path: 'taskscheduling',
          name: 'taskscheduling',
          component: () => import('@/views/task/TaskScheduling.vue'), //发布任务
          meta: {
            title: '任务调度',
            hidden: false,
            icon: 'schedule'
          }
        },
        {
          path: 'fileuplode',
          name: 'fileuplode',
          component: () => import('@/views/task/FileUpload.vue'), //文件总览及上传
          meta: {
            title: '文件共享',
            hidden: false,
            icon: 'upload_file'
          }
        }
      ]
    },

    {
      path: '/team',
      name: 'team',
      component: () => import('@/views/layout/Index.vue'),  // 团队目录
      meta: {
        title: '团队协作',
        hidden: false,
        icon: 'group'
      },
      redirect: '/team/teammanagement', // 默认跳转到团队管理
      children: [
        {
          path: 'teammanagement',
          name: 'teammanagement',
          component: () => import('@/views/team/TeamManagement.vue'),  // 团队管理
          meta: {
            title: '团队管理',
            hidden: false,
            icon: 'group'
          }
        },
      ]
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('@/views/UserProfile.vue'),  // 个人资料
      meta: {
        title: '个人中心',
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
    {
      path: '/permission',
      name: 'permission',
      component: () => import('@/views/PermissionManagement.vue'),  // 权限管理
      meta: {
        title: '权限管理',
        hidden: false,
        icon: 'manage_accounts'
      }
    }



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
