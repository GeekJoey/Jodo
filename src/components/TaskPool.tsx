"use client";

import { useState, useEffect } from "react";
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
import { Clock, Pencil, Trash2, GripVertical, Plus, Inbox } from "lucide-react";
import { Task, Tag } from "@/types";

interface TaskPoolProps {
  tasks: Task[];
  tags: Tag[];
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onDragStart: (e: React.DragEvent, task: Task) => void;
  onDragEnd: (e: React.DragEvent) => void;
  onAddTask: () => void;
  onDropToPool?: (taskId: string) => void;
}

export function TaskPool({ tasks, tags, onEdit, onDelete, onDragStart, onDragEnd, onAddTask, onDropToPool }: TaskPoolProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    try {
      const data = JSON.parse(e.dataTransfer.getData("application/json"));
      if (data.taskId && onDropToPool) {
        onDropToPool(data.taskId);
      }
    } catch (err) {
      console.error("Failed to parse drop data:", err);
    }
  };

  return (
    <Card
      className={`mb-6 transition-colors ${isDragOver ? "ring-2 ring-primary bg-primary/5" : ""}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <CardHeader className="pb-2 pt-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Inbox className="h-5 w-5" />
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
        <p className="text-xs text-muted-foreground hidden md:block">
          拖拽任务到此区域移回待办，或从待办拖拽到日历进行分配
        </p>
      </CardHeader>
      <CardContent className="pt-1">
        {tasks.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground border-2 border-dashed border-muted-foreground/20 rounded-lg">
            <Inbox className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">暂无待办事项</p>
            <p className="text-xs mt-1">拖拽已分配任务到此处移回待办</p>
          </div>
        ) : (
          <div className={`flex ${isMobile ? "flex-col" : "flex-wrap"} gap-1.5`}>
            {tasks.map((task) => {
              const tag = getTagById(task.tagId);
              return (
                <div
                  key={task.id}
                  draggable={!isMobile}
                  onDragStart={(e) => !isMobile && onDragStart(e, task)}
                  onDragEnd={onDragEnd}
                  className={`group flex items-center gap-2 px-2.5 py-1.5 bg-muted/50 rounded-md transition-colors border border-transparent hover:border-border ${
                    isMobile ? "" : "cursor-grab active:cursor-grabbing hover:bg-muted"
                  }`}
                >
                  {!isMobile && (
                    <GripVertical className="h-3.5 w-3.5 text-muted-foreground opacity-50 group-hover:opacity-100" />
                  )}

                  <span className="font-medium text-sm truncate max-w-[200px]">{task.title}</span>

                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 shrink-0">
                    {task.hours}h
                  </Badge>

                  {tag && (
                    <Badge
                      style={{ backgroundColor: tag.color, color: "#fff" }}
                      className="text-[10px] px-1.5 py-0 h-4 shrink-0"
                    >
                      {tag.name}
                    </Badge>
                  )}

                  <div className={`flex items-center gap-0.5 ml-auto ${isMobile ? "opacity-100" : "opacity-0 group-hover:opacity-100"} transition-opacity`}>
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
