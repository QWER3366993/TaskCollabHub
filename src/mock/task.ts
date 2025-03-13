import type { MockMethod } from 'vite-plugin-mock';
import type { Task, OperationLog, FileItem } from '@/types/task';
import type { Comment } from '@/types/comment';
import { createRouter } from 'vue-router';


// // 自定义路径参数类型
interface MockParams {
  params: {
    id?: string;
    taskId?: string;
    fileId?: string;
  };
  body?:any;
}

// 统一的任务数据源
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
        name: '需求文档.pdf',
        size: 2.5 * 1024 * 1024,
        type: 'application/pdf',
        url: '/海南大学教务处关于做好2025届普通本科毕业论文（设计）相关工作的通知.pdf',
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
          deadline: {
            old: '2024-05-30',
            new: '2024-06-05'
          }
        }
      },
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
    id: 'public1',
    name: '公司规范手册.pdf',
    size: 2.5 * 1024 * 1024,
    type: 'application/pdf',
    url: '/public/company-handbook.pdf',
    uploadTime: '2025-03-20 09:00:00',
    uploader: 'admin',
    scope: 'public'
  }
];



export default [
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
      if (!taskId) {
        return {
          status: 400,
          body: {
            code: 400,
            message: "缺少任务ID参数"
          }
        };
      }
      const task = mockTasks.find(t => t.id === taskId);
      if (!task) {
        return {
          status: 404,
          body: {
            code: 404,
            message: '任务不存在'
          }
        };
      }
      return task;
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

] as MockMethod[];

