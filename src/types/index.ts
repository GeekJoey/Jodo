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
  date: string;
  timeSlot: TimeSlot;
  hours: number;
  tagId: string | null;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string | null;
}

export interface InsertTask {
  title: string;
  description?: string;
  date: string;
  timeSlot: TimeSlot;
  hours: number;
  tagId?: string;
}
