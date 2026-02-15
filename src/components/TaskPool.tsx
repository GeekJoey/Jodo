"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Clock, MoreVertical, Pencil, Trash2, GripVertical, Plus } from "lucide-react";
import { Task, Tag, TimeSlot, TaskStatus } from "@/types";

interface TaskPoolProps {
  tasks: Task[];
  tags: Tag[];
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onDragStart: (e: React.DragEvent, task: Task) => void;
  onDragEnd: (e: React.DragEvent) => void;
  onAddTask: () => void;
}

export function TaskPool({ tasks, tags, onEdit, onDelete, onDragStart, onDragEnd, onAddTask }: TaskPoolProps) {
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

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            待办事项池
            <Badge variant="secondary" className="ml-2">
              {tasks.length}
            </Badge>
          </CardTitle>
          <Button variant="outline" size="sm" onClick={onAddTask}>
            <Plus className="h-4 w-4 mr-1" />
            添加待办
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          拖拽任务到下方日历的日期和时段进行分配
        </p>
      </CardHeader>
      <CardContent>
        {tasks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">暂无待办事项</p>
            <p className="text-xs mt-1">点击上方「添加待办」创建新任务</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {tasks.map((task) => {
              const tag = getTagById(task.tagId);
              return (
                <div
                  key={task.id}
                  draggable
                  onDragStart={(e) => onDragStart(e, task)}
                  onDragEnd={onDragEnd}
                  className="group flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg cursor-grab active:cursor-grabbing hover:bg-muted transition-colors border border-transparent hover:border-border"
                >
                  <GripVertical className="h-4 w-4 text-muted-foreground opacity-50 group-hover:opacity-100" />
                  
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="font-medium text-sm truncate">{task.title}</span>
                    
                    <Badge variant="outline" className="text-xs shrink-0">
                      <Clock className="h-3 w-3 mr-1" />
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

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
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
                      className="h-6 w-6 text-destructive"
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
            确定要删除待办「{taskToDelete?.title}」吗？此操作无法撤销。
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
