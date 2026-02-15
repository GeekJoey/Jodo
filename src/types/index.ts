// 前端使用的类型定义

export type TimeSlot = "morning" | "afternoon" | "evening";
export type TaskStatus = "pending" | "completed";

export interface Tag {
  id: string;
  name: string;
  color: string;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  date: string | null; // null 表示未分配到日历
  timeSlot: TimeSlot | null; // null 表示未分配到日历
  hours: number;
  tagId: string | null;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string | null;
}

export interface InsertTask {
  title: string;
  description?: string;
  date?: string | null;
  timeSlot?: TimeSlot | null;
  hours: number;
  tagId?: string;
}

// 拖拽数据类型
export interface DragData {
  taskId: string;
  type: "task";
}
