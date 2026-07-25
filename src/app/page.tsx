"use client";

import { useState, useEffect, useCallback } from "react";
import { format, addDays, startOfWeek, isSameDay, addWeeks, subWeeks, isToday } from "date-fns";
import { zhCN } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ChevronLeft, ChevronRight, Plus, Loader2, Calendar, List, Check, X, CalendarDays, ListTodo, Inbox } from "lucide-react";
import { TaskCard } from "@/components/TaskCard";
import { TaskForm } from "@/components/TaskForm";
import { TagManager } from "@/components/TagManager";
import { TaskPool } from "@/components/TaskPool";
import { TaskListView } from "@/components/TaskListView";
import { Task, Tag, InsertTask, TimeSlot, TaskStatus, TaskPriority } from "@/types";
import { AuthShell } from "@/components/auth-shell";
import { createSupabaseBrowserClient } from "@/storage/database/supabase-browser";
import { ThemeToggle } from "@/components/theme-toggle";

const timeSlots: { key: TimeSlot; label: string; icon: string }[] = [
  { key: "morning", label: "上午", icon: "🌅" },
  { key: "afternoon", label: "下午", icon: "☀️" },
  { key: "evening", label: "晚上", icon: "🌙" },
];

type ViewMode = "day" | "list";

export default function Home() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [unassignedTasks, setUnassignedTasks] = useState<Task[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [currentUser, setCurrentUser] = useState<{ email?: string | null } | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("day");
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [defaultTimeSlot, setDefaultTimeSlot] = useState<TimeSlot>("morning");
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [defaultUnassigned, setDefaultUnassigned] = useState(false);
  const [defaultPriority, setDefaultPriority] = useState<TaskPriority>("normal");
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    let alive = true;

    supabase.auth.getUser().then(({ data }) => {
      if (!alive) {
        return;
      }
      setCurrentUser(data.user);
      setAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user ?? null);
      setAuthLoading(false);
    });

    return () => {
      alive = false;
      subscription.unsubscribe();
    };
  }, []);

  // 检测移动端
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // 获取一周的日期（用于加载数据）
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // 获取日期范围内的任务
  const startDate = format(weekDays[0], "yyyy-MM-dd");
  const endDate = format(weekDays[6], "yyyy-MM-dd");

  // 加载已分配任务
  const loadTasks = useCallback(async () => {
    try {
      // 列表视图加载更多数据
      const loadStartDate = viewMode === "list" 
        ? format(new Date(), "yyyy-MM-dd")
        : startDate;
      const loadEndDate = viewMode === "list"
        ? format(addDays(new Date(), 365), "yyyy-MM-dd")
        : endDate;
      
      const res = await fetch(`/api/tasks?start_date=${loadStartDate}&end_date=${loadEndDate}`);
      const data = await res.json();
      const transformedTasks = (data.data || []).map((task: Record<string, unknown>) => ({
        ...task,
        hours: parseFloat(String(task.hours)) || 0,
        timeSlot: task.timeSlot as TimeSlot,
        status: task.status as TaskStatus,
        priority: (task.priority || "normal") as TaskPriority,
      }));
      setTasks(transformedTasks);
    } catch (error) {
      console.error("Failed to load tasks:", error);
    }
  }, [startDate, endDate, viewMode]);

  // 加载未分配任务
  const loadUnassignedTasks = useCallback(async () => {
    try {
      const res = await fetch("/api/tasks?unassigned=true");
      const data = await res.json();
      const transformedTasks = (data.data || []).map((task: Record<string, unknown>) => ({
        ...task,
        hours: parseFloat(String(task.hours)) || 0,
        status: task.status as TaskStatus,
        priority: (task.priority || "normal") as TaskPriority,
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
    if (!currentUser) {
      return;
    }

    const loadData = async () => {
      setLoading(true);
      await Promise.all([loadTasks(), loadUnassignedTasks(), loadTags()]);
      setLoading(false);
    };
    loadData();
  }, [currentUser, loadTasks, loadUnassignedTasks, loadTags]);

  const handleSignOut = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.refresh();
  };

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
  const handleUnassignTask = async (taskId: string, priority?: TaskPriority) => {
    try {
      const updateData: Record<string, unknown> = { date: null, timeSlot: null };
      if (priority) {
        updateData.priority = priority;
      }
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
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
    setSelectedTask(selectedTask?.id === task.id ? null : task);
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
    setDefaultPriority("normal");
    setShowTaskForm(true);
  };

  // 打开新建任务表单（未分配，指定优先级）
  const openNewUnassignedTaskForm = (priority: TaskPriority = "normal") => {
    setEditingTask(null);
    setDefaultUnassigned(true);
    setDefaultPriority(priority);
    setShowTaskForm(true);
  };

  // 打开编辑任务表单
  const openEditTaskForm = (task: Task) => {
    setEditingTask(task);
    setSelectedDate(task.date || format(new Date(), "yyyy-MM-dd"));
    setDefaultTimeSlot(task.timeSlot || "morning");
    setDefaultUnassigned(task.date === null);
    setDefaultPriority(task.priority || "normal");
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
    setCurrentDate(addDays(currentDate, -1));
  };

  const navigateNext = () => {
    setCurrentDate(addDays(currentDate, 1));
  };

  const navigateToday = () => {
    setCurrentDate(new Date());
  };

  // 获取当前显示的日期标题
  const getDateTitle = () => {
    const dateStr = format(currentDate, "yyyy年M月d日", { locale: zhCN });
    const weekday = format(currentDate, "EEEE", { locale: zhCN });
    const todayMark = isToday(currentDate) ? " (今天)" : "";
    return `${dateStr} ${weekday}${todayMark}`;
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!currentUser) {
    return <AuthShell />;
  }

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
            <div>
              <h1 className="text-xl font-bold">任务管理</h1>
              <p className="text-xs text-muted-foreground">
                {currentUser.email ? `已登录为 ${currentUser.email}` : "已登录"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                退出
              </Button>
              <ThemeToggle />
              <TagManager
                tags={tags}
                onAdd={handleAddTag}
                onUpdate={handleUpdateTag}
                onDelete={handleDeleteTag}
              />
            </div>
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
            </TabsContent>

            {/* 日历视图 */}
            <TabsContent value="calendar" className="mt-0">
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

              {/* 时段列表 */}
              <div className="space-y-3">
                {timeSlots.map((slot) => {
                  const dateStr = format(currentDate, "yyyy-MM-dd");
                  const slotTasks = getTasksByDateAndSlot(dateStr, slot.key);
                  const totalHours = getTotalHours(dateStr, slot.key);

                  return (
                    <Card key={slot.key}>
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
                            onClick={() => openNewTaskForm(dateStr, slot.key)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-1 pb-2 px-3">
                        <div
                          onClick={() => handleSlotClick(dateStr, slot.key)}
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
                                    } ${task.priority === "urgent" ? "border-l-2 border-red-500" : ""}`}
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
                })}
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
                onAssignTask={handleAssignTask}
                onAddTask={openNewTaskForm}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                draggedTask={draggedTask}
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
          defaultPriority={defaultPriority}
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
    <div className="relative min-h-screen overflow-hidden bg-transparent px-4 py-5 sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.04)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:linear-gradient(180deg,black,transparent_90%)]" />
      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-full border border-border/70 bg-background/75 px-4 py-3 backdrop-blur">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              {currentUser.email ?? "已登录"}
            </p>
            <h1 className="font-serif text-2xl tracking-tight text-foreground sm:text-3xl">
              Good morning, let’s make today count.
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="rounded-full" onClick={() => openNewUnassignedTaskForm("normal")}>
              <Plus className="mr-1 h-4 w-4" />
              Create task
            </Button>
            <ThemeToggle />
            <Button variant="outline" size="sm" className="rounded-full" onClick={handleSignOut}>
              退出
            </Button>
          </div>
        </div>

        <div className="grid flex-1 gap-6 xl:grid-cols-[280px_minmax(0,1fr)_320px]">
          <aside className="space-y-6">
            <Card className="border-border/70 bg-background/80 shadow-[0_18px_60px_rgba(15,23,42,0.06)] backdrop-blur">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="font-serif text-2xl">Today</CardTitle>
                  <Badge variant="secondary">{unassignedTasks.length}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">Drag tasks into the calendar</p>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                {unassignedTasks.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border bg-secondary/30 px-4 py-6 text-center text-sm text-muted-foreground">
                    暂无待办事项
                  </div>
                ) : (
                  unassignedTasks.slice(0, 6).map((task) => (
                    <div
                      key={task.id}
                      className="rounded-2xl border border-border/70 bg-background/70 p-1.5 transition-transform hover:-translate-y-0.5"
                      onClick={() => handleTaskClick(task)}
                    >
                      <TaskCard
                        task={task}
                        tag={getTagById(task.tagId)}
                        onEdit={openEditTaskForm}
                        onDelete={handleDeleteTask}
                        onStatusChange={handleStatusChange}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                        compact
                      />
                    </div>
                  ))
                )}
                <Button
                  variant="ghost"
                  className="mt-2 w-full justify-start rounded-2xl border border-dashed border-border text-muted-foreground"
                  onClick={() => openNewUnassignedTaskForm("normal")}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  添加未分配任务
                </Button>
              </CardContent>
            </Card>

            <Card className="border-border/70 bg-background/80 shadow-[0_18px_60px_rgba(15,23,42,0.06)] backdrop-blur">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="font-serif text-xl">Tags</CardTitle>
                  <Badge variant="secondary">{tags.length}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">Organize by focus</p>
              </CardHeader>
              <CardContent className="pt-0">
                <TagManager
                  tags={tags}
                  onAdd={handleAddTag}
                  onUpdate={handleUpdateTag}
                  onDelete={handleDeleteTag}
                />
              </CardContent>
            </Card>
          </aside>

          <main className="space-y-6">
            <Card className="border-border/70 bg-background/80 shadow-[0_18px_60px_rgba(15,23,42,0.06)] backdrop-blur">
              <CardHeader className="space-y-4 border-b border-border/70 pb-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <CardTitle className="font-serif text-3xl">Plan your day</CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">{getDateTitle()}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outline" size="icon" className="rounded-full" onClick={navigatePrev}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" className="rounded-full" onClick={navigateNext}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" className="rounded-full" onClick={navigateToday}>
                      今天
                    </Button>
                    <ToggleGroup
                      type="single"
                      value={viewMode}
                      onValueChange={(v) => v && setViewMode(v as ViewMode)}
                      className="rounded-full border border-border bg-background p-1"
                    >
                      <ToggleGroupItem value="day" className="rounded-full px-3">
                        <CalendarDays className="mr-1 h-4 w-4" />
                        日视图
                      </ToggleGroupItem>
                      <ToggleGroupItem value="list" className="rounded-full px-3">
                        <ListTodo className="mr-1 h-4 w-4" />
                        列表
                      </ToggleGroupItem>
                    </ToggleGroup>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-2">
                  {weekDays.map((day) => {
                    const isCurrent = isSameDay(day, currentDate);
                    const isTodayDay = isToday(day);
                    return (
                      <button
                        key={day.toISOString()}
                        type="button"
                        onClick={() => setCurrentDate(day)}
                        className={`rounded-2xl border px-3 py-2 text-left transition-colors ${
                          isCurrent
                            ? "border-primary bg-primary/10 text-foreground"
                            : "border-border bg-background/60 hover:bg-secondary/40"
                        }`}
                      >
                        <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                          {format(day, "EEE", { locale: zhCN })}
                        </div>
                        <div className="mt-1 flex items-center justify-between gap-2">
                          <span className="text-sm font-medium">
                            {format(day, "MM/dd")}
                          </span>
                          {isTodayDay && (
                            <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-medium text-primary-foreground">
                              Today
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </CardHeader>

              <CardContent className="pt-5">
                {viewMode === "day" ? (
                  <div className="grid gap-4 xl:grid-cols-3">
                    {timeSlots.map((slot) => {
                      const dateStr = format(currentDate, "yyyy-MM-dd");
                      const slotTasks = getTasksByDateAndSlot(dateStr, slot.key);
                      const totalHours = getTotalHours(dateStr, slot.key);
                      const isDropTarget = draggedTask !== null;

                      return (
                        <div
                          key={slot.key}
                          className="min-h-[360px] rounded-[28px] border border-border/70 bg-secondary/20 p-4"
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDrop(e, dateStr, slot.key)}
                        >
                          <div className="mb-4 flex items-center justify-between">
                            <div>
                              <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                                {slot.icon} {slot.label}
                              </div>
                              <div className="mt-1 text-sm text-muted-foreground">
                                {slot.key === "morning" ? "5 AM - 12 PM" : slot.key === "afternoon" ? "12 PM - 5 PM" : "5 PM - 10 PM"}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {totalHours > 0 && (
                                <Badge variant="secondary" className="rounded-full">
                                  {totalHours}h
                                </Badge>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-full"
                                onClick={() => openNewTaskForm(dateStr, slot.key)}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          <div
                            className={`space-y-2 rounded-3xl border border-dashed p-3 transition-colors ${
                              isDropTarget ? "border-primary/40 bg-background/60" : "border-transparent"
                            }`}
                          >
                            {slotTasks.length === 0 ? (
                              <div className="flex min-h-[250px] items-center justify-center rounded-2xl border border-dashed border-border bg-background/70 text-sm text-muted-foreground">
                                {isDropTarget ? "放置到此处" : "暂无任务"}
                              </div>
                            ) : (
                              slotTasks.map((task) => (
                                <div key={task.id} onClick={() => handleTaskClick(task)}>
                                  <TaskCard
                                    task={task}
                                    tag={getTagById(task.tagId)}
                                    onEdit={openEditTaskForm}
                                    onDelete={handleDeleteTask}
                                    onStatusChange={handleStatusChange}
                                    onDragStart={handleDragStart}
                                    onDragEnd={handleDragEnd}
                                    compact
                                  />
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <TaskListView
                    tasks={tasks}
                    tags={tags}
                    onEdit={openEditTaskForm}
                    onDelete={handleDeleteTask}
                    onStatusChange={handleStatusChange}
                    onAssignTask={handleAssignTask}
                    onAddTask={openNewTaskForm}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    draggedTask={draggedTask}
                  />
                )}
              </CardContent>
            </Card>
          </main>

          <aside className="space-y-6">
            <Card className="border-border/70 bg-background/80 shadow-[0_18px_60px_rgba(15,23,42,0.06)] backdrop-blur">
              <CardHeader className="pb-3">
                <CardTitle className="font-serif text-2xl">Today's focus</CardTitle>
                <p className="text-sm text-muted-foreground">One clear next step</p>
              </CardHeader>
              <CardContent className="pt-0">
                {selectedTask ? (
                  <div className="space-y-4 rounded-[28px] border border-border bg-secondary/30 p-4">
                    <div className="flex items-center justify-between">
                      <Badge variant={selectedTask.priority === "urgent" ? "destructive" : "secondary"} className="rounded-full">
                        {selectedTask.priority === "urgent" ? "High priority" : "Planned"}
                      </Badge>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setSelectedTask(null)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div>
                      <h3 className="font-serif text-2xl leading-tight">{selectedTask.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        {selectedTask.description || "No description yet. Keep the task concise and specific."}
                      </p>
                    </div>
                    <div className="grid gap-3 text-sm">
                      <DetailRow label="Status" value={selectedTask.status === "completed" ? "Completed" : "Scheduled"} />
                      <DetailRow label="Estimate" value={`${selectedTask.hours} hours`} />
                      <DetailRow label="Date" value={selectedTask.date ? format(new Date(selectedTask.date), "MMM d") : "Unassigned"} />
                      <DetailRow label="Tag" value={getTagById(selectedTask.tagId)?.name ?? "None"} />
                    </div>
                    <div className="flex gap-2">
                      <Button className="flex-1 rounded-full" onClick={() => openEditTaskForm(selectedTask)}>
                        编辑任务
                      </Button>
                      {selectedTask.date ? (
                        <Button variant="outline" className="rounded-full" onClick={() => handleUnassignTask(selectedTask.id)}>
                          移回待办
                        </Button>
                      ) : null}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-[28px] border border-dashed border-border bg-secondary/20 p-4 text-sm leading-6 text-muted-foreground">
                    点击某个任务查看详情。右侧会显示状态、时长、标签和快速操作。
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-border/70 bg-background/80 shadow-[0_18px_60px_rgba(15,23,42,0.06)] backdrop-blur">
              <CardHeader className="pb-3">
                <CardTitle className="font-serif text-xl">Quick actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                <Button className="w-full rounded-full" onClick={() => openNewUnassignedTaskForm("normal")}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create task
                </Button>
                <Button
                  variant="outline"
                  className="w-full rounded-full"
                  onClick={() => openNewTaskForm(format(currentDate, "yyyy-MM-dd"), "morning")}
                >
                  <CalendarDays className="mr-2 h-4 w-4" />
                  Plan today
                </Button>
              </CardContent>
            </Card>
          </aside>
        </div>

        <TaskForm
          open={showTaskForm}
          onOpenChange={setShowTaskForm}
          task={editingTask}
          tags={tags}
          defaultDate={selectedDate}
          defaultTimeSlot={defaultTimeSlot}
          defaultUnassigned={defaultUnassigned}
          defaultPriority={defaultPriority}
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

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-border bg-background/70 px-3 py-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}
