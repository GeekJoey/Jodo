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
import { AlertTriangle, Pencil, Trash2, GripVertical, Plus, Inbox, ChevronDown, ChevronRight } from "lucide-react";
import { Task, Tag, TaskPriority } from "@/types";

interface TaskPoolProps {
  tasks: Task[];
  tags: Tag[];
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onDragStart: (e: React.DragEvent, task: Task) => void;
  onDragEnd: (e: React.DragEvent) => void;
  onAddTask: (priority: TaskPriority) => void;
  onDropToPool?: (taskId: string, priority?: TaskPriority) => void;
}

export function TaskPool({ tasks, tags, onEdit, onDelete, onDragStart, onDragEnd, onAddTask, onDropToPool }: TaskPoolProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [expandedUrgent, setExpandedUrgent] = useState(true);
  const [expandedNormal, setExpandedNormal] = useState(true);

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

  const handleDrop = (e: React.DragEvent, targetPriority?: TaskPriority) => {
    e.preventDefault();
    setIsDragOver(false);
    try {
      const data = JSON.parse(e.dataTransfer.getData("application/json"));
      if (data.taskId && onDropToPool) {
        onDropToPool(data.taskId, targetPriority);
      }
    } catch (err) {
      console.error("Failed to parse drop data:", err);
    }
  };

  // 按优先级分组
  const urgentTasks = tasks.filter((t) => t.priority === "urgent");
  const normalTasks = tasks.filter((t) => t.priority !== "urgent");

  const renderTaskItem = (task: Task) => {
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
  };

  return (
    <Card
      className={`mb-6 transition-colors ${isDragOver ? "ring-2 ring-primary bg-primary/5" : ""}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={(e) => handleDrop(e)}
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
        </div>
        <p className="text-xs text-muted-foreground hidden md:block">
          拖拽任务到此区域移回待办，或从待办拖拽到日历进行分配
        </p>
      </CardHeader>
      <CardContent className="pt-1 space-y-3">
        {tasks.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground border-2 border-dashed border-muted-foreground/20 rounded-lg">
            <Inbox className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">暂无待办事项</p>
            <p className="text-xs mt-1">拖拽已分配任务到此处移回待办</p>
          </div>
        ) : (
          <>
            {/* 紧急区域 */}
            <div
              className="border border-red-200 dark:border-red-900/50 rounded-lg overflow-hidden"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, "urgent")}
            >
              <div
                className="flex items-center justify-between px-3 py-2 bg-red-50 dark:bg-red-950/30 cursor-pointer"
                onClick={() => setExpandedUrgent(!expandedUrgent)}
              >
                <div className="flex items-center gap-2">
                  {expandedUrgent ? (
                    <ChevronDown className="h-4 w-4 text-red-600" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-red-600" />
                  )}
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span className="font-medium text-sm text-red-700 dark:text-red-400">紧急</span>
                  <Badge variant="destructive" className="text-xs h-5">
                    {urgentTasks.length}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddTask("urgent");
                  }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {expandedUrgent && (
                <div className="p-2 space-y-1.5 min-h-[40px]">
                  {urgentTasks.length === 0 ? (
                    <div className="text-xs text-muted-foreground text-center py-2">
                      暂无紧急任务
                    </div>
                  ) : (
                    urgentTasks.map(renderTaskItem)
                  )}
                </div>
              )}
            </div>

            {/* 普通区域 */}
            <div
              className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, "normal")}
            >
              <div
                className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-900/30 cursor-pointer"
                onClick={() => setExpandedNormal(!expandedNormal)}
              >
                <div className="flex items-center gap-2">
                  {expandedNormal ? (
                    <ChevronDown className="h-4 w-4 text-gray-600" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-gray-600" />
                  )}
                  <Inbox className="h-4 w-4 text-gray-600" />
                  <span className="font-medium text-sm text-gray-700 dark:text-gray-400">普通</span>
                  <Badge variant="secondary" className="text-xs h-5">
                    {normalTasks.length}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddTask("normal");
                  }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {expandedNormal && (
                <div className="p-2 space-y-1.5 min-h-[40px]">
                  {normalTasks.length === 0 ? (
                    <div className="text-xs text-muted-foreground text-center py-2">
                      暂无普通任务
                    </div>
                  ) : (
                    normalTasks.map(renderTaskItem)
                  )}
                </div>
              )}
            </div>
          </>
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
