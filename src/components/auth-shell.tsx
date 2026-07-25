"use client";

import type { ComponentType } from "react";
import Link from "next/link";
import { ArrowRight, CalendarDays, ShieldCheck, Sparkles, Tag, CalendarRange, ListTodo } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";

export function AuthShell() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-transparent">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.04)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:linear-gradient(180deg,black,transparent_90%)]" />
      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-5 sm:px-6 lg:px-8">
        <div className="mb-10 flex items-center justify-between rounded-full border border-border/70 bg-background/70 px-4 py-3 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-medium tracking-wide text-muted-foreground">Jodo</p>
              <p className="text-sm text-foreground/90">个人任务、标签和日程的私密工作台</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button asChild variant="outline" className="rounded-full">
              <Link href="/login">登录 / 注册</Link>
            </Button>
          </div>
        </div>

        <div className="grid flex-1 items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-border/70 bg-background/70 px-4 py-2 text-sm text-muted-foreground backdrop-blur">
              <Sparkles className="h-4 w-4 text-primary" />
              专注、安静、可拖拽的日程工作台
            </div>
            <h1 className="max-w-3xl font-serif text-5xl leading-[1.05] tracking-tight text-foreground sm:text-6xl lg:text-7xl">
              让每一天的计划，看起来
              <span className="block text-primary">更清楚，也更安静。</span>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
              Jodo 把任务、标签和日程放进同一个私密空间。登录后，你只会看到自己的内容，拖拽、分配、完成，一切都围绕今天展开。
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="rounded-full px-6 shadow-sm">
                <Link href="/login">
                  去登录
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full px-6">
                <a href="https://supabase.com" target="_blank" rel="noreferrer">
                  查看 Supabase
                </a>
              </Button>
            </div>
          </div>

          <Card className="border-border/70 bg-background/80 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur">
            <CardContent className="space-y-5 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">访问控制</p>
                  <h2 className="mt-1 font-serif text-2xl text-foreground">
                    登录后访问你的数据
                  </h2>
                </div>
                <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                  <ShieldCheck className="h-6 w-6" />
                </div>
              </div>

              <div className="grid gap-3">
                <FeatureRow
                  icon={CalendarRange}
                  title="日程优先"
                  description="中央日历是主界面，任务通过拖拽进入上午、下午、晚上。"
                />
                <FeatureRow
                  icon={ListTodo}
                  title="任务池"
                  description="未分配任务放在左侧，随时整理、拖拽和重排。"
                />
                <FeatureRow
                  icon={Tag}
                  title="标签分类"
                  description="标签以轻量色块呈现，方便你快速筛选当前关注点。"
                />
              </div>

              <div className="rounded-3xl border border-border bg-secondary/40 p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <CalendarDays className="h-4 w-4 text-primary" />
                  数据范围
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  登录后只会看到自己的 tasks、tags 和日程内容。未登录访问时不会加载任何任务数据。
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function FeatureRow({
  icon: Icon,
  title,
  description,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-3 rounded-2xl border border-border bg-background/70 p-4">
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <div className="text-sm font-semibold text-foreground">{title}</div>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
