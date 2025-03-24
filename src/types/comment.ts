export interface Comment {
  user: {
    avatar: string;
    name: string;
  };
  commentId: string;
  taskId: string;
  content: string;
  createdAt: string;
}
