import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user';
import { storeToRefs } from 'pinia';

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
      // 此父路由只为权限管理能使用特殊布局（保留侧边栏）
      path: '/noticeboard',
      name: 'noticeboard',
      component: () => import('@/views/layout/Index.vue'),  //公示公告
      meta: {
        title: '公示公告',
        hidden: true,
        icon: 'notifications_active'
      },
      redirect: '/noticeboard/noticeboard1',
      children: [
        {
          path: '/noticeboard1',
          name: 'noticeboard1',
          component: () => import('@/views/notice/NoticeBoard.vue'),  // 公示公告
          meta: {
            title: '公示公告',
            hidden: false,
            icon: 'notifications_active',
            fullWidth: true
          }
        },
        {
          path: 'noticedetail/:id',
          name: 'noticedetail',
          component: () => import('../views/notice/NoticeDetail.vue'), // 任务列表及操作
          meta: {
            title: '公告详情',
            hidden: true,
            icon: 'details',
            fullWidth: true
          }
        },
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
        // 独立任务详情
        {
          path: 'independent/:taskId',
          name: 'IndependentTaskDetail',
          component: () => import('@/views/task/TaskDetail.vue'),
          meta: {
            taskType: 'independent',
            title: '任务详情',
            hidden: true,
            icon: 'details'
          },
          props: route => ({
            taskType: 'independent',
            taskId: route.params.taskId
          })
        },
        // 项目任务详情
        {
          path: 'project/:projectId/task/:taskId',
          name: 'ProjectTaskDetail',
          component: () => import('@/views/task/TaskDetail.vue'),
          meta: {
            taskType: 'project',
            title: '任务详情',
            hidden: true,
            icon: 'details'
          },
          props: route => ({
            taskType: 'project',
            projectId: route.params.projectId,
            taskId: route.params.taskId
          })
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
      children: [
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
            title: '备忘录',
            hidden: false,
            icon: 'list'
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
      // 此父路由只为权限管理能使用特殊布局（保留侧边栏）
      path: '/reports',
      name: 'reports',
      component: () => import('@/views/layout/Index.vue'),  // 个人资料
      meta: {
        title: '统计报告',
        hidden: true,
        icon: 'summarize'
      },
      redirect: '/person/personaldata',
      children: [
        {
          path: '/reports1',
          name: 'reports1',
          component: () => import('@/views/report/StatisticalReport.vue'),  // 统计报告
          meta: {
            title: '统计报告',
            hidden: false,
            icon: 'summarize',
            fullWidth: true
          }
        }]
    },


    {
      // 此父路由只为权限管理能使用特殊布局（保留侧边栏）
      path: '/permission',
      name: 'permission',
      component: () => import('@/views/layout/Index.vue'),
      meta: {
        title: '权限管理',
        hidden: true,
        icon: 'manage_accounts',
        requireAdmin: true
      },
      redirect: '/person/personaldata',
      children: [
        {
          path: '/permission1',
          name: 'permission1',
          component: () => import('@/views/admin/PermissionManagement.vue'),  // 权限管理
          meta: {
            title: '权限管理',
            hidden: false,
            icon: 'manage_accounts',
            fullWidth: true,
            requireAdmin: true
          }
        }]
    }



  ]
})


// 路由守卫：判断登录状态
// router.beforeEach(async (to, from, next) => {
//   const userStore = useUserStore()
//   const { token, user } = storeToRefs(userStore)

//   const isAuthenticated = !!token.value

//   // 登录页路径（你的是 "/"）
//   const loginPath = '/'
//   // 需要登录才能访问的路径前缀
//   const protectedPrefixes = ['/index', '/team', '/noticeboard']

//   const isProtectedRoute = protectedPrefixes.some(prefix => to.path.startsWith(prefix))

//   // 1. 未登录访问受保护页面 → 跳转登录页
//   if (isProtectedRoute && !isAuthenticated) {
//     return next(loginPath)
//   }

//   // 2. 登录了还访问登录页 → 跳转到主页
//   if (isAuthenticated && to.path === loginPath) {
//     return next('/index')
//   }

//   // 3. 登录了但用户信息还没加载 → 拉取信息
//   if (isAuthenticated && !user.value) {
//     try {
//       await userStore.getUserInfo()
//     } catch (error) {
//       console.error('获取用户信息失败，退出登录', error)
//       await userStore.logout()
//       return next(loginPath)
//     }
//   }

//   // 4. 正常放行
//   next()
// })


export default router
