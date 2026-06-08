"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  Upload,
  Search,
  HardDrive,
  LogOut,
  AlertCircle,
  FolderOpen,
  Files,
  Home,
  Clock,
  Loader2,
} from "lucide-react"
import { formatFileSize } from "@/lib/utils"
import { FileExplorer, type FileItem } from "@/components/file-explorer"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { toast } from "sonner"

type DirectoryInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  webkitdirectory?: string
}

export default function AdminPage() {
  const [files, setFiles] = useState<FileItem[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [error, setError] = useState("")
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [folderUploadDialogOpen, setFolderUploadDialogOpen] = useState(false)
  const [uploadForm, setUploadForm] = useState({
    files: [] as File[],
  })
  const router = useRouter()
  const { isAdmin, logout, loading: authLoading } = useAuth()
  const directoryInputProps: DirectoryInputProps = {
    webkitdirectory: "directory",
  }

  useEffect(() => {
    if (!authLoading) {
      checkAuth()
    }
  }, [authLoading, isAdmin])

  const checkAuth = () => {
    if (!isAdmin) {
      router.push("/login")
    } else {
      fetchFiles()
    }
  }

  const fetchFiles = async () => {
    try {
      const token = localStorage.getItem("adminToken")
      const response = await fetch("/api/files", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setFiles(data)
      } else if (response.status === 401) {
        logout()
        router.push("/login")
      }
    } catch (error) {
      console.error("获取文件列表失败:", error)
    } finally {
      setLoading(false)
    }
  }

  const totalSize = files.reduce((sum, file) => sum + file.size, 0)
  const latestUpload = files.length
    ? new Date(Math.max(...files.map(f => new Date(f.createdAt).getTime()))).toLocaleDateString()
    : "—"

  const handleUpload = async (e: React.FormEvent, isFolder: boolean = false) => {
    e.preventDefault()
    if (uploadForm.files.length === 0) {
      setError("请选择文件")
      return
    }

    setUploading(true)
    setError("")

    try {
      const token = localStorage.getItem("adminToken")

      const uploadFile = async (file: File) => {
        const formData = new FormData()
        formData.append("file", file)

        const response = await fetch("/api/files/upload", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`
          },
          body: formData
        })

        if (!response.ok) {
          throw new Error(`上传 ${file.name} 失败`)
        }

        return response.json()
      }

      const results: PromiseSettledResult<unknown>[] = []
      const concurrency = 3
      const selectedFiles = Array.from(uploadForm.files)

      for (let i = 0; i < selectedFiles.length; i += concurrency) {
        const chunk = selectedFiles.slice(i, i + concurrency)
        results.push(...await Promise.allSettled(chunk.map(uploadFile)))
      }

      // 检查上传结果
      const failed = results.filter(result => result.status === 'rejected')
      if (failed.length > 0) {
        setError(`${isFolder ? '文件夹' : '文件'}上传失败，失败数量: ${failed.length}`)
      } else {
        if (isFolder) {
          setFolderUploadDialogOpen(false)
        } else {
          setUploadDialogOpen(false)
        }
        setUploadForm({ files: [] })
        toast.success(`${isFolder ? '文件夹' : '文件'}上传成功`)
        fetchFiles()
      }
    } catch (error) {
      setError("网络错误，请重试")
    } finally {
      setUploading(false)
    }
  }

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  // 如果正在加载认证状态，显示加载页面
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  // 如果未登录，显示跳转提示
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">正在跳转到登录页面...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/20">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <Files className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold leading-tight tracking-tight">文件共享</h1>
                <Badge variant="secondary" className="font-normal">管理后台</Badge>
              </div>
              <p className="text-xs text-muted-foreground">文件管理和上传</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => router.push("/")}>
              <Home className="size-4" />
              <span className="hidden sm:inline">返回首页</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="size-4" />
              <span className="hidden sm:inline">退出登录</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Stats */}
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          {[
            { label: "文件总数", value: loading ? "—" : `${files.length}`, Icon: Files },
            { label: "总占用空间", value: loading ? "—" : formatFileSize(totalSize), Icon: HardDrive },
            { label: "最近更新", value: loading ? "—" : latestUpload, Icon: Clock },
          ].map((stat) => (
            <Card key={stat.label} className="py-0">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-lg border bg-muted/50">
                  <stat.Icon className="size-5 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="truncate text-2xl font-semibold tracking-tight tabular-nums">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Actions */}
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            {/* 文件上传按钮 */}
            <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Upload className="size-4" />
                  上传文件
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>上传文件</DialogTitle>
                  <DialogDescription>
                    选择要上传的文件，支持选择多个文件
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={(e) => handleUpload(e, false)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="file">选择文件</Label>
                    <Input
                      id="file"
                      type="file"
                      onChange={(e) => {
                        const files = e.target.files
                        if (files && files.length > 0) {
                          setUploadForm({
                            ...uploadForm,
                            files: Array.from(files)
                          })
                        }
                      }}
                      required
                      multiple
                    />
                    <p className="text-sm text-muted-foreground">
                      支持选择多个文件同时上传
                    </p>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setUploadDialogOpen(false)}
                    >
                      取消
                    </Button>
                    <Button type="submit" disabled={uploading}>
                      {uploading ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          上传中...
                        </>
                      ) : "上传"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            {/* 文件夹上传按钮 */}
            <Dialog open={folderUploadDialogOpen} onOpenChange={setFolderUploadDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <FolderOpen className="size-4" />
                  上传文件夹
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>上传文件夹</DialogTitle>
                  <DialogDescription>
                    选择要上传的文件夹，将自动上传文件夹中的所有文件
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={(e) => handleUpload(e, true)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="folder">选择文件夹</Label>
                    <Input
                      id="folder"
                      type="file"
                      onChange={(e) => {
                        const files = e.target.files
                        if (files && files.length > 0) {
                          setUploadForm({
                            ...uploadForm,
                            files: Array.from(files)
                          })
                        }
                      }}
                      required
                      {...directoryInputProps}
                    />
                    <p className="text-sm text-muted-foreground">
                      选择单个文件夹，将自动上传其中的所有文件和子文件夹
                    </p>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setFolderUploadDialogOpen(false)}
                    >
                      取消
                    </Button>
                    <Button type="submit" disabled={uploading}>
                      {uploading ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          上传中...
                        </>
                      ) : "上传"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="搜索文件..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Files */}
        {loading ? (
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-56" />
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="size-9 rounded-md" />
                  <Skeleton className="h-4 flex-1 max-w-[240px]" />
                  <Skeleton className="hidden h-4 w-16 sm:block" />
                  <Skeleton className="hidden h-6 w-16 rounded-full md:block" />
                  <Skeleton className="ml-auto h-8 w-56 rounded-md" />
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
              <p className="mb-4 text-sm text-muted-foreground">还没有上传任何文件</p>
              <Button onClick={() => setUploadDialogOpen(true)}>
                <Upload className="size-4" />
                上传第一个文件
              </Button>
            </CardContent>
          </Card>
        ) : (
          <FileExplorer files={files} searchTerm={searchTerm} showDate canManage onChanged={fetchFiles} />
        )}
      </main>
    </div>
  )
}
