import { pgTable, serial, timestamp, varchar, text, integer, boolean, numeric, index } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"
import { createSchemaFactory } from "drizzle-zod"
import { z } from "zod"

// 健康检查表（系统表，不可删除）
export const healthCheck = pgTable("health_check", {
  id: serial().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

// 标签表
export const tags = pgTable(
  "tags",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    name: varchar("name", { length: 50 }).notNull(),
    color: varchar("color", { length: 20 }).notNull().default("#6366f1"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("tags_name_idx").on(table.name),
  ]
);

// 任务表
export const tasks = pgTable(
  "tasks",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    title: varchar("title", { length: 200 }).notNull(),
    description: text("description"),
    date: varchar("date", { length: 10 }), // 格式: YYYY-MM-DD，null 表示未分配
    timeSlot: varchar("time_slot", { length: 20 }), // morning, afternoon, evening，null 表示未分配
    hours: numeric("hours", { precision: 3, scale: 1 }).notNull().default("1"), // 预估小时数，支持0.5
    tagId: varchar("tag_id", { length: 36 }),
    status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, completed
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("tasks_date_idx").on(table.date),
    index("tasks_time_slot_idx").on(table.timeSlot),
    index("tasks_status_idx").on(table.status),
  ]
);

// 使用 createSchemaFactory 配置 date coercion
const { createInsertSchema: createCoercedInsertSchema } = createSchemaFactory({
  coerce: { date: true },
});

// 标签 Zod schemas
export const insertTagSchema = createCoercedInsertSchema(tags).pick({
  name: true,
  color: true,
});

export const updateTagSchema = createCoercedInsertSchema(tags)
  .pick({
    name: true,
    color: true,
  })
  .partial();

// 任务 Zod schemas
export const insertTaskSchema = createCoercedInsertSchema(tasks).pick({
  title: true,
  description: true,
  date: true,
  timeSlot: true,
  hours: true,
  tagId: true,
});

export const updateTaskSchema = createCoercedInsertSchema(tasks)
  .pick({
    title: true,
    description: true,
    date: true,
    timeSlot: true,
    hours: true,
    tagId: true,
    status: true,
  })
  .partial();

// TypeScript types
export type Tag = typeof tags.$inferSelect;
export type InsertTag = z.infer<typeof insertTagSchema>;
export type UpdateTag = z.infer<typeof updateTagSchema>;
export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type UpdateTask = z.infer<typeof updateTaskSchema>;

// 时间段类型
export type TimeSlot = "morning" | "afternoon" | "evening";

// 任务状态类型
export type TaskStatus = "pending" | "completed";
