"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { Clock, MoreVertical, Pencil, Trash2, Check, X, GripVertical } from "lucide-react";
import { Task, Tag, TimeSlot, TaskStatus } from "@/types";

interface TaskCardProps {
  task: Task;
  tag?: Tag;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onDragStart?: (e: React.DragEvent, task: Task) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  draggable?: boolean;
}

const timeSlotLabels: Record<TimeSlot, string> = {
  morning: "上午",
  afternoon: "下午",
  evening: "晚上",
};

export function TaskCard({
  task,
  tag,
  onEdit,
  onDelete,
  onStatusChange,
  onDragStart,
  onDragEnd,
  draggable = true,
}: TaskCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDelete = () => {
    onDelete(task.id);
    setShowDeleteDialog(false);
  };

  return (
    <>
      <Card
        className={`group relative transition-all hover:shadow-md cursor-grab active:cursor-grabbing ${
          task.status === "completed" ? "opacity-60" : ""
        }`}
        draggable={draggable}
        onDragStart={(e) => onDragStart?.(e, task)}
        onDragEnd={onDragEnd}
      >
        <CardContent className="p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-1.5 flex-1 min-w-0">
              <GripVertical className="h-4 w-4 text-muted-foreground/50 mt-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4
                    className={`font-medium text-sm truncate ${
                      task.status === "completed" ? "line-through text-muted-foreground" : ""
                    }`}
                  >
                    {task.title}
                  </h4>
                </div>

                {task.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                    {task.description}
                  </p>
                )}

                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary" className="text-xs">
                    <Clock className="h-3 w-3 mr-1" />
                    {task.hours}小时
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

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => e.stopPropagation()}>
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(task);
                    }}
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    编辑
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDeleteDialog(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    删除
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            确定要删除任务「{task.title}」吗？此操作无法撤销。
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
    </>
  );
}
