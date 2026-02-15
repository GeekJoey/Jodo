import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/storage/database/supabase-client";
import { z } from "zod";

// 定义任务创建的 schema
const createTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  timeSlot: z.enum(["morning", "afternoon", "evening"]).optional().nullable(),
  hours: z.union([z.number(), z.string()]).transform(v => String(v)),
  tagId: z.string().optional().nullable(),
});

// GET /api/tasks - 获取任务列表
export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");
    const unassigned = searchParams.get("unassigned");

    let query = client.from("tasks").select("*");

    if (unassigned === "true") {
      // 获取未分配的任务（date 为 null）
      query = query.is("date", null);
    } else if (startDate && endDate) {
      // 获取日期范围内的任务（date 不为 null）
      query = query.not("date", "is", null).gte("date", startDate).lte("date", endDate);
    }

    const { data, error } = await query.order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 转换字段名为 camelCase
    const transformedData = (data || []).map((task: Record<string, unknown>) => ({
      ...task,
      timeSlot: task.time_slot,
      tagId: task.tag_id,
      createdAt: task.created_at,
      updatedAt: task.updated_at,
    }));

    return NextResponse.json({ data: transformedData });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

// POST /api/tasks - 创建任务
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();

    const validatedData = createTaskSchema.parse(body);

    // 转换字段名为 snake_case
    const dbData = {
      title: validatedData.title,
      description: validatedData.description || null,
      date: validatedData.date || null,
      time_slot: validatedData.timeSlot || null,
      hours: validatedData.hours,
      tag_id: validatedData.tagId || null,
      status: "pending",
    };

    const { data, error } = await client
      .from("tasks")
      .insert(dbData)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
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
    console.error("Error creating task:", error);
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    );
  }
}
