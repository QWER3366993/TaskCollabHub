import type { MockMethod } from 'vite-plugin-mock';
import type { Task, OperationLog, FileItem } from '@/types/task';
import type { Employee } from '@/types/team';
import type { User } from '@/types/user';
import type { Team, Schedule } from '@/types/team';
import type { Notice, NoticeType } from '@/types/notice'
import type { ChatMessage, SystemMessage, ChatSession } from '@/types/chat'
import type { Memo } from '@/types/memo';
import type { Project } from '@/types/project';
import { WebSocketServer, WebSocket } from 'ws';

// 自定义路径参数类型
interface MockParams {
  params: {
    id?: string;
    taskId?: string;
    fileId?: string;
    teamId?: string;
    type?: string;
    projectId: string;
  };
  body?: any;
}


export const mockNotices: Notice[] = [
  {
    id: "1",
    title: "轮播图1",
    coverImage: "/default-cover.jpg",
    type: "carousel",
    content: "这是轮播图1的详细内容...",      // 新增
    summary: "轮播图1的摘要说明",            // 新增
    createdAt: "2025-11-20T14:20:00Z",
    hit: 120
  },
  {
    id: "2",
    title: "轮播图2",
    coverImage: "/海绵宝宝.jpg",
    content: "这是轮播图2的详细内容...",      // 新增
    summary: "轮播图2的摘要说明",            // 新增
    type: "carousel",
    createdAt: "2025-11-10T14:20:00Z",
    hit: 120
  },



  // 政策法规 mock 数据
  {
    id: "4",
    title: "国家数据安全管理办法",
    type: "policy",
    url: "https://example.com/data-security",
    createdAt: "2024-11-20T14:20:00Z",
    summary: "为加强数据安全管理",            // 新增
    content: "为加强数据安全管理，保障国家安全和公民权益，特制定本办法。",
    hit: 120
  },
  {
    id: "5",
    title: "科技企业税收优惠政策",
    type: "policy",
    url: "https://example.com/tech-tax",
    createdAt: "2024-11-18T16:45:00Z",
    summary: "对符合条件的科技企业给予税收减免优惠",            // 新增
    content: "对符合条件的科技企业给予税收减免优惠，鼓励科技创新。",
    hit: 95
  },
  {
    id: "6",
    title: "人工智能伦理规范",
    type: "policy",
    url: "https://example.com/ai-ethics",
    createdAt: "2024-11-15T10:30:00Z",
    summary: "发布人工智能开发和应用的伦理规范",            // 新增
    content: "发布人工智能开发和应用的伦理规范，指导行业健康发展。",
    hit: 110
  },


  // 科技热点 mock 数据
  {
    id: "7",
    title: "人工智能最新突破",
    type: "technology",
    url: "https://example.com/ai-breakthrough",
    createdAt: "2024-11-22T08:15:00Z",
    summary: "新型 AI 模型在医疗影像分析中表现优异",
    content: "新型 AI 模型在医疗影像分析中表现优异，准确率提升 30%。",
    hit: 250
  },
  {
    id: "8",
    title: "量子计算商业化进程",
    type: "technology",
    url: "https://example.com/quantum-computing",
    createdAt: "2024-11-21T15:30:00Z",
    summary: "多家科技巨头发布量子计算新成果",
    content: "多家科技巨头发布量子计算新成果，商业化进程加速。",
    hit: 190
  },
  {
    id: "9",
    title: "6G 通信技术研究进展",
    type: "technology",
    url: "https://example.com/6g-communication",
    createdAt: "2024-11-20T12:00:00Z",
    summary: "6G 通信技术研究取得新突破",
    content: "6G 通信技术研究取得新突破，预计 2030 年实现商用。",
    hit: 160
  },
  {
    id: "10",
    title: "企业年度技术峰会",
    type: "technology",
    coverImage: "/tech-summit.jpg",
    content: "年度技术峰会将于12月举办，主题为'人工智能与未来'...",
    summary: "年度技术峰会筹备启动",
    createdAt: "2023-11-01T09:00:00Z",
    hit: 280
  },
  {
    id: "11",
    title: "新员工入职指南",
    type: "policy",
    url: "/onboarding-guide.pdf",
    content: "2023版新员工入职流程及注意事项...",
    summary: "更新版入职流程发布",
    createdAt: "2023-10-15T14:30:00Z",
    hit: 150
  }
];

const mockUsers = [
  {
    userId: 'user001',
    username: 'admin',
    password: '123456',
    authorities: ['admin'],
    avatar: '/海绵宝宝.jpg',
    email: 'admin@example.com',
    phone: '13800138000',
    token: 'admin-token'
  },
  {
    userId: 'user002',
    username: 'pdx',
    password: '123456',
    authorities: ['manager'],
    avatar: '/派大星.jpg',
    email: 'pdx@example.com',
    phone: '13800138001',
    token: 'pdx-token'
  },
  {
    userId: 'user003',
    username: 'zyg',
    password: '123456',
    authorities: ['manager'],
    avatar: '/章鱼哥.jpg',
    email: 'zyg@example.com',
    phone: '13800138002',
    token: 'zyg-token',
  },
  {
    userId: 'user004',
    username: 'xlb',
    password: '123456',
    authorities: ['member'],
    avatar: '/蟹老板.jpg',
    email: 'xlb@example.com',
    phone: '13800138003',
    token: 'xlb-token',
  },
  {
    userId: 'user005',
    username: 'plb',
    password: '123456',
    authorities: ['admin'],
    avatar: '/痞老板.jpg',
    email: 'plb@example.com',
    phone: '13800138004',
    token: 'plb-token',
  },
];

const mockProjects: Project[] = [
  {
    projectId: 'p001',
    title: '前端架构优化',
    description: '优化前端架构，提升页面加载速度和用户体验',
    teamId: '1', // 归属前端团队
    scheduledTime: '2025-05-01 09:00:00',
    deadline: '2025-08-01 18:00:00',
    files: [
      {
        id: 'pf1',
        name: '前端优化方案.pdf',
        size: 1.2 * 1024 * 1024,
        type: 'application/pdf',
        url: '/frontend-optimization.pdf',
        uploadTime: '2025-04-10 15:00:00',
        uploader: 'u101',
        scope: 'public'
      }
    ],
    progress: 30, // 进度百分比
    isLate: false,
    tasks: [
      {
        id: 't101',
        projectId: 'p001',
        teamId: '1',
        employeeId: 'e001',
        title: '优化首页加载速度',
        description: '减少首屏渲染时间，提高用户体验',
        status: '已完成',
        priority: '高',
        creator: 'e005',
        scheduledTime: '2025-05-01 09:00:00',
        completedTime: '2025-06-13 10:00:00',
        deadline: '2025-06-15 18:00:00',
        files: [],
        comments: [],
        operations: []
      },
      {
        id: 't102',
        projectId: 'p001',
        teamId: '1',
        employeeId: 'e002',
        title: '前端缓存优化',
        description: '增加浏览器缓存策略，减少服务器请求',
        status: '待处理',
        priority: '中',
        creator: 'e005',
        scheduledTime: '2025-05-01 09:00:00',
        deadline: '2025-07-01 18:00:00',
        files: [],
        comments: [],
        operations: []
      }
    ]
  },
  {
    projectId: 'p002',
    title: '后端微服务拆分',
    description: '对现有单体架构进行微服务化拆分，提升系统可扩展性',
    teamId: '2',
    scheduledTime: '2025-06-01 10:00:00',
    deadline: '2025-09-30 18:00:00',
    files: [],
    progress: 40,
    isLate: false,
    tasks: [
      {
        id: 't201',
        projectId: 'p002',
        teamId: '2',
        employeeId: 'e003',
        title: '订单服务拆分',
        description: '将订单模块拆分为独立微服务',
        status: '已完成',
        priority: '高',
        creator: 'e006',
        scheduledTime: '2025-06-01 10:00:00',
        completedTime: '2025-06-20 10:00:00',
        deadline: '2025-07-20 18:00:00',
        files: [],
        comments: [],
        operations: []
      }
    ]
  },
  {
    projectId: 'p003',
    title: '数据库性能优化',
    description: '优化数据库索引、查询语句，提高查询效率',
    teamId: '2',
    scheduledTime: '2025-04-15 08:30:00',
    deadline: '2025-07-15 18:00:00',
    files: [],
    progress: 50,
    isLate: false,
    tasks: [
      {
        id: 't301',
        projectId: 'p003',
        teamId: '2',
        employeeId: 'e004',
        title: '索引优化',
        description: '为慢查询语句添加索引，优化查询速度',
        status: '进行中',
        priority: '高',
        creator: 'e003',
        scheduledTime: '2025-04-15 08:30:00',
        deadline: '2025-06-30 18:00:00',
        files: [],
        comments: [],
        operations: []
      }
    ]
  }
];

const mockTasks: Task[] = [
  {
    id: '1',
    teamId: '1',
    employeeId: 'e001', // 归属前端组
    title: '上山打老虎', // 海绵宝宝的任务
    description: '这是任务1的详细描述',
    status: '待处理',
    priority: '低',
    creator: 'e005',
    scheduledTime: '2025-08-01 10:00:00',
    deadline: '2025-10-04 10:00:00',
    files: [
      {
        id: 'f1',
        name: '好看的图',
        size: 1024 * 1024,
        type: 'image/png',
        url: '/logo.png',  // 指向public目录下的图片
        uploadTime: '2025-03-20 10:00:00',
        uploader: 'u111',
        scope: 'task'
      },
      {
        id: 'f2',
        name: '封面和评分表.pdf',
        size: 2.5 * 1024 * 1024,
        type: 'application/pdf',
        url: '/封面和评分表.pdf',
        uploadTime: '2025-03-22 11:00:00',
        uploader: 'u111',
        scope: 'task'
      }
    ],
    comments: [
      {
        employee: {
          employeeId: 'e005',
          avatar: '/111.jpg',
          name: '痞老板'
        },
        content: '需要优先处理前端部分',
        createdAt: '2025-03-01 10:00:00',
        taskId: '1',
        commentId: '1',
      },
    ],
    operations: [
      {
        id: 'log1',
        taskId: '1',
        employeeId: 'e001',
        operationType: 'update',
        operation: '修改截止时间从 2024-05-30 到 2024-06-05',
        time: '2025-03-04 14:30:00',
        details: {
          status: {
            old: '2024-05-30',
            new: '2024-06-05'
          }
        }
      },
      {
        id: 'log2',
        taskId: '1',
        employeeId: 'e001',
        operationType: 'view',
        operation: '查看任务详情',
        time: '2024-03-25 10:00:00'
      }
    ],
  },
  {
    id: '2',
    teamId: '2', // 归属后端组
    employeeId: 'e003', // 章鱼哥的任务
    title: '任务2',
    description: '这是任务2的详细描述',
    status: '进行中',
    priority: '中',
    creator: 'e005',
    scheduledTime: '2024-10-01 10:00:00',
    deadline: '2025-03-01 10:00:00',
    comments: [],
    operations: [],
    files: []
  },
  {
    id: '3',
    teamId: '3',
    employeeId: 'e005',
    title: '用户认证系统重构',
    description: '重构现有用户认证系统，支持OAuth2.0协议',
    status: '进行中',
    priority: '高',
    creator: 'e003',
    scheduledTime: '2023-08-01 09:00:00',
    deadline: '2023-09-15 18:00:00',
    files: [
      {
        id: 'f3',
        name: '架构设计图.png',
        size: 1.8 * 1024 * 1024,
        type: 'image/png',
        url: '/architecture.png',
        uploadTime: '2023-07-25T10:00:00Z',
        uploader: '痞老板',
        scope: 'task'
      }
    ],
    comments: [
      {
        employee: {
          employeeId: 'e003',
          avatar: '/章鱼哥.jpg',
          name: '章鱼哥'
        },
        content: '需要优先考虑安全性设计',
        createdAt: '2023-07-25T14:30:00Z',
        taskId: '3',
        commentId: '3',
      }
    ],
    operations: []
  },

];

let mockPublicFiles: FileItem[] = [
  {
    id: '1',
    name: '封面和评分表.pdf',
    size: 2.5 * 1024 * 1024,
    type: 'application/pdf',
    url: '/public/company-handbook.pdf',
    uploadTime: '2025-03-20 09:00:00',
    uploader: '李四',
    scope: 'task',
    taskId: '1'
  },
  {
    id: '2',
    name: '项目报告.docx',
    size: 1.2 * 1024 * 1024, // 1.2 MB
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    url: '/项目报告.docx',
    uploadTime: '2025-03-19 14:30:00',
    uploader: '王五',
    scope: 'task',
    taskId: '2'
  },
  {
    id: '3',
    name: '设计图.png',
    size: 3.8 * 1024 * 1024, // 3.8 MB
    type: 'image/png',
    url: '/设计图.jpg',
    uploadTime: '2025-03-18 10:45:00',
    uploader: '猪大肠',
    scope: 'public'
  },
  {
    id: '4',
    name: '代码示例.zip',
    size: 5.0 * 1024 * 1024, // 5.0 MB
    type: 'application/zip',
    url: '/代码示例.zip',
    uploadTime: '2025-03-17 16:00:00',
    uploader: '狗剩',
    scope: 'public'
  },
  {
    id: '5',
    name: '会议记录.txt',
    size: 0.2 * 1024 * 1024, // 0.2 MB
    type: 'text/plain',
    url: '/会议记录.txt',
    uploadTime: '2025-03-16 08:15:00',
    uploader: '李秘书',
    scope: 'public'
  },
  {
    id: '6',
    name: '未知文件类型.bin',
    size: 0.5 * 1024 * 1024, // 0.5 MB
    type: 'application/octet-stream', // 未知文件类型
    url: '猜猜我是谁.bin',
    uploadTime: '2025-03-14 11:30:00',
    uploader: '无名氏',
    scope: 'public'
  }
];

// 模拟的团队列表
const mockTeams: Team[] = [
  {
    id: '1',
    name: '前端开发组',
    description: '专注于前端技术开发',
    employees: ['e001', 'e002']  // 引用员工的 ID
  },
  {
    id: '2',
    name: '后端开发组',
    description: '负责后端架构和API开发',
    employees: ['e003', 'e004']
  },
  {
    id: '3',
    name: '测试团队',
    description: '进行系统测试和质量保障',
    employees: ['e005']
  }
];

// 团队成员列表
const mockTeamMembers: Employee[] = [
  // 前端组成员
  {
    employeeId: 'e001',
    name: '海绵宝宝',
    avatar: '/海绵宝宝.jpg',
    teamId: '1',
    userId: 'user001',
    status: '在职',
    workload: 70,
    position: '前端工程师',
    authorities: ['admin'],
    online: true,
  },
  {
    employeeId: 'e002',
    name: '派大星',
    avatar: '/派大星.jpg',
    teamId: '1',
    userId: 'user002',
    status: '在职',
    workload: 50,
    position: 'UI设计师',
    authorities: ['manager'],
    online: true,
  },

  // 后端组成员
  {
    employeeId: 'e003',
    name: '章鱼哥',
    avatar: '/章鱼哥.jpg',
    teamId: '2',
    userId: 'user003',
    status: '在职',
    workload: 60,
    position: '后端工程师',
    authorities: ['manager'],
    online: true,
  },
  {
    employeeId: 'e004',
    name: '蟹老板',
    avatar: '/蟹老板.jpg',
    teamId: '2',
    userId: 'user004',
    status: '在职',
    workload: 40,
    position: 'DBA',
    authorities: ['member'],
    online: false,
  },
  {
    employeeId: 'e005',
    name: '痞老板',
    avatar: '/111.jpg',
    teamId: '3',
    userId: 'user005',
    status: '在职',
    workload: 30,
    position: '后端工程师',
    authorities: ['admin'],
    online: true,
  }
];

const mockMemos: Memo[] = [
  {
    id: '1',
    title: '项目会议记录',
    content: '讨论项目进度...',
    category: '工作',
    completed: false,
    createdAt: '2023-07-20',
    attachments: []
  },
  {
    id: '2',
    title: '学习计划',
    content: '完成 Vue 3 学习',
    category: '学习',
    completed: true,
    createdAt: '2023-07-19',
    attachments: []
  },
  {
    id: '9',
    title: '代码评审要点',
    content: `重点检查：
1. 异常处理逻辑
2. 性能优化点
3. 安全漏洞防范`,
    category: '工作',
    completed: false,
    createdAt: '2023-07-25',
    attachments: []
  },
  {
    id: '10',
    title: '团队建设活动',
    content: '计划组织季度团建活动，备选方案：\n- 户外拓展\n- 温泉度假\n- 密室逃脱',
    category: '生活',
    completed: false,
    createdAt: '2023-07-24',
    attachments: []
  }
]


const mockSchedules: Schedule[] = [
  {
    id: '1',
    title: '团队会议',
    date: '2025-04-10',
    time: '10:00',
    participants: ['e001', 'e002', 'e003'],
  },
  {
    id: '2',
    title: '项目更新通知',
    date: '2025-04-11',
    time: '14:00',
    participants: ['e001', 'e004'],
  },
  {
    id: '3',
    title: '代码审查',
    date: '2025-04-12',
    time: '09:00',
    participants: ['e002', 'e003'],
  },
];

const mockChatSessions: ChatSession[] = [
  {
    id: 't001',
    type: 'group',
    name: '前端开发组',
    members: ['e001', 'e002', 'e003'],
    lastMessage: '大家记得今天下午的代码评审',
    unread: 2,
    timestamp: '2023-07-25T14:30:00Z'
  },
  {
    id: 'e001_e002',
    type: 'private',
    name: '李四',
    members: ['e001', 'e002'],
    lastMessage: '那个组件逻辑我重构好了',
    unread: 1,
    timestamp: '2023-07-25T15:00:00Z'
  }
];

const mockMessages: ChatMessage[] = [
  {
    id: 'm1',
    sessionId: 't001',
    sessionType: 'group',
    content: '今天我们要完成首页优化',
    sender: 'e002',
    timestamp: '2023-07-25T09:00:00Z',
    isRead: true
  },
  {
    id: 'm2',
    sessionId: 't001',
    sessionType: 'group',
    content: '接口文档已更新到GitHub',
    sender: 'e001',
    timestamp: '2023-07-25T09:05:00Z',
    isRead: false,
    file: {
      id: 'f1',
      name: 'api-docs.pdf',
      size: 1024 * 1024 * 2,
      type: 'application/pdf',
      url: '/files/api-docs.pdf',
      uploadTime: '2023-07-25T09:04:00Z'
    }
  }
];


// JWT密钥
const JWT_SECRET = 'mock_secret';

export default [

  // 登录接口 Mock
  {
    url: '/auth/login',
    method: 'post',
    response: ({ body }: { body: User }) => {
      const { username, password } = body;
      const checkUser = mockUsers.find(
        // 这里暂且只验证账号，因为密码进行了加密，mock中使用的是明文。无法比较
        (user) => user.username === username)
      if (!checkUser) {
        return {
          code: 401,
          data: { message: '用户名或密码错误' }
        }
      }
      const { token } = checkUser;
      return token;
    }
  },

  // 用户信息接口 Mock
  {
    url: '/auth/userinfo',
    method: 'get',
    response: (request: { headers: { [key: string]: string } }) => {
      const authHeader = request.headers.authorization;
      if (!authHeader) {
        return { message: '未检测到Authorization头' }
      }
      if (!authHeader.startsWith('Bearer ')) {
        return { message: 'Token格式错误: 缺少Bearer前缀' }
      }
      // 2. 提取实际Token
      const token = authHeader.split(' ')[1];
      // 3. 查询用户信息
      const user = mockUsers.find(item => item.token === token);
      if (!user) {
        return { message: '未找到该用户' }
      }
      return user
    }
  },


  // 根据用户ID获取员工信息
  {
    url: '/employees/:userId',
    method: 'get',
    response: (request: { query: { userId: string } }) => {
      const employee = mockTeamMembers.find(
        e => e.userId === request.query.userId
      );
      return employee || null;
    }
  },

  // 项目列表
  {
    url: '/projects',
    method: 'get',
    response: () => {
      return mockProjects;
    }
  },

  // 获取项目下的任务
  {
    url: '/projects/:projectId/tasks',
    method: 'get',
    response: (request: { query: { projectId: string } }) => {
      const projectId = request.query.projectId;
      const project = mockProjects.find(t => t.projectId === projectId);
      return project?.tasks || [];
    }
  },

  // 获取项目任务详情
  {
    url: '/projects/:projectId/tasks/:taskId',
    method: 'get',
    response: (request: { query: { projectId: string, taskId: string } }) => {
      const project = mockProjects.find(p =>
        p.projectId === request.query.projectId
      )
      if (!project) {
        return { message: '项目不存在' }
      }
      const task = project.tasks.find(t =>
        t.id === request.query.taskId
      )
      return task || null;
    }
  },

  // 任务列表接口（返回精简数据）
  {
    url: '/tasks',
    method: 'get',
    response: () => mockTasks.map(task => ({
      projectId: task.projectId,
      id: task.id,
      title: task.title,
      status: task.status,
      employeeId: task.employeeId,
      priority: task.priority,
      scheduledTime: task.scheduledTime,
      completedTime: task.completedTime,
      deadline: task.deadline,
      creator: task.creator
    }))
  },

  // 任务详情接口（返回完整数据）
  {
    url: '/tasks/:taskId', // 动态路由匹配任务 ID
    method: 'get',
    response: (request: { query: { taskId: string } }) => {
      const taskId = request.query.taskId;
      console.log('请求的 taskId:', taskId);

      const task = mockTasks.find(t => t.id === taskId);
      return task || null;
    }
  },


  // 获取公共文件列表
  {
    url: '/files/public',
    method: 'get',
    response: () => mockPublicFiles
  },

  // 上传公共文件
  {
    url: '/files/public',
    method: 'post',
    response: ({ body }: MockParams) => {
      const newFile: FileItem = {
        id: `public${mockPublicFiles.length + 1}`,
        name: body.name,
        size: body.size,
        type: body.type,
        url: `/public/${body.name}`,
        uploadTime: new Date().toISOString(),
        uploader: 'mockUser',
        scope: 'public'
      };
      mockPublicFiles.push(newFile);
      return newFile;
    }
  },

  // 任务文件上传
  {
    url: '/tasks/:id/files',
    method: 'post',
    response: ({ params, body }: MockParams) => {
      const task = mockTasks.find(t => t.id === params.id);
      if (!task) return { code: 404 };
      const newFile: FileItem = {
        id: `file${(task.files?.length || 0) + 1}`, // 使用可选链操作符确保安全访问 length
        name: body.name,
        size: body.size,
        type: body.type,
        url: `/tasks/${params.id}/${body.name}`,
        uploadTime: new Date().toISOString(),
        uploader: 'mockUser',
        scope: 'task',
        taskId: params.id
      };

      task.files?.push(newFile);
      return newFile;
    }
  },

  // 文件删除接口
  {
    url: '/files/:fileId',
    method: 'delete',
    response: ({ params }: MockParams) => {
      // 删除任务文件
      mockTasks.forEach(task => {
        task.files = task.files?.filter(f => f.id !== params.fileId) || [];
      });

      // 删除公共文件
      mockPublicFiles = mockPublicFiles.filter(f => f.id !== params.fileId);
      return { message: '文件删除成功' }
    }
  },

  // 文件下载接口
  {
    url: '/files/download/:fileId',
    method: 'get',
    response: ({ params }: MockParams) => {
      // 合并所有文件源
      const allFiles = [
        ...mockPublicFiles,
        ...mockTasks.flatMap(t => t.files || [])
      ];
      const file = allFiles.find(f => f.id === params.fileId);

      if (!file) return { code: 404 };

      // 关键修改：返回 public 目录真实文件
      return {
        headers: {
          'Content-Type': file.type,
          'Content-Disposition': `attachment; filename="${file.name}"`
        },
        // 返回 public 目录文件的实际二进制流
        rawResponse: async () => {
          const res = await fetch(file.url); // 从 public 目录获取真实文件
          const buffer = await res.arrayBuffer();
          return new Response(buffer, {
            headers: {
              'Content-Type': file.type
            }
          });
        }
      };
    }
  },

  // 获取所有员工列表
  {
    url: '/employees',
    method: 'get',
    response: () => mockTeamMembers.map(employee => ({
      employeeId: employee.employeeId,
      name: employee.name,
      avatar: employee.avatar,
      teamId: employee.teamId,
      userId: employee.userId,
      status: employee.status,
      workload: employee.workload,
      position: employee.position,
      online: employee.online
    }))
  },


  // 获取团队列表
  {
    url: '/teams',
    method: 'get',
    response: () => {
      return mockTeams;
    }
  },

  // 获取单个团队详情
  {
    url: '/teams/:teamId',
    method: 'get',
    response: (request: { query: { teamId: string } }) => {
      const teamId = request.query.teamId;
      const team = mockTeams.find(t => t.id === teamId);
      return team || null;
    }
  },

  //根据成员获取所在团队列表
  {
    url: '/employees/:employeeId/teams',
    method: 'get',
    response: (request: { query: { employeeId: string } }) => {
      const employeeId = request.query.employeeId;
      const teams = mockTeams.filter(t => t.employees.includes(employeeId));  // 使用 includes 查找 employeeId
      return teams.length > 0 ? teams : [];
    }
  },

  // 获取团队成员列表
  {
    url: '/teams/:teamId/members',
    method: 'get',
    response: (request: { query: { teamId: string } }) => {
      const teamId = request.query.teamId;
      const members = mockTeamMembers.filter(m => m.teamId === teamId);
      return members || null;
    }
  },

  // 获取任务操作日志
  {
    url: '/tasks/:id/operations',
    method: 'get',
    response: ({ params }: MockParams) => { // 正确获取路径参数
      const task = mockTasks.find(t => t.id === params.id);
      return {
        items: task?.operations || [],
        total: task?.operations?.length || 0
      };
    }
  },

  // 直接按照固定类型对应公告（静态）
  // {
  //   url: '/notices/carousel',
  //   method: 'get',
  //   response: () => ({ code: 200, data: mockNotices.filter(n => n.type === 'carousel') })
  // },
  // {
  //   url: '/notices/technology',
  //   method: 'get',
  //   response: () => ({ code: 200, data: mockNotices.filter(n => n.type === 'technology') })
  // },
  // {
  //   url: '/notices/policy',
  //   method: 'get',
  //   response: () => ({ code: 200, data: mockNotices.filter(n => n.type === 'policy') })
  // },

  // 获取分类公告(动态判断公告类型)
  {
    url: '/notices/:type',
    method: 'get',
    response: (request: { query: { type?: string } }) => {
      const type = request.query.type as NoticeType
      return mockNotices.filter(n => n.type === type);
    }
  },

  // 获取公告详情
  {
    url: '/notice/:id',
    method: 'get',
    response: (request: { query: { id: string } }) => {
      const noticeId = request.query.id;
      const notice = mockNotices.find(n => n.id === noticeId)
      return notice || null;
    }
  },

  // 更新点击量
  {
    url: '/notices/:id/hit',
    method: 'put',
    response: (request: { query: { id: string } }) => {
      const noticeId = request.query.id;
      const notice = mockNotices.find(n => n.id === noticeId)
      if (notice)
        notice.hit++
      return notice || null;
    }
  },

  // 获取备忘录
  {
    url: '/memos',
    method: 'get',
    response: () => {
      return mockMemos;
    }
  },

  // 获取用户列表
  {
    url: '/users',
    method: 'get',
    response: () => {
      return mockUsers;
    }
  },

  // 获取角色列表
  {
    url: '/roles',
    method: 'get',
    response: () => {
      return [
        { roleId: 'admin', roleName: '系统管理员' },
        { roleId: 'manager', roleName: '经理' },
        { roleId: 'member', roleName: '普通员工' }
      ];
    }
  },

  // 模拟获取日程列表
  {
    url: '/schedules',
    method: 'get',
    response: () => {
      return mockSchedules;
    },
  },

  // 聊天相关接口
  {
    url: '/chat/sessions',
    method: 'get',
    response: () => mockChatSessions
  },
  {
    url: '/chat/messages',
    method: 'get',
    response: (request: { query: { sessionId: string } }) => {
      return mockMessages.filter(m => m.sessionId === request.query.sessionId);
    }
  },
  {
    url: '/chat/unread',
    method: 'get',
    response: () => ({
      total: 3,
      details: {
        't001': 2,
        'e001_e002': 1
      }
    })
  },
  {
    url: '/employee/online',
    method: 'get',
    response: () => mockTeamMembers.filter(e => e.online)
  },
  // WebSocket模拟接口
  {
    url: '/ws',
    method: 'get',
    ws: true,
    setup: (wss: WebSocketServer) => {
      wss.on('connection', (ws: WebSocket) => {
        // 定时发送模拟消息
        const timer = setInterval(() => {
          const mockMessage = {
            id: `mock_${Date.now()}`,
            sessionId: 't001',
            sessionType: 'group',
            content: `系统时间：${new Date().toLocaleTimeString()}`,
            sender: 'system',
            timestamp: new Date().toISOString(),
            isRead: false
          };
          ws.send(JSON.stringify(mockMessage));
        }, 5000);

        ws.on('close', () => {
          clearInterval(timer);
        });
      });
    }
  }

] as MockMethod[];

