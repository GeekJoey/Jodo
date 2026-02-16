import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/storage/database/supabase-client";
import { z } from "zod";

// 定义任务更新的 schema
const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional().nullable(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  timeSlot: z.enum(["morning", "afternoon", "evening"]).optional().nullable(),
  hours: z.union([z.number(), z.string()]).transform(v => String(v)).optional(),
  tagId: z.string().optional().nullable(),
  priority: z.enum(["urgent", "normal"]).optional(),
  status: z.enum(["pending", "completed"]).optional(),
});

// GET /api/tasks/[id] - 获取单个任务
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const client = getSupabaseClient();
    const { id } = await params;

    const { data, error } = await client
      .from("tasks")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // 转换字段名为 camelCase
    const transformedData = {
      ...data,
      timeSlot: (data as Record<string, unknown>).time_slot,
      tagId: (data as Record<string, unknown>).tag_id,
      createdAt: (data as Record<string, unknown>).created_at,
      updatedAt: (data as Record<string, unknown>).updated_at,
    };

    return NextResponse.json({ data: transformedData });
  } catch (error) {
    console.error("Error fetching task:", error);
    return NextResponse.json(
      { error: "Failed to fetch task" },
      { status: 500 }
    );
  }
}

// PUT /api/tasks/[id] - 更新任务
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const client = getSupabaseClient();
    const { id } = await params;
    const body = await request.json();

    const validatedData = updateTaskSchema.parse(body);

    // 构建 snake_case 更新对象
    const dbData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (validatedData.title !== undefined) dbData.title = validatedData.title;
    if (validatedData.description !== undefined) dbData.description = validatedData.description;
    if (validatedData.date !== undefined) dbData.date = validatedData.date;
    if (validatedData.timeSlot !== undefined) dbData.time_slot = validatedData.timeSlot;
    if (validatedData.hours !== undefined) dbData.hours = validatedData.hours;
    if (validatedData.tagId !== undefined) dbData.tag_id = validatedData.tagId;
    if (validatedData.priority !== undefined) dbData.priority = validatedData.priority;
    if (validatedData.status !== undefined) dbData.status = validatedData.status;

    const { data, error } = await client
      .from("tasks")
      .update(dbData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // 转换返回数据为 camelCase
    const transformedData = {
      ...data,
      timeSlot: (data as Record<string, unknown>).time_slot,
      tagId: (data as Record<string, unknown>).tag_id,
      createdAt: (data as Record<string, unknown>).created_at,
      updatedAt: (data as Record<string, unknown>).updated_at,
    };

    return NextResponse.json({ data: transformedData });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error updating task:", error);
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 }
    );
  }
}

// DELETE /api/tasks/[id] - 删除任务
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const client = getSupabaseClient();
    const { id } = await params;

    const { error } = await client.from("tasks").delete().eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting task:", error);
    return NextResponse.json(
      { error: "Failed to delete task" },
      { status: 500 }
    );
  }
}
