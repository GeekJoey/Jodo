"use client";

import Link from "next/link";
import { ArrowRight, CalendarDays, ShieldCheck, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function AuthShell() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(91,33,182,0.16),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(14,165,233,0.16),_transparent_26%),linear-gradient(180deg,_#f8fafc_0%,_#eff6ff_60%,_#ffffff_100%)]">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.04)_1px,transparent_1px)] bg-[size:44px_44px] [mask-image:linear-gradient(180deg,black,transparent_85%)]" />
      <div className="relative mx-auto flex min-h-screen max-w-6xl items-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid w-full gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:gap-10">
          <div className="flex flex-col justify-center">
            <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-slate-200/80 bg-white/80 px-4 py-2 text-sm text-slate-700 shadow-sm backdrop-blur">
              <Sparkles className="h-4 w-4 text-slate-900" />
              Jodo now uses Supabase Auth
            </div>
            <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
              让每个用户只看到自己的任务，登录后立即开始整理。
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
              用 Supabase 登录、注册和权限控制，把任务、标签和日程数据都隔离到每个用户自己的空间里。
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="rounded-full px-6">
                <Link href="/login">
                  去登录
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-full px-6"
              >
                <a href="https://supabase.com" target="_blank" rel="noreferrer">
                  查看 Supabase
                </a>
              </Button>
            </div>
          </div>

          <Card className="border-white/70 bg-white/80 shadow-2xl shadow-slate-300/40 backdrop-blur">
            <CardContent className="space-y-5 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">访问控制</p>
                  <h2 className="mt-1 text-xl font-semibold text-slate-950">
                    登录后访问你的数据
                  </h2>
                </div>
                <div className="rounded-2xl bg-slate-950 p-3 text-white">
                  <ShieldCheck className="h-6 w-6" />
                </div>
              </div>

              <div className="space-y-3">
                <FeatureRow
                  title="邮箱注册 / 登录"
                  description="支持新用户注册，也支持老用户直接登录。"
                />
                <FeatureRow
                  title="按用户隔离"
                  description="每条任务和标签都绑定 user_id，只能看自己的数据。"
                />
                <FeatureRow
                  title="可扩展为邀请制"
                  description="后续可以切换成邀请用户、管理员审批或团队协作。"
                />
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <CalendarDays className="h-4 w-4" />
                  数据范围
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  登录后只能看到自己的 tasks、tags 和后续新增的个人数据。未登录访问时不会加载任何任务内容。
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
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="text-sm font-semibold text-slate-950">{title}</div>
      <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
    </div>
  );
}
