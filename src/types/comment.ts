export interface Comment {
  employee: {
    employeeId: string;
    avatar?: string;
    name: string;
  };
  commentId: string;
  taskId: string;
  content: string;
  createdAt: string;
}
