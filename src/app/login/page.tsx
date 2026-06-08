"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ShieldCheck, ArrowLeft, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const { isAdmin, login, loading: authLoading } = useAuth()

  useEffect(() => {
    // 只有在认证状态加载完成且已登录时才跳转
    if (!authLoading && isAdmin) {
      router.push("/admin")
    }
  }, [isAdmin, authLoading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json()

      if (response.ok) {
        // 登录成功，保存token并跳转到管理页面
        login(data.token, data.admin)
        router.push("/admin")
      } else {
        setError(data.error || "登录失败")
      }
    } catch (error) {
      setError("网络错误，请重试")
    } finally {
      setLoading(false)
    }
  }

  // 如果正在加载认证状态，显示加载页面
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  // 如果已经登录，显示跳转提示
  if (isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">正在跳转到管理后台...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-muted/30 p-4">
      {/* 细微的背景网格，沿用单色风格 */}
      <div
        className="pointer-events-none absolute inset-0 [background-image:linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] [background-size:40px_40px] opacity-40 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]"
        aria-hidden
      />
      <div className="relative w-full max-w-md">
        <Card className="shadow-lg">
          <CardHeader className="items-center text-center">
            <div className="mb-2 flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <ShieldCheck className="size-6" />
            </div>
            <CardTitle className="text-2xl tracking-tight">管理员登录</CardTitle>
            <CardDescription>请输入您的管理员账号和密码</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">用户名</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoComplete="username"
                  placeholder="请输入用户名"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">密码</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="请输入密码"
                />
              </div>
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    登录中...
                  </>
                ) : (
                  "登录"
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="justify-center border-t">
            <Button
              variant="link"
              onClick={() => router.push("/")}
              className="text-sm text-muted-foreground"
            >
              <ArrowLeft className="size-4" />
              返回首页
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
