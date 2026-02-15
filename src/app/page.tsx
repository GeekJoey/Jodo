"use client";

import { useState, useEffect, useCallback } from "react";
import { format, addDays, startOfWeek, isSameDay, addWeeks, subWeeks, isToday } from "date-fns";
import { zhCN } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ChevronLeft, ChevronRight, Plus, Loader2, Calendar, List, Check, X, LayoutGrid, CalendarDays, ListTodo, Inbox } from "lucide-react";
import { TaskCard } from "@/components/TaskCard";
import { TaskForm } from "@/components/TaskForm";
import { TagManager } from "@/components/TagManager";
import { TaskPool } from "@/components/TaskPool";
import { TaskListView } from "@/components/TaskListView";
import { Task, Tag, InsertTask, TimeSlot, TaskStatus } from "@/types";

const timeSlots: { key: TimeSlot; label: string; icon: string }[] = [
  { key: "morning", label: "上午", icon: "🌅" },
  { key: "afternoon", label: "下午", icon: "☀️" },
  { key: "evening", label: "晚上", icon: "🌙" },
];

type ViewMode = "week" | "day" | "list";

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [unassignedTasks, setUnassignedTasks] = useState<Task[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [defaultTimeSlot, setDefaultTimeSlot] = useState<TimeSlot>("morning");
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [defaultUnassigned, setDefaultUnassigned] = useState(false);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // 检测移动端
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

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

  // 加载所有已分配任务（用于列表视图）
  const loadAllTasks = useCallback(async () => {
    try {
      // 获取未来30天的任务
      const today = format(new Date(), "yyyy-MM-dd");
      const futureDate = format(addDays(new Date(), 365), "yyyy-MM-dd");
      const res = await fetch(`/api/tasks?start_date=${today}&end_date=${futureDate}`);
      const data = await res.json();
      const transformedTasks = (data.data || []).map((task: Record<string, unknown>) => ({
        ...task,
        hours: parseFloat(String(task.hours)) || 0,
        timeSlot: task.timeSlot as TimeSlot,
        status: task.status as TaskStatus,
      }));
      return transformedTasks;
    } catch (error) {
      console.error("Failed to load all tasks:", error);
      return [];
    }
  }, []);

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
        setSelectedTask(null);
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
        setSelectedTask(null);
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
        setSelectedTask(null);
      }
    } catch (error) {
      console.error("Failed to assign task:", error);
    }
  };

  // 取消分配（移回待办池）
  const handleUnassignTask = async (taskId: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: null, timeSlot: null }),
      });
      if (res.ok) {
        await Promise.all([loadTasks(), loadUnassignedTasks()]);
        setSelectedTask(null);
      }
    } catch (error) {
      console.error("Failed to unassign task:", error);
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
    e.dataTransfer.setData("application/json", JSON.stringify({ taskId: task.id, type: "task" }));
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

  // 点击任务（移动端选择）
  const handleTaskClick = (task: Task) => {
    if (isMobile) {
      setSelectedTask(selectedTask?.id === task.id ? null : task);
    }
  };

  // 点击时段格子（移动端分配）
  const handleSlotClick = (date: string, timeSlot: TimeSlot) => {
    if (isMobile && selectedTask) {
      handleAssignTask(selectedTask.id, date, timeSlot);
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
    setSelectedTask(null);
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

  // 导航控制
  const navigatePrev = () => {
    if (viewMode === "week") {
      setCurrentDate(subWeeks(currentDate, 1));
    } else {
      setCurrentDate(addDays(currentDate, -1));
    }
  };

  const navigateNext = () => {
    if (viewMode === "week") {
      setCurrentDate(addWeeks(currentDate, 1));
    } else {
      setCurrentDate(addDays(currentDate, 1));
    }
  };

  const navigateToday = () => {
    setCurrentDate(new Date());
  };

  // 获取当前显示的日期标题
  const getDateTitle = () => {
    if (viewMode === "day") {
      const dateStr = format(currentDate, "yyyy年M月d日", { locale: zhCN });
      const weekday = format(currentDate, "EEEE", { locale: zhCN });
      const todayMark = isToday(currentDate) ? " (今天)" : "";
      return `${dateStr} ${weekday}${todayMark}`;
    } else if (viewMode === "week") {
      return `${format(weekDays[0], "yyyy年M月d日", { locale: zhCN })} - ${format(weekDays[6], "M月d日", { locale: zhCN })}`;
    }
    return "所有任务";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // 移动端视图
  if (isMobile) {
    return (
      <div className="min-h-screen bg-background">
        <div className="p-3">
          {/* 头部 */}
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold">任务管理</h1>
            <TagManager
              tags={tags}
              onAdd={handleAddTag}
              onUpdate={handleUpdateTag}
              onDelete={handleDeleteTag}
            />
          </div>

          {/* 选中任务提示 */}
          {selectedTask && (
            <Card className="mb-4 border-primary bg-primary/5">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="default" className="text-xs">已选中</Badge>
                    <span className="font-medium text-sm">{selectedTask.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedTask.date && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUnassignTask(selectedTask.id)}
                      >
                        移回待办
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedTask(null)}
                    >
                      取消
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">点击日历中的时段进行分配</p>
              </CardContent>
            </Card>
          )}

          <Tabs defaultValue="pool" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="pool">
                <Inbox className="h-4 w-4 mr-1" />
                待办 ({unassignedTasks.length})
              </TabsTrigger>
              <TabsTrigger value="calendar">
                <Calendar className="h-4 w-4 mr-1" />
                日历
              </TabsTrigger>
              <TabsTrigger value="list">
                <ListTodo className="h-4 w-4 mr-1" />
                列表
              </TabsTrigger>
            </TabsList>

            {/* 待办事项池 */}
            <TabsContent value="pool" className="mt-0">
              <Card>
                <CardHeader className="pb-2 pt-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">待办事项</CardTitle>
                    <Button variant="outline" size="sm" onClick={openNewUnassignedTaskForm}>
                      <Plus className="h-4 w-4 mr-1" />
                      添加
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-2">
                  {unassignedTasks.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Inbox className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">暂无待办事项</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {unassignedTasks.map((task) => {
                        const tag = getTagById(task.tagId);
                        const isSelected = selectedTask?.id === task.id;
                        return (
                          <div
                            key={task.id}
                            onClick={() => handleTaskClick(task)}
                            className={`flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-colors ${
                              isSelected
                                ? "bg-primary/10 border-2 border-primary"
                                : "bg-muted/50 border-2 border-transparent hover:bg-muted"
                            }`}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm truncate">{task.title}</div>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {task.hours}h
                                </Badge>
                                {tag && (
                                  <Badge
                                    style={{ backgroundColor: tag.color, color: "#fff" }}
                                    className="text-xs"
                                  >
                                    {tag.name}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditTaskForm(task);
                              }}
                            >
                              <Plus className="h-4 w-4 rotate-45" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* 日历视图 */}
            <TabsContent value="calendar" className="mt-0">
              {/* 视图切换 */}
              <div className="flex items-center justify-between mb-3">
                <ToggleGroup
                  type="single"
                  value={viewMode === "list" ? "day" : viewMode}
                  onValueChange={(v) => v && setViewMode(v as ViewMode)}
                  className="border rounded-lg"
                >
                  <ToggleGroupItem value="day" className="px-3 text-xs">
                    <CalendarDays className="h-4 w-4 mr-1" />
                    日
                  </ToggleGroupItem>
                  <ToggleGroupItem value="week" className="px-3 text-xs">
                    <LayoutGrid className="h-4 w-4 mr-1" />
                    周
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>

              {/* 日期导航 */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={navigatePrev}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={navigateNext}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" className="h-8" onClick={navigateToday}>
                    今天
                  </Button>
                </div>
                <span className="text-sm font-medium">{getDateTitle()}</span>
              </div>

              {/* 周视图：日期选择器 */}
              {viewMode === "week" && (
                <div className="flex gap-1 mb-3 overflow-x-auto pb-2">
                  {weekDays.map((day) => {
                    const dateStr = format(day, "yyyy-MM-dd");
                    const isTodayDate = isSameDay(day, new Date());
                    const dayTasks = tasks.filter((t) => t.date === dateStr);
                    const isSelected = selectedDate === dateStr;

                    return (
                      <button
                        key={dateStr}
                        onClick={() => setSelectedDate(dateStr)}
                        className={`flex-shrink-0 w-12 py-2 rounded-lg text-center transition-colors ${
                          isSelected
                            ? "bg-primary text-primary-foreground"
                            : isTodayDate
                            ? "bg-muted border border-primary"
                            : "bg-muted/50 hover:bg-muted"
                        }`}
                      >
                        <div className="text-xs">{format(day, "EEE", { locale: zhCN })}</div>
                        <div className="text-lg font-bold">{format(day, "d")}</div>
                        {dayTasks.length > 0 && (
                          <div className="flex justify-center gap-0.5 mt-1">
                            {dayTasks.slice(0, 3).map((_, i) => (
                              <div
                                key={i}
                                className={`w-1.5 h-1.5 rounded-full ${
                                  isSelected ? "bg-primary-foreground/50" : "bg-primary"
                                }`}
                              />
                            ))}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* 时段列表 */}
              <div className="space-y-3">
                {(viewMode === "day" ? [format(currentDate, "yyyy-MM-dd")] : [selectedDate]).map((displayDate) =>
                  timeSlots.map((slot) => {
                    const slotTasks = getTasksByDateAndSlot(displayDate, slot.key);
                    const totalHours = getTotalHours(displayDate, slot.key);

                    return (
                      <Card key={`${displayDate}-${slot.key}`}>
                        <CardHeader className="pb-1 pt-2 px-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-sm flex items-center gap-2">
                              <span>{slot.icon}</span>
                              {slot.label}
                              {totalHours > 0 && (
                                <Badge variant="secondary" className="text-xs">
                                  {totalHours}h
                                </Badge>
                              )}
                            </CardTitle>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => openNewTaskForm(displayDate, slot.key)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-1 pb-2 px-3">
                          <div
                            onClick={() => handleSlotClick(displayDate, slot.key)}
                            className={`min-h-[40px] rounded transition-colors ${
                              selectedTask ? "border-2 border-dashed border-muted-foreground/30 cursor-pointer hover:bg-muted/50" : ""
                            }`}
                          >
                            {slotTasks.length === 0 ? (
                              <div className="flex items-center justify-center h-[40px] text-xs text-muted-foreground/50">
                                {selectedTask ? "点击放置" : "暂无任务"}
                              </div>
                            ) : (
                              <div className="space-y-1">
                                {slotTasks.map((task) => {
                                  const tag = getTagById(task.tagId);
                                  const isSelected = selectedTask?.id === task.id;
                                  return (
                                    <div
                                      key={task.id}
                                      onClick={() => handleTaskClick(task)}
                                      className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-colors ${
                                        isSelected
                                          ? "bg-primary/10 border border-primary"
                                          : "bg-muted/50 hover:bg-muted"
                                      }`}
                                    >
                                      <span className={`text-xs truncate flex-1 ${task.status === "completed" ? "line-through text-muted-foreground" : ""}`}>
                                        {task.title}
                                      </span>
                                      <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">
                                        {task.hours}h
                                      </Badge>
                                      {tag && (
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.color }} />
                                      )}
                                      <div className="flex items-center gap-0.5">
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-5 w-5"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleStatusChange(task.id, task.status === "completed" ? "pending" : "completed");
                                          }}
                                        >
                                          {task.status === "completed" ? <X className="h-3 w-3" /> : <Check className="h-3 w-3" />}
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-5 w-5"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            openEditTaskForm(task);
                                          }}
                                        >
                                          <Plus className="h-3 w-3 rotate-45" />
                                        </Button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            </TabsContent>

            {/* 列表视图 */}
            <TabsContent value="list" className="mt-0">
              <TaskListView
                tasks={tasks}
                tags={tags}
                onEdit={openEditTaskForm}
                onDelete={handleDeleteTask}
                onStatusChange={handleStatusChange}
                onAddTask={() => {
                  setSelectedDate(format(new Date(), "yyyy-MM-dd"));
                  setDefaultTimeSlot("morning");
                  setDefaultUnassigned(false);
                  setEditingTask(null);
                  setShowTaskForm(true);
                }}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              />
            </TabsContent>
          </Tabs>
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
    );
  }

  // 桌面端视图
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 max-w-7xl">
        {/* 头部 */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">任务管理</h1>
            <p className="text-sm text-muted-foreground">
              拖拽待办事项到日历进行分配，或拖回待办池
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
          onDropToPool={handleUnassignTask}
        />

        {/* 导航和视图切换 */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {viewMode !== "list" && (
              <>
                <Button variant="outline" size="icon" onClick={navigatePrev}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={navigateNext}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" onClick={navigateToday}>
                  今天
                </Button>
              </>
            )}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">{getDateTitle()}</span>
            <ToggleGroup
              type="single"
              value={viewMode}
              onValueChange={(v) => v && setViewMode(v as ViewMode)}
              className="border rounded-lg"
            >
              <ToggleGroupItem value="day" className="px-3">
                <CalendarDays className="h-4 w-4 mr-1" />
                日
              </ToggleGroupItem>
              <ToggleGroupItem value="week" className="px-3">
                <LayoutGrid className="h-4 w-4 mr-1" />
                周
              </ToggleGroupItem>
              <ToggleGroupItem value="list" className="px-3">
                <ListTodo className="h-4 w-4 mr-1" />
                列表
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>

        {/* 周视图 */}
        {viewMode === "week" && (
          <div className="grid grid-cols-7 gap-1.5">
            {weekDays.map((day) => {
              const dateStr = format(day, "yyyy-MM-dd");
              const isTodayDate = isSameDay(day, new Date());

              return (
                <Card
                  key={dateStr}
                  className={`min-h-[350px] ${isTodayDate ? "ring-2 ring-primary" : ""}`}
                >
                  <CardHeader className="p-2 pb-1">
                    <CardTitle className="text-xs font-medium flex items-center justify-between">
                      <span>{format(day, "EEE", { locale: zhCN })}</span>
                      <span
                        className={`text-xs ${isTodayDate ? "bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full" : ""}`}
                      >
                        {format(day, "d")}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-1.5 pt-0 space-y-1">
                    {timeSlots.map((slot) => {
                      const slotTasks = getTasksByDateAndSlot(dateStr, slot.key);
                      const totalHours = getTotalHours(dateStr, slot.key);
                      const isDropTarget = draggedTask !== null;

                      return (
                        <div
                          key={slot.key}
                          className={`p-1 rounded transition-colors ${
                            isDropTarget ? "bg-muted/50" : ""
                          }`}
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDrop(e, dateStr, slot.key)}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] text-muted-foreground">
                              {slot.icon} {slot.label}
                            </span>
                            <div className="flex items-center gap-0.5">
                              {totalHours > 0 && (
                                <Badge variant="secondary" className="text-[9px] px-1 py-0 h-3.5">
                                  {totalHours}h
                                </Badge>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-4 w-4"
                                onClick={() => openNewTaskForm(dateStr, slot.key)}
                              >
                                <Plus className="h-2.5 w-2.5" />
                              </Button>
                            </div>
                          </div>

                          <div className="space-y-0.5 min-h-[30px]">
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
                            {slotTasks.length === 0 && isDropTarget && (
                              <div className="text-[9px] text-muted-foreground/50 text-center py-1 border border-dashed border-muted-foreground/20 rounded">
                                放置
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
        )}

        {/* 日视图 */}
        {viewMode === "day" && (
          <div className="grid grid-cols-3 gap-4">
            {timeSlots.map((slot) => {
              const dateStr = format(currentDate, "yyyy-MM-dd");
              const slotTasks = getTasksByDateAndSlot(dateStr, slot.key);
              const totalHours = getTotalHours(dateStr, slot.key);
              const isDropTarget = draggedTask !== null;

              return (
                <Card key={slot.key} className="min-h-[400px]">
                  <CardHeader className="p-3 pb-2">
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-base">
                        <span className="text-xl">{slot.icon}</span>
                        {slot.label}
                      </span>
                      <div className="flex items-center gap-2">
                        {totalHours > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {totalHours} 小时
                          </Badge>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openNewTaskForm(dateStr, slot.key)}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          添加
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent
                    className={`p-3 pt-0 ${isDropTarget ? "bg-muted/30 rounded-lg" : ""}`}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, dateStr, slot.key)}
                  >
                    <div className="space-y-2">
                      {slotTasks.length === 0 ? (
                        <div className="text-sm text-muted-foreground/50 text-center py-6 border-2 border-dashed border-muted-foreground/20 rounded-lg">
                          {isDropTarget ? "放置到此处" : "暂无任务"}
                        </div>
                      ) : (
                        slotTasks.map((task) => (
                          <TaskCard
                            key={task.id}
                            task={task}
                            tag={getTagById(task.tagId)}
                            onEdit={openEditTaskForm}
                            onDelete={handleDeleteTask}
                            onStatusChange={handleStatusChange}
                            onDragStart={handleDragStart}
                            onDragEnd={handleDragEnd}
                            compact={false}
                          />
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* 列表视图 */}
        {viewMode === "list" && (
          <TaskListView
            tasks={tasks}
            tags={tags}
            onEdit={openEditTaskForm}
            onDelete={handleDeleteTask}
            onStatusChange={handleStatusChange}
            onAddTask={() => {
              setSelectedDate(format(new Date(), "yyyy-MM-dd"));
              setDefaultTimeSlot("morning");
              setDefaultUnassigned(false);
              setEditingTask(null);
              setShowTaskForm(true);
            }}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          />
        )}

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
