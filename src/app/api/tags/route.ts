import { NextRequest, NextResponse } from "next/server";
import { requireSupabaseUser } from "@/storage/database/supabase-route";
import { insertTagSchema } from "@/storage/database/shared/schema";
import { z } from "zod";

// GET /api/tags - 获取所有标签
export async function GET(request: NextRequest) {
  try {
    const { supabase, user } = await requireSupabaseUser(request);
    if (!supabase || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("tags")
      .select("id,name,color,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Error fetching tags:", error);
    return NextResponse.json(
      { error: "Failed to fetch tags" },
      { status: 500 }
    );
  }
}

// POST /api/tags - 创建标签
export async function POST(request: NextRequest) {
  try {
    const { supabase, user } = await requireSupabaseUser(request);
    if (!supabase || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();

    const validatedData = insertTagSchema.parse(body);

    const { data, error } = await supabase
      .from("tags")
      .insert({ ...validatedData, user_id: user.id })
      .select("id,name,color,created_at")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error creating tag:", error);
    return NextResponse.json(
      { error: "Failed to create tag" },
      { status: 500 }
    );
  }
}
