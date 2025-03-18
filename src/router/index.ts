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
      path: '/noticeboard',
      name: 'noticeboard',
      component: () => import('@/views/NoticeBoard.vue'),
      meta: {
        title: '公示公告',
        hidden: false,
        icon: 'notifications_active'
      }
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
          path: 'taskscheduling/:taskId?/:projectId?', // 添加可选参数
          name: 'taskscheduling',
          component: () => import('@/views/task/TaskScheduling.vue'), //发布任务
          props: true,
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
        },
        {
          path: 'quickpanel',
          name: 'quickpanel',
          component: () => import('@/views/task/QuickPanel.vue'), //快捷操作面板
          meta: {
            title: '快捷面板',
            hidden: false,
            icon: 'switch_access_shortcut'
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
        {
          path: 'teamdetail/:id',
          name: 'teamdetail',
          component: () => import('../views/team/TeamDetail.vue'), // 任务列表及操作
          meta: {
            title: '团队详情',
            hidden: true,
            icon: 'details'
          }
        },
        {
          path: 'communicate',
          name: 'communicate',
          component: () => import('@/views/team/Communicate.vue'),
          meta: {
            title: '实时通讯',
            hidden: false,
            icon: 'chat'
          }
        },
        {
          path: 'calendar',
          name: 'calendar',
          component: () => import('@/views/team/Calendar.vue'),
          meta: {
            title: '日程安排',
            hidden: false,
            icon: 'calendar_month'
          }
        }
      ]
    },
    {
      path: '/person',
      name: 'person',
      component: () => import('@/views/layout/Index.vue'),  // 个人资料
      meta: {
        title: '个人中心',
        hidden: false,
        icon: 'manage_accounts'
      },
      redirect: '/person/personaldata',
      children : [
        {
          path: 'personaldata',
          name: 'personaldata',
          component: () => import('@/views/person/PersonalData.vue'),  // 个人资料管理
          meta: {
            title: '个人资料',
            hidden: false,
            icon: 'badge'
          }
        },
        {
          path: 'todolist',
          name: 'todolist',
          component: () => import('@/views/person/TodoList.vue'),
          meta: {
            title: '待办事项',
            hidden: false,
            icon: 'list'
          }
        },
        {
          path: 'operationlog',
          name: 'operationlog',
          component: () => import('@/views/person/OperationLog.vue'),
          meta: {
            title: '操作日志',
            hidden: false,
            icon: 'construction'
          }
        },
        {
          path: 'notification',
          name: 'notification',
          component: () => import('@/views/person/Notification.vue'),
          meta: {
            title: '通知中心',
            hidden: false,
            icon: 'notifications'
          }
        }
      ]
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
