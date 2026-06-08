"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Search, FolderOpen, Files, LogIn, LayoutDashboard, LogOut } from "lucide-react"
import { formatFileSize } from "@/lib/utils"
import { FileExplorer, type FileItem } from "@/components/file-explorer"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"

export default function Home() {
  const [files, setFiles] = useState<FileItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const { isAdmin, loading: authLoading, logout } = useAuth()
  const router = useRouter()

  useEffect(() => {
    fetchFiles()
  }, [])

  const fetchFiles = async () => {
    try {
      const response = await fetch("/api/files")
      if (response.ok) {
        const data = await response.json()
        setFiles(data)
      }
    } catch (error) {
      console.error("获取文件列表失败:", error)
    } finally {
      setLoading(false)
    }
  }

  const totalSize = files.reduce((sum, file) => sum + file.size, 0)

  const handleAdminAction = () => {
    if (isAdmin) {
      router.push("/admin")
    } else {
      router.push("/login")
    }
  }

  const handleLogout = () => {
    logout()
    // 退出后刷新页面，按钮状态会自动更新
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <Files className="size-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold leading-tight tracking-tight">文件共享</h1>
              <p className="text-xs text-muted-foreground">浏览并下载共享文件</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin ? (
              <>
                <Button variant="outline" size="sm" onClick={handleAdminAction}>
                  <LayoutDashboard className="size-4" />
                  管理后台
                </Button>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="size-4" />
                  退出登录
                </Button>
              </>
            ) : (
              <Button variant="outline" size="sm" onClick={handleAdminAction}>
                <LogIn className="size-4" />
                管理员登录
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Toolbar */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="搜索文件..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          {!loading && files.length > 0 && (
            <p className="text-sm text-muted-foreground">
              共 <span className="font-medium text-foreground">{files.length}</span> 个文件
              <span className="mx-2 text-border">·</span>
              {formatFileSize(totalSize)}
            </p>
          )}
        </div>

        {/* Files */}
        {loading ? (
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="size-9 rounded-md" />
                  <Skeleton className="h-4 flex-1 max-w-[240px]" />
                  <Skeleton className="hidden h-4 w-16 sm:block" />
                  <Skeleton className="hidden h-6 w-16 rounded-full md:block" />
                  <Skeleton className="ml-auto h-8 w-44 rounded-md" />
                </div>
              ))}
            </CardContent>
          </Card>
        ) : files.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
                <FolderOpen className="size-8 text-muted-foreground" />
              </div>
              <h3 className="mb-1 text-lg font-medium">暂无文件</h3>
              <p className="text-sm text-muted-foreground">管理员还没有上传任何文件</p>
            </CardContent>
          </Card>
        ) : (
          <FileExplorer files={files} searchTerm={searchTerm} showDate={isAdmin} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t">
        <div className="container mx-auto flex flex-col items-center justify-between gap-2 px-4 py-6 text-sm text-muted-foreground sm:flex-row">
          <div className="flex items-center gap-2">
            <Files className="size-4" />
            <span>文件共享系统</span>
          </div>
          <p>© {new Date().getFullYear()} 文件共享系统 · 安全便捷的文件分享</p>
        </div>
      </footer>
    </div>
  )
}
