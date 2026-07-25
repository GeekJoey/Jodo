"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { ComponentType } from "react";
import { ArrowRight, Mail, ShieldCheck, Sparkles, SunMedium } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme-toggle";
import { createSupabaseBrowserClient } from "@/storage/database/supabase-browser";

type Mode = "login" | "signup";

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginSkeleton />}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data }) => {
      setLoading(false);
      if (data.user) {
        router.replace("/");
      }
    });
  }, [router]);

  useEffect(() => {
    const errorCode = searchParams.get("error_code");
    const errorDescription = searchParams.get("error_description");

    if (errorCode === "otp_expired") {
      setMessage("验证链接已过期，请重新注册或重新发送验证邮件。");
      return;
    }

    if (errorDescription) {
      setMessage(decodeURIComponent(errorDescription));
    }
  }, [searchParams]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      const supabase = createSupabaseBrowserClient();
      const payload = { email, password };

      const result =
        mode === "login"
          ? await supabase.auth.signInWithPassword(payload)
          : await supabase.auth.signUp({
              ...payload,
              options: {
                emailRedirectTo: `${window.location.origin}/login`,
              },
            });

      if (result.error) {
        setMessage(result.error.message);
        return;
      }

      if (mode === "signup" && !result.data.session) {
        setMessage("注册成功，请先检查邮箱完成验证，然后再登录。");
        setMode("login");
        return;
      }

      router.replace("/");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "登录失败");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoginSkeleton />;
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-transparent px-4 py-5 sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.04)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:linear-gradient(180deg,black,transparent_90%)]" />
      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col">
        <div className="mb-8 flex items-center justify-between rounded-full border border-border/70 bg-background/70 px-4 py-3 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Jodo</p>
              <p className="text-sm text-foreground/90">登录后只看见自己的任务、标签和日程</p>
            </div>
          </div>
          <ThemeToggle />
        </div>

        <div className="grid flex-1 items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-border/70 bg-background/70 px-4 py-2 text-sm text-muted-foreground backdrop-blur">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Supabase Auth
            </div>
            <h1 className="font-serif text-5xl leading-[1.05] tracking-tight text-foreground sm:text-6xl lg:text-7xl">
              先把今天安排好，
              <span className="block text-primary">再把注意力交给事情本身。</span>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
              用同一个账号登录后，你的任务、标签和日程会自动隔离。注册后先收邮件验证，再回来继续规划。
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <InfoTile icon={Mail} title="邮箱注册" description="支持新用户注册和老用户登录。" />
              <InfoTile icon={ShieldCheck} title="独立数据" description="每个账户只看见自己的内容。" />
              <InfoTile icon={SunMedium} title="主题切换" description="支持浅色、深色和系统模式。" />
            </div>
          </div>

          <Card className="border-border/70 bg-background/80 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur">
            <CardHeader className="space-y-3">
              <div className="inline-flex w-fit items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                <Mail className="h-3.5 w-3.5" />
                Supabase Auth
              </div>
              <CardTitle className="font-serif text-3xl">
                {mode === "login" ? "登录 Jodo" : "注册 Jodo"}
              </CardTitle>
              <CardDescription className="text-sm leading-6">
                登录后你只能看到自己的任务、标签和日程数据。
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="email">邮箱</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">密码</Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="至少 6 位"
                    minLength={6}
                    required
                  />
                </div>

                {message && (
                  <div className="rounded-2xl border border-border bg-secondary/40 px-3 py-2 text-sm text-foreground">
                    {message}
                  </div>
                )}

                <Button type="submit" className="w-full rounded-full" disabled={submitting}>
                  {submitting ? (
                    "处理中..."
                  ) : mode === "login" ? (
                    <>
                      <ArrowRight className="h-4 w-4 rotate-180" />
                      登录
                    </>
                  ) : (
                    <>
                      <ArrowRight className="h-4 w-4" />
                      注册
                    </>
                  )}
                </Button>
              </form>

              <Separator className="my-6" />

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {mode === "login" ? "还没有账号？" : "已经有账号？"}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  className="px-0 text-foreground hover:bg-transparent hover:underline"
                  onClick={() => setMode(mode === "login" ? "signup" : "login")}
                >
                  {mode === "login" ? "去注册" : "去登录"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function InfoTile({
  icon: Icon,
  title,
  description,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-3xl border border-border bg-background/70 p-4 backdrop-blur">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <div className="text-sm font-semibold text-foreground">{title}</div>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
    </div>
  );
}

function LoginSkeleton() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-border border-t-primary" />
    </div>
  );
}
