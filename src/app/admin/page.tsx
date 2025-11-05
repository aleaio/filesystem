"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { 
  Upload, 
  Download, 
  Trash2, 
  Plus, 
  Search, 
  File, 
  Folder, 
  HardDrive,
  LogOut,
  AlertCircle,
  Copy,
  Check,
  FileText,
  FolderOpen
} from "lucide-react"
import { formatFileSize } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { toast } from "sonner"

interface FileItem {
  id: string
  filename: string
  originalName: string
  size: number
  mimeType: string
  createdAt: string
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
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const router = useRouter()
  const { isAdmin, admin, logout, loading: authLoading } = useAuth()

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

  const filteredFiles = files.filter(file =>
    file.originalName.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
      
      // 为每个文件创建单独的上传请求
      const uploadPromises = Array.from(uploadForm.files).map(async (file) => {
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
      })

      const results = await Promise.allSettled(uploadPromises)
      
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
        fetchFiles()
      }
    } catch (error) {
      setError("网络错误，请重试")
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (fileId: string) => {
    if (!confirm("确定要删除这个文件吗？此操作不可恢复。")) {
      return
    }

    try {
      const token = localStorage.getItem("adminToken")
      const response = await fetch(`/api/files/${fileId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      })

      if (response.ok) {
        fetchFiles()
      } else {
        const data = await response.json()
        setError(data.error || "删除失败")
      }
    } catch (error) {
      setError("网络错误，请重试")
    }
  }

  const handleDownload = (fileId: string, filename: string) => {
    window.open(`/api/files/${fileId}/download`, "_blank")
  }

  const handleCopyLink = async (fileId: string, filename: string) => {
    const downloadUrl = `${window.location.origin}/api/files/${fileId}/download`
    
    try {
      await navigator.clipboard.writeText(downloadUrl)
      setCopiedId(fileId)
      toast.success(`下载链接已复制: ${filename}`)
      
      // 3秒后重置复制状态
      setTimeout(() => {
        setCopiedId(null)
      }, 3000)
    } catch (error) {
      // 如果现代API失败，使用传统方法
      const textArea = document.createElement('textarea')
      textArea.value = downloadUrl
      document.body.appendChild(textArea)
      textArea.select()
      
      try {
        document.execCommand('copy')
        setCopiedId(fileId)
        toast.success(`下载链接已复制: ${filename}`)
        
        setTimeout(() => {
          setCopiedId(null)
        }, 3000)
      } catch (err) {
        toast.error('复制失败，请手动复制链接')
      }
      
      document.body.removeChild(textArea)
    }
  }

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/")) return <File className="h-4 w-4 text-blue-500" />
    if (mimeType.includes("archive") || mimeType.includes("zip")) return <Folder className="h-4 w-4 text-yellow-500" />
    if (mimeType.includes("iso") || mimeType.includes("disk")) return <HardDrive className="h-4 w-4 text-purple-500" />
    return <File className="h-4 w-4 text-gray-500" />
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">文件共享 - 管理后台</h1>
              <p className="text-sm text-muted-foreground">文件管理和上传</p>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={() => router.push("/")}>
                返回首页
              </Button>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                退出登录
              </Button>
            </div>
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

        {/* Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center space-x-4">
            {/* 文件上传按钮 */}
            <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <FileText className="h-4 w-4 mr-2" />
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
                      {uploading ? "上传中..." : "上传"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            {/* 文件夹上传按钮 */}
            <Dialog open={folderUploadDialogOpen} onOpenChange={setFolderUploadDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <FolderOpen className="h-4 w-4 mr-2" />
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
                      webkitdirectory="directory"
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
                      {uploading ? "上传中..." : "上传"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="搜索文件..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Files Table */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">加载中...</p>
          </div>
        ) : filteredFiles.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Folder className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">暂无文件</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm ? "没有找到匹配的文件" : "还没有上传任何文件"}
              </p>
              <Button onClick={() => setUploadDialogOpen(true)}>
                <Upload className="h-4 w-4 mr-2" />
                上传第一个文件
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>文件列表 ({filteredFiles.length})</CardTitle>
              <CardDescription>
                管理所有上传的文件，支持下载和删除操作
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>文件名</TableHead>
                    <TableHead>大小</TableHead>
                    <TableHead>类型</TableHead>
                    <TableHead>上传时间</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFiles.map((file) => (
                    <TableRow key={file.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center space-x-2">
                          {getFileIcon(file.mimeType)}
                          <span className="max-w-[200px] truncate">
                            {file.originalName}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{formatFileSize(file.size)}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {file.mimeType.split("/")[1] || file.mimeType}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(file.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCopyLink(file.id, file.originalName)}
                            title="复制下载链接"
                          >
                            {copiedId === file.id ? (
                              <>
                                <Check className="h-4 w-4 text-green-500 mr-1" />
                                已复制
                              </>
                            ) : (
                              <>
                                <Copy className="h-4 w-4 mr-1" />
                                复制链接
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownload(file.id, file.originalName)}
                            title="下载文件"
                          >
                            <Download className="h-4 w-4 mr-1" />
                            下载
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(file.id)}
                            title="删除文件"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            删除
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}