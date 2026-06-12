export type Role = "admin" | "member";
export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskPriority = "low" | "medium" | "high";

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
}

export interface Project {
  id: number;
  name: string;
  description: string | null;
  deadline: string | null;
  created_by: number;
  member_count?: number;
}

export interface Task {
  id: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  project_id: number;
  assigned_to: number | null;
  assigned_to_name?: string;
}

export interface DashboardData {
  total: number;
  todo: number;
  in_progress: number;
  done: number;
  overdue: number;
  overdue_tasks: Task[];
}
