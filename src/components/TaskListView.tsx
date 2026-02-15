"use client";

import { useState } from "react";
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
import { Clock, Pencil, Trash2, Plus, Check, X, GripVertical } from "lucide-react";
import { Task, Tag, TimeSlot, TaskStatus } from "@/types";

const timeSlotLabels: Record<TimeSlot, string> = {
  morning: "上午",
  afternoon: "下午",
  evening: "晚上",
};

interface TaskListViewProps {
  tasks: Task[];
  tags: Tag[];
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onAddTask: () => void;
  onDragStart: (e: React.DragEvent, task: Task) => void;
  onDragEnd: (e: React.DragEvent) => void;
}

export function TaskListView({
  tasks,
  tags,
  onEdit,
  onDelete,
  onStatusChange,
  onAddTask,
  onDragStart,
  onDragEnd,
}: TaskListViewProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

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

  // 按日期分组
  const groupedTasks = tasks.reduce((acc, task) => {
    if (!task.date) return acc;
    if (!acc[task.date]) {
      acc[task.date] = [];
    }
    acc[task.date].push(task);
    return acc;
  }, {} as Record<string, Task[]>);

  // 排序日期
  const sortedDates = Object.keys(groupedTasks).sort();

  return (
    <Card>
      <CardHeader className="pb-2 pt-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            所有任务
            <Badge variant="secondary" className="ml-2">
              {tasks.length}
            </Badge>
          </CardTitle>
          <Button variant="outline" size="sm" onClick={onAddTask}>
            <Plus className="h-4 w-4 mr-1" />
            添加任务
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        {sortedDates.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">暂无已分配的任务</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedDates.map((date) => (
              <div key={date}>
                <div className="flex items-center gap-2 mb-2 pb-1 border-b">
                  <span className="font-medium text-sm">
                    {new Date(date).toLocaleDateString("zh-CN", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      weekday: "long",
                    })}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {groupedTasks[date]
                      .filter((t) => t.status === "pending")
                      .reduce((sum, t) => sum + t.hours, 0)}
                    h
                  </Badge>
                </div>
                <div className="space-y-1">
                  {groupedTasks[date]
                    .sort((a, b) => {
                      const order = { morning: 0, afternoon: 1, evening: 2 };
                      return (order[a.timeSlot as TimeSlot] || 0) - (order[b.timeSlot as TimeSlot] || 0);
                    })
                    .map((task) => {
                      const tag = getTagById(task.tagId);
                      return (
                        <div
                          key={task.id}
                          draggable
                          onDragStart={(e) => onDragStart(e, task)}
                          onDragEnd={onDragEnd}
                          className={`group flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg cursor-grab active:cursor-grabbing hover:bg-muted transition-colors ${
                            task.status === "completed" ? "opacity-60" : ""
                          }`}
                        >
                          <GripVertical className="h-4 w-4 text-muted-foreground opacity-50 group-hover:opacity-100 shrink-0" />

                          <Badge variant="outline" className="text-xs shrink-0">
                            {timeSlotLabels[task.timeSlot as TimeSlot]}
                          </Badge>

                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span
                              className={`font-medium text-sm truncate ${
                                task.status === "completed" ? "line-through text-muted-foreground" : ""
                              }`}
                            >
                              {task.title}
                            </span>

                            <Badge variant="secondary" className="text-xs shrink-0">
                              <Clock className="h-3 w-3 mr-0.5" />
                              {task.hours}h
                            </Badge>

                            {tag && (
                              <Badge
                                style={{ backgroundColor: tag.color, color: "#fff" }}
                                className="text-xs shrink-0"
                              >
                                {tag.name}
                              </Badge>
                            )}
                          </div>

                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={(e) => {
                                e.stopPropagation();
                                onStatusChange(task.id, task.status === "completed" ? "pending" : "completed");
                              }}
                            >
                              {task.status === "completed" ? (
                                <X className="h-4 w-4" />
                              ) : (
                                <Check className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={(e) => {
                                e.stopPropagation();
                                onEdit(task);
                              }}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                setTaskToDelete(task);
                                setShowDeleteDialog(true);
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            ))}
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
