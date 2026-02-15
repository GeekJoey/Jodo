"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tag, TimeSlot, InsertTask, Task } from "@/types";

interface TaskFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task | null;
  tags: Tag[];
  defaultDate: string;
  defaultTimeSlot: TimeSlot;
  defaultUnassigned?: boolean;
  onSubmit: (data: InsertTask) => void;
}

const timeSlotOptions: { value: TimeSlot; label: string }[] = [
  { value: "morning", label: "上午" },
  { value: "afternoon", label: "下午" },
  { value: "evening", label: "晚上" },
];

const hourOptions = [0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 6, 7, 8];

// 特殊值表示"无标签"（空字符串不被 Select 组件允许）
const NO_TAG_VALUE = "__no_tag__";

export function TaskForm({
  open,
  onOpenChange,
  task,
  tags,
  defaultDate,
  defaultTimeSlot,
  defaultUnassigned = false,
  onSubmit,
}: TaskFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(defaultDate);
  const [timeSlot, setTimeSlot] = useState<TimeSlot>(defaultTimeSlot);
  const [hours, setHours] = useState<number>(1);
  const [tagId, setTagId] = useState<string>(NO_TAG_VALUE);
  const [unassigned, setUnassigned] = useState(defaultUnassigned);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || "");
      setDate(task.date || defaultDate);
      setTimeSlot(task.timeSlot || defaultTimeSlot);
      setHours(task.hours);
      setTagId(task.tagId || NO_TAG_VALUE);
      setUnassigned(task.date === null);
    } else {
      setTitle("");
      setDescription("");
      setDate(defaultDate);
      setTimeSlot(defaultTimeSlot);
      setHours(1);
      setTagId(NO_TAG_VALUE);
      setUnassigned(defaultUnassigned);
    }
  }, [task, defaultDate, defaultTimeSlot, defaultUnassigned, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      title,
      description: description || undefined,
      date: unassigned ? null : date,
      timeSlot: unassigned ? null : timeSlot,
      hours,
      tagId: tagId === NO_TAG_VALUE ? undefined : tagId,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{task ? "编辑任务" : "新建任务"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">任务标题 *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="输入任务标题"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">任务描述</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="输入任务描述（可选）"
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="unassigned"
              checked={unassigned}
              onCheckedChange={(checked) => setUnassigned(checked as boolean)}
            />
            <Label htmlFor="unassigned" className="text-sm cursor-pointer">
              添加到待办事项池（稍后分配日期）
            </Label>
          </div>

          {!unassigned && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">日期 *</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>时间段 *</Label>
                <Select value={timeSlot} onValueChange={(v) => setTimeSlot(v as TimeSlot)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlotOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>预估时长 *</Label>
              <Select
                value={hours.toString()}
                onValueChange={(v) => setHours(parseFloat(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {hourOptions.map((h) => (
                    <SelectItem key={h} value={h.toString()}>
                      {h} 小时
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>标签</Label>
              <Select value={tagId} onValueChange={setTagId}>
                <SelectTrigger>
                  <SelectValue placeholder="选择标签" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_TAG_VALUE}>无标签</SelectItem>
                  {tags.map((tag) => (
                    <SelectItem key={tag.id} value={tag.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: tag.color }}
                        />
                        {tag.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button type="submit">保存</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
