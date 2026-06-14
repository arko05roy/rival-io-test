export type TaskStatus = "todo" | "in_progress" | "complete";
export type TaskPriority = "low" | "medium" | "high";

export interface User {
  id: string;
  email: string;
  role: string;
  created_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskListResponse {
  tasks: Task[];
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface TaskFilters {
  status?: string;
  search?: string;
  sort_by?: "due_date" | "priority" | "created_at";
  sort_order?: "asc" | "desc";
  page?: number;
  limit?: number;
}
