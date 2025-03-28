export interface Comment {
  user: {
    employeeId: string;
    avatar: string;
    name: string;
  };
  commentId: string;
  taskId: string;
  content: string;
  createdAt: string;
}
