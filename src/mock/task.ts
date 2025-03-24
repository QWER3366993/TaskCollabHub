import type { MockMethod } from 'vite-plugin-mock';
import type { Task, OperationLog, FileItem } from '@/types/task';
import type { Employee } from '@/types/team';
import type { User } from '@/types/user';
import type { Team } from '@/types/team';
import { i } from 'node_modules/vite/dist/node/types.d-aGj9QkWt';


// // 自定义路径参数类型
interface MockParams {
  params: {
    id?: string;
    taskId?: string;
    fileId?: string;
    teamId?: string;
  };
  body?: any;
}

// 统一的任务数据源
const mockUsers = [
  {
    userId: 'user111',
    username: 'admin',
    password: '123456',
    name: '海绵宝宝',
    authorities: ['admin'],
    avatar: '/admin.png',
    email: 'admin@example.com',
    phone: '13800138000',
    token: 'admin-token'
  },
  {
    userId: 'user222',
    username: 'pdx',
    password: '123456',
    name: '派大星',
    authorities: ['manager'],
    avatar: '/派大星.jpg',
    email: 'pdx@example.com',
    phone: '13800138001',
    token: 'pdx-token'
  }
];

const mockTasks: Task[] = [
  {
    id: '1',
    teamId: '1',
    employeeId: 'u111',
    title: '上山打老虎',
    description: '这是任务1的详细描述',
    status: '待处理',
    priority: '低',
    creator: '李四',
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
        user: {
          avatar: '/111.jpg',
          name: '张三',
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
        employeeId: 'u111',
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
        employeeId: 'u111',
        operationType: 'view',
        operation: '查看任务详情',
        time: '2024-03-25 10:00:00'
      }
    ],
  },
  {
    id: '2',
    teamId: '2',
    employeeId: 'i',
    title: '任务2',
    description: '这是任务2的详细描述',
    status: '进行中',
    priority: '中',
    creator: '王五',
    scheduledTime: '2024-10-01 10:00:00',
    deadline: '2025-03-01 10:00:00',
    comments: [],
    operations: [],
    files: []
  }

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
    description: '专注于前端技术开发'
  },
  {
    id: '2',
    name: '后端开发组',
    description: '负责后端架构和 API 开发'
  },
  {
    id: '3',
    name: '测试团队',
    description: '进行系统测试和质量保障'
  }
];


// 团队成员列表
const mockTeamMembers: Employee[] = [
  {
    employeeId: 'u111',
    name: '派大星',
    avatar: '/派大星.jpg',
    teamId: '1', // 补充团队 ID
    userId: 'user222', // 补充用户 ID
    status: '在职', // 补充状态
    workload: 50, // 补充工作负载 (假设值)
    position: '开发工程师', // 补充职位
    authorities: ['manager'],
  },
  {
    employeeId: 'i',
    name: '海绵宝宝',
    avatar: '/海绵宝宝.jpg',
    teamId: '2', // 补充团队 ID
    userId: 'user111', // 补充用户 ID
    status: '在职', // 补充状态
    workload: 70, // 补充工作负载 (假设值)
    position: '测试工程师',// 补充职位
    authorities: ['manager'],
  },
  {
    employeeId: 'u333',
    name: '章鱼哥',
    avatar: '/章鱼哥.jpg',
    teamId: '2',
    userId: 'user333',
    status: '在职',
    workload: 30,
    position: '后端工程师',
    authorities: ['admin'],
  },
  {
    employeeId: 'u444',
    name: '蟹老板',
    avatar: '/蟹老板.jpg',
    teamId: '1',
    userId: 'user444',
    status: '在职',
    workload: 40,
    position: '测试工程师',
    authorities: ['manager'],
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
        (user) => user.username === username && user.password === password)
      if (!checkUser) {
        return {
          code: 401,
          data: { message: '用户名或密码错误' }
        }
      }
      const { token } = checkUser;
      return { code: 200, data: { token } }
    }
  },

  // 用户信息接口 Mock
  {
    url: '/auth/userinfo',
    method: 'get',
    response: (request: { headers: { [key: string]: string } }) => {
      const authHeader = request.headers.authorization;
      if (!authHeader) {
        return {
          code: 401,
          data: { message: '未检测到Authorization头' },
          status: 401
        };
      }
      if (!authHeader.startsWith('Bearer ')) {
        return {
          code: 401,
          data: { message: 'Token格式错误: 缺少Bearer前缀' },
          status: 401
        };
      }
      // 2. 提取实际Token
      const token = authHeader.split(' ')[1];
      // 3. 查询用户信息
      const user = mockUsers.find(item => item.token === token);
      if (!user) {
        return { code: 401, data: { message: '用户不存在' }, status: 401 };
      }
      return {
        code: 200,
        data: {
          userId: user.userId,
          username: user.username,
          name: user.name,
          avatar: user.avatar,
          authorities: user.authorities
        },
        status: 200
      };
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

      return employee
        ? { code: 200, data: employee }
        : { code: 404 };
    }
  },

  // 任务列表接口（返回精简数据）
  {
    url: '/tasks',
    method: 'get',
    response: () => mockTasks.map(task => ({
      id: task.id,
      title: task.title,
      status: task.status,
      employeeId: task.employeeId,
      priority: task.priority,
      deadline: task.deadline,
      creator: task.creator
    }))
  },

  // 任务详情接口（返回完整数据）
  {
    url: '/tasks/:id', // 动态路由匹配任务 ID
    method: 'get',
    response: (request: { query: { id: string } }) => {
      const taskId = request.query.id;
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
      return { code: 200, data: newFile };
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
      return { code: 200, data: newFile };
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

      return { code: 200 };
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
      position: employee.position
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

  // 操作日志接口
  {
    url: '/tasks/:id/operations', // RESTful 风格路径参数
    method: 'get',
    response: ({ params }: MockParams) => { // 正确获取路径参数
      const task = mockTasks.find(t => t.id === params.id);
      return {
        code: 200,
        data: {
          items: task?.operations || [],
          total: task?.operations?.length || 0
        }
      };
    }
  },

  // 获取所有操作日志
  {
    url: '/operations',
    method: 'get',
    response: () => {
      const allOperations = mockTasks.flatMap(task =>
        task.operations?.map(op => ({
          ...op,
          taskTitle: task.title // 添加任务标题方便显示
        })) || []
      );
      return {
        code: 200,
        data: allOperations
      };
    }
  }
] as MockMethod[];

