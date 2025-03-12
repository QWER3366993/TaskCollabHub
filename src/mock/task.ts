import type { MockMethod } from 'vite-plugin-mock';
import type { Task, OperationLog } from '@/types/task';
import type { Comment } from '@/types/comment';
import { createRouter } from 'vue-router';


// // 自定义路径参数类型
// interface MockParams {
//   query: Record<string, string>;
// }

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
    image: [
      {
        name: '好看的图',
        url: '/logo.png',  // 指向public目录下的图片
        type: 'image/png',
        size: 1024  // 模拟文件大小
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
    image: []
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
      console.log('Full request object:', request);

    }
  }
] as MockMethod[];

