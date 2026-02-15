"use client";

import { useState, useEffect, useCallback } from "react";
import { format, addDays, startOfWeek, isSameDay } from "date-fns";
import { zhCN } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Plus, Loader2 } from "lucide-react";
import { TaskCard } from "@/components/TaskCard";
import { TaskForm } from "@/components/TaskForm";
import { TagManager } from "@/components/TagManager";
import { TaskPool } from "@/components/TaskPool";
import { Task, Tag, InsertTask, TimeSlot, TaskStatus, DragData } from "@/types";

const timeSlots: { key: TimeSlot; label: string; icon: string }[] = [
  { key: "morning", label: "上午", icon: "🌅" },
  { key: "afternoon", label: "下午", icon: "☀️" },
  { key: "evening", label: "晚上", icon: "🌙" },
];

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [unassignedTasks, setUnassignedTasks] = useState<Task[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [defaultTimeSlot, setDefaultTimeSlot] = useState<TimeSlot>("morning");
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [defaultUnassigned, setDefaultUnassigned] = useState(false);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);

  // 获取一周的日期
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // 获取日期范围内的任务
  const startDate = format(weekDays[0], "yyyy-MM-dd");
  const endDate = format(weekDays[6], "yyyy-MM-dd");

  // 加载已分配任务
  const loadTasks = useCallback(async () => {
    try {
      const res = await fetch(`/api/tasks?start_date=${startDate}&end_date=${endDate}`);
      const data = await res.json();
      // 转换 hours 为数字
      const transformedTasks = (data.data || []).map((task: Record<string, unknown>) => ({
        ...task,
        hours: parseFloat(String(task.hours)) || 0,
        timeSlot: task.timeSlot as TimeSlot,
        status: task.status as TaskStatus,
      }));
      setTasks(transformedTasks);
    } catch (error) {
      console.error("Failed to load tasks:", error);
    }
  }, [startDate, endDate]);

  // 加载未分配任务
  const loadUnassignedTasks = useCallback(async () => {
    try {
      const res = await fetch("/api/tasks?unassigned=true");
      const data = await res.json();
      const transformedTasks = (data.data || []).map((task: Record<string, unknown>) => ({
        ...task,
        hours: parseFloat(String(task.hours)) || 0,
        status: task.status as TaskStatus,
      }));
      setUnassignedTasks(transformedTasks);
    } catch (error) {
      console.error("Failed to load unassigned tasks:", error);
    }
  }, []);

  // 加载标签
  const loadTags = useCallback(async () => {
    try {
      const res = await fetch("/api/tags");
      const data = await res.json();
      setTags(data.data || []);
    } catch (error) {
      console.error("Failed to load tags:", error);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([loadTasks(), loadUnassignedTasks(), loadTags()]);
      setLoading(false);
    };
    loadData();
  }, [loadTasks, loadUnassignedTasks, loadTags]);

  // 创建任务
  const handleCreateTask = async (data: InsertTask) => {
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        await Promise.all([loadTasks(), loadUnassignedTasks()]);
      }
    } catch (error) {
      console.error("Failed to create task:", error);
    }
  };

  // 更新任务
  const handleUpdateTask = async (task: Task, data: InsertTask) => {
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        await Promise.all([loadTasks(), loadUnassignedTasks()]);
      }
    } catch (error) {
      console.error("Failed to update task:", error);
    }
  };

  // 删除任务
  const handleDeleteTask = async (taskId: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
      if (res.ok) {
        await Promise.all([loadTasks(), loadUnassignedTasks()]);
      }
    } catch (error) {
      console.error("Failed to delete task:", error);
    }
  };

  // 更新任务状态
  const handleStatusChange = async (taskId: string, status: TaskStatus) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        await Promise.all([loadTasks(), loadUnassignedTasks()]);
      }
    } catch (error) {
      console.error("Failed to update task status:", error);
    }
  };

  // 分配任务到日期时段
  const handleAssignTask = async (taskId: string, date: string, timeSlot: TimeSlot) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, timeSlot }),
      });
      if (res.ok) {
        await Promise.all([loadTasks(), loadUnassignedTasks()]);
      }
    } catch (error) {
      console.error("Failed to assign task:", error);
    }
  };

  // 创建标签
  const handleAddTag = async (data: { name: string; color: string }) => {
    try {
      const res = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        await loadTags();
      }
    } catch (error) {
      console.error("Failed to create tag:", error);
    }
  };

  // 更新标签
  const handleUpdateTag = async (id: string, data: Partial<Tag>) => {
    try {
      const res = await fetch(`/api/tags/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        await loadTags();
      }
    } catch (error) {
      console.error("Failed to update tag:", error);
    }
  };

  // 删除标签
  const handleDeleteTag = async (id: string) => {
    try {
      const res = await fetch(`/api/tags/${id}`, { method: "DELETE" });
      if (res.ok) {
        await loadTags();
      }
    } catch (error) {
      console.error("Failed to delete tag:", error);
    }
  };

  // 拖拽开始
  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTask(task);
    const dragData: DragData = { taskId: task.id, type: "task" };
    e.dataTransfer.setData("application/json", JSON.stringify(dragData));
    e.dataTransfer.effectAllowed = "move";
  };

  // 拖拽结束
  const handleDragEnd = () => {
    setDraggedTask(null);
  };

  // 拖拽经过
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  // 放置任务
  const handleDrop = (e: React.DragEvent, date: string, timeSlot: TimeSlot) => {
    e.preventDefault();
    if (draggedTask) {
      handleAssignTask(draggedTask.id, date, timeSlot);
    }
  };

  // 打开新建任务表单（已分配）
  const openNewTaskForm = (date: string, timeSlot: TimeSlot) => {
    setSelectedDate(date);
    setDefaultTimeSlot(timeSlot);
    setEditingTask(null);
    setDefaultUnassigned(false);
    setShowTaskForm(true);
  };

  // 打开新建任务表单（未分配）
  const openNewUnassignedTaskForm = () => {
    setEditingTask(null);
    setDefaultUnassigned(true);
    setShowTaskForm(true);
  };

  // 打开编辑任务表单
  const openEditTaskForm = (task: Task) => {
    setEditingTask(task);
    setSelectedDate(task.date || format(new Date(), "yyyy-MM-dd"));
    setDefaultTimeSlot(task.timeSlot || "morning");
    setDefaultUnassigned(task.date === null);
    setShowTaskForm(true);
  };

  // 获取某天某时段的任务
  const getTasksByDateAndSlot = (date: string, timeSlot: TimeSlot) => {
    return tasks.filter((task) => task.date === date && task.timeSlot === timeSlot);
  };

  // 获取标签
  const getTagById = (tagId: string | null) => {
    if (!tagId) return undefined;
    return tags.find((tag) => tag.id === tagId);
  };

  // 计算某天某时段的总小时数
  const getTotalHours = (date: string, timeSlot: TimeSlot) => {
    return getTasksByDateAndSlot(date, timeSlot)
      .filter((t) => t.status === "pending")
      .reduce((sum, t) => sum + t.hours, 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 max-w-7xl">
        {/* 头部 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">任务管理</h1>
            <p className="text-sm text-muted-foreground">
              按日历规划你的一天，拖拽待办事项进行分配
            </p>
          </div>
          <TagManager
            tags={tags}
            onAdd={handleAddTag}
            onUpdate={handleUpdateTag}
            onDelete={handleDeleteTag}
          />
        </div>

        {/* 待办事项池 */}
        <TaskPool
          tasks={unassignedTasks}
          tags={tags}
          onEdit={openEditTaskForm}
          onDelete={handleDeleteTask}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onAddTask={openNewUnassignedTaskForm}
        />

        {/* 周导航 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentDate(addDays(currentDate, -7))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentDate(addDays(currentDate, 7))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={() => setCurrentDate(new Date())}>
              今天
            </Button>
          </div>
          <div className="text-sm font-medium">
            {format(weekDays[0], "yyyy年M月d日", { locale: zhCN })} -{" "}
            {format(weekDays[6], "M月d日", { locale: zhCN })}
          </div>
        </div>

        {/* 周视图 */}
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day) => {
            const dateStr = format(day, "yyyy-MM-dd");
            const isToday = isSameDay(day, new Date());

            return (
              <Card
                key={dateStr}
                className={`min-h-[400px] ${isToday ? "ring-2 ring-primary" : ""}`}
              >
                <CardHeader className="p-3 pb-2">
                  <CardTitle className="text-sm font-medium flex items-center justify-between">
                    <span>{format(day, "EEE", { locale: zhCN })}</span>
                    <span
                      className={`text-xs ${isToday ? "bg-primary text-primary-foreground px-2 py-0.5 rounded-full" : ""}`}
                    >
                      {format(day, "d")}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-2 pt-0 space-y-3">
                  {timeSlots.map((slot) => {
                    const slotTasks = getTasksByDateAndSlot(dateStr, slot.key);
                    const totalHours = getTotalHours(dateStr, slot.key);
                    const isDropTarget = draggedTask !== null;

                    return (
                      <div
                        key={slot.key}
                        className={`space-y-2 p-1 -m-1 rounded transition-colors ${
                          isDropTarget ? "bg-muted/50" : ""
                        }`}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, dateStr, slot.key)}
                      >
                        <div className="flex items-center justify-between px-1">
                          <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                            <span>{slot.icon}</span>
                            {slot.label}
                          </span>
                          <div className="flex items-center gap-1">
                            {totalHours > 0 && (
                              <Badge variant="secondary" className="text-[10px] px-1.5">
                                {totalHours}h
                              </Badge>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5"
                              onClick={() => openNewTaskForm(dateStr, slot.key)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-1.5 min-h-[60px]">
                          {slotTasks.map((task) => (
                            <TaskCard
                              key={task.id}
                              task={task}
                              tag={getTagById(task.tagId)}
                              onEdit={openEditTaskForm}
                              onDelete={handleDeleteTask}
                              onStatusChange={handleStatusChange}
                              onDragStart={handleDragStart}
                              onDragEnd={handleDragEnd}
                            />
                          ))}
                          {slotTasks.length === 0 && (
                            <div className="text-[10px] text-muted-foreground/50 text-center py-4 border border-dashed border-muted-foreground/20 rounded">
                              {isDropTarget ? "放置到此处" : "暂无任务"}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* 任务表单 */}
        <TaskForm
          open={showTaskForm}
          onOpenChange={setShowTaskForm}
          task={editingTask}
          tags={tags}
          defaultDate={selectedDate}
          defaultTimeSlot={defaultTimeSlot}
          defaultUnassigned={defaultUnassigned}
          onSubmit={(data) => {
            if (editingTask) {
              handleUpdateTask(editingTask, data);
            } else {
              handleCreateTask(data);
            }
          }}
        />
      </div>
    </div>
  );
}
