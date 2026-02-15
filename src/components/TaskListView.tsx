"use client";

import { useState } from "react";
import { format, isToday, isTomorrow, isYesterday, addDays } from "date-fns";
import { zhCN } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Clock, Pencil, Trash2, Plus, Check, X, GripVertical, ChevronDown, ChevronRight } from "lucide-react";
import { Task, Tag, TimeSlot, TaskStatus } from "@/types";

const timeSlots: { key: TimeSlot; label: string; icon: string }[] = [
  { key: "morning", label: "上午", icon: "🌅" },
  { key: "afternoon", label: "下午", icon: "☀️" },
  { key: "evening", label: "晚上", icon: "🌙" },
];

interface TaskListViewProps {
  tasks: Task[];
  tags: Tag[];
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onAssignTask: (taskId: string, date: string, timeSlot: TimeSlot) => void;
  onAddTask: (date: string, timeSlot: TimeSlot) => void;
  onDragStart: (e: React.DragEvent, task: Task) => void;
  onDragEnd: (e: React.DragEvent) => void;
  draggedTask: Task | null;
}

export function TaskListView({
  tasks,
  tags,
  onEdit,
  onDelete,
  onStatusChange,
  onAssignTask,
  onAddTask,
  onDragStart,
  onDragEnd,
  draggedTask,
}: TaskListViewProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());

  const handleDelete = () => {
    if (taskToDelete) {
      onDelete(taskToDelete.id);
    }
    setShowDeleteDialog(false);
    setTaskToDelete(null);
  };

  const getTagById = (tagId: string | null) => {
    if (!tagId) return undefined;
    return tags.find((tag) => tag.id === tagId);
  };

  const formatDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    let label = format(date, "M月d日 EEEE", { locale: zhCN });
    
    if (isToday(date)) {
      label = `今天 (${format(date, "M月d日")})`;
    } else if (isTomorrow(date)) {
      label = `明天 (${format(date, "M月d日")})`;
    } else if (isYesterday(date)) {
      label = `昨天 (${format(date, "M月d日")})`;
    }
    
    return label;
  };

  // 按日期和时段分组
  const groupedByDate = tasks.reduce((acc, task) => {
    if (!task.date) return acc;
    if (!acc[task.date]) {
      acc[task.date] = { morning: [], afternoon: [], evening: [] };
    }
    if (task.timeSlot) {
      acc[task.date][task.timeSlot].push(task);
    }
    return acc;
  }, {} as Record<string, Record<TimeSlot, Task[]>>);

  // 排序日期
  const sortedDates = Object.keys(groupedByDate).sort();

  // 切换日期展开状态
  const toggleDateExpand = (date: string) => {
    const newExpanded = new Set(expandedDates);
    if (newExpanded.has(date)) {
      newExpanded.delete(date);
    } else {
      newExpanded.add(date);
    }
    setExpandedDates(newExpanded);
  };

  // 计算某天某时段的总小时数
  const getSlotHours = (date: string, slot: TimeSlot) => {
    return groupedByDate[date][slot]
      .filter((t) => t.status === "pending")
      .reduce((sum, t) => sum + t.hours, 0);
  };

  // 计算某天的总小时数
  const getDayHours = (date: string) => {
    return timeSlots.reduce((sum, slot) => sum + getSlotHours(date, slot.key), 0);
  };

  // 拖拽处理
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, date: string, timeSlot: TimeSlot) => {
    e.preventDefault();
    if (draggedTask && draggedTask.id) {
      // 只有当目标位置不同时才更新
      if (draggedTask.date !== date || draggedTask.timeSlot !== timeSlot) {
        onAssignTask(draggedTask.id, date, timeSlot);
      }
    }
  };

  // 初始化时展开今天和明天
  useState(() => {
    const today = format(new Date(), "yyyy-MM-dd");
    const tomorrow = format(addDays(new Date(), 1), "yyyy-MM-dd");
    setExpandedDates(new Set([today, tomorrow]));
  });

  return (
    <Card>
      <CardHeader className="pb-2 pt-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            任务列表
            <Badge variant="secondary" className="ml-2">
              {tasks.filter(t => t.date).length}
            </Badge>
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAddTask(format(new Date(), "yyyy-MM-dd"), "morning")}
          >
            <Plus className="h-4 w-4 mr-1" />
            添加任务
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          拖拽任务可以在不同日期和时段之间移动
        </p>
      </CardHeader>
      <CardContent className="pt-2">
        {sortedDates.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground border-2 border-dashed border-muted-foreground/20 rounded-lg">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">暂无已分配的任务</p>
            <p className="text-xs mt-1">从待办池拖拽任务到日历进行分配</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sortedDates.map((date) => {
              const isExpanded = expandedDates.has(date);
              const dayHours = getDayHours(date);
              const dayTasks = timeSlots.reduce((sum, slot) => sum + groupedByDate[date][slot.key].length, 0);
              const isDropTarget = draggedTask !== null;

              return (
                <div key={date} className="border rounded-lg overflow-hidden">
                  {/* 日期标题栏 */}
                  <div
                    className="flex items-center justify-between px-3 py-2 bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => toggleDateExpand(date)}
                  >
                    <div className="flex items-center gap-2">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="font-medium text-sm">{formatDateLabel(date)}</span>
                      <Badge variant="outline" className="text-xs">
                        {dayTasks} 项
                      </Badge>
                      {dayHours > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {dayHours}h
                        </Badge>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddTask(date, "morning");
                      }}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  {/* 时段和任务列表 */}
                  {isExpanded && (
                    <div className="p-2 space-y-2">
                      {timeSlots.map((slot) => {
                        const slotTasks = groupedByDate[date][slot.key];
                        const slotHours = getSlotHours(date, slot.key);
                        const isSlotDropTarget = isDropTarget && draggedTask?.date !== date || draggedTask?.timeSlot !== slot.key;

                        return (
                          <div
                            key={slot.key}
                            className={`p-2 rounded-lg transition-colors ${
                              isSlotDropTarget ? "bg-muted/30 ring-1 ring-dashed ring-muted-foreground/30" : ""
                            }`}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, date, slot.key)}
                          >
                            {/* 时段标题 */}
                            <div className="flex items-center justify-between mb-1.5">
                              <div className="flex items-center gap-1.5">
                                <span className="text-sm">{slot.icon}</span>
                                <span className="text-xs font-medium text-muted-foreground">{slot.label}</span>
                                {slotHours > 0 && (
                                  <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">
                                    {slotHours}h
                                  </Badge>
                                )}
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5"
                                onClick={() => onAddTask(date, slot.key)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>

                            {/* 任务列表 */}
                            <div className="space-y-1 min-h-[32px]">
                              {slotTasks.length === 0 ? (
                                isSlotDropTarget && (
                                  <div className="text-[10px] text-muted-foreground/50 text-center py-1">
                                    放置到此处
                                  </div>
                                )
                              ) : (
                                slotTasks.map((task) => {
                                  const tag = getTagById(task.tagId);
                                  return (
                                    <div
                                      key={task.id}
                                      draggable
                                      onDragStart={(e) => onDragStart(e, task)}
                                      onDragEnd={onDragEnd}
                                      className={`group flex items-center gap-1.5 px-2 py-1 bg-muted/50 rounded cursor-grab active:cursor-grabbing hover:bg-muted transition-colors ${
                                        task.status === "completed" ? "opacity-60" : ""
                                      }`}
                                    >
                                      <GripVertical className="h-3 w-3 text-muted-foreground/50 opacity-0 group-hover:opacity-100 shrink-0" />

                                      <span
                                        className={`text-xs truncate flex-1 ${
                                          task.status === "completed" ? "line-through text-muted-foreground" : ""
                                        }`}
                                      >
                                        {task.title}
                                      </span>

                                      <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4 shrink-0">
                                        {task.hours}h
                                      </Badge>

                                      {tag && (
                                        <div
                                          className="w-2 h-2 rounded-full shrink-0"
                                          style={{ backgroundColor: tag.color }}
                                          title={tag.name}
                                        />
                                      )}

                                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 shrink-0">
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-5 w-5"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            onStatusChange(task.id, task.status === "completed" ? "pending" : "completed");
                                          }}
                                        >
                                          {task.status === "completed" ? (
                                            <X className="h-3 w-3" />
                                          ) : (
                                            <Check className="h-3 w-3" />
                                          )}
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-5 w-5"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            onEdit(task);
                                          }}
                                        >
                                          <Pencil className="h-3 w-3" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-5 w-5 text-destructive"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setTaskToDelete(task);
                                            setShowDeleteDialog(true);
                                          }}
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            确定要删除任务「{taskToDelete?.title}」吗？此操作无法撤销。
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
