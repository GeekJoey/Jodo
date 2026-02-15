"use client";

import { useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Tag as TagIcon, Plus, Trash2 } from "lucide-react";

import { Tag } from "@/types";

interface TagManagerProps {
  tags: Tag[];
  onAdd: (tag: { name: string; color: string }) => void;
  onUpdate: (id: string, tag: Partial<Tag>) => void;
  onDelete: (id: string) => void;
}

const tagColors = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#14b8a6",
  "#3b82f6",
  "#6366f1",
  "#a855f7",
  "#ec4899",
  "#64748b",
];

export function TagManager({ tags, onAdd, onUpdate, onDelete }: TagManagerProps) {
  const [open, setOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [name, setName] = useState("");
  const [color, setColor] = useState(tagColors[5]);

  const handleOpen = (tag?: Tag) => {
    if (tag) {
      setEditingTag(tag);
      setName(tag.name);
      setColor(tag.color);
    } else {
      setEditingTag(null);
      setName("");
      setColor(tagColors[5]);
    }
    setOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTag) {
      onUpdate(editingTag.id, { name, color });
    } else {
      onAdd({ name, color });
    }
    setOpen(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <TagIcon className="h-4 w-4" />
          标签管理
        </h3>
        <Button variant="ghost" size="sm" onClick={() => handleOpen()}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <Badge
            key={tag.id}
            style={{ backgroundColor: tag.color, color: "#fff" }}
            className="cursor-pointer group relative pr-6"
            onClick={() => handleOpen(tag)}
          >
            {tag.name}
            <button
              className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(tag.id);
              }}
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        {tags.length === 0 && (
          <span className="text-xs text-muted-foreground">暂无标签，点击 + 创建</span>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[350px]">
          <DialogHeader>
            <DialogTitle>{editingTag ? "编辑标签" : "新建标签"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tagName">标签名称 *</Label>
              <Input
                id="tagName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="输入标签名称"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>标签颜色</Label>
              <div className="flex flex-wrap gap-2">
                {tagColors.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`w-8 h-8 rounded-full border-2 transition-transform ${
                      color === c ? "border-foreground scale-110" : "border-transparent"
                    }`}
                    style={{ backgroundColor: c }}
                    onClick={() => setColor(c)}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">预览:</span>
              <Badge style={{ backgroundColor: color, color: "#fff" }}>
                {name || "标签名称"}
              </Badge>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                取消
              </Button>
              <Button type="submit">保存</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
