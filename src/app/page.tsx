"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download, Search, File, Folder, HardDrive, Copy, Check } from "lucide-react"
import { formatFileSize } from "@/lib/utils"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface FileItem {
  id: string
  filename: string
  originalName: string
  size: number
  mimeType: string
  createdAt: string
}

export default function Home() {
  const [files, setFiles] = useState<FileItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const { isAdmin, admin, loading: authLoading, logout } = useAuth()
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

  const filteredFiles = files.filter(file =>
    file.originalName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/")) return <File className="h-4 w-4 text-blue-500" />
    if (mimeType.includes("archive") || mimeType.includes("zip")) return <Folder className="h-4 w-4 text-yellow-500" />
    if (mimeType.includes("iso") || mimeType.includes("disk")) return <HardDrive className="h-4 w-4 text-purple-500" />
    return <File className="h-4 w-4 text-gray-500" />
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
      <header className="border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">文件共享</h1>
            </div>
            <div className="flex items-center space-x-2">
              {isAdmin ? (
                <>
                  <Button variant="outline" onClick={handleAdminAction}>
                    管理后台
                  </Button>
                  <Button variant="outline" onClick={handleLogout}>
                    退出登录
                  </Button>
                </>
              ) : (
                <Button variant="outline" onClick={handleAdminAction}>
                  管理员登录
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Search Bar */}
        <div className="mb-8">
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
              <p className="text-muted-foreground">
                {searchTerm ? "没有找到匹配的文件" : "管理员还没有上传任何文件"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>文件列表 ({filteredFiles.length})</CardTitle>
              <CardDescription>
                浏览和下载可用文件
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>文件名</TableHead>
                    <TableHead>大小</TableHead>
                    <TableHead>类型</TableHead>
                    {isAdmin && <TableHead>上传时间</TableHead>}
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
                        <span className="px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-xs">
                          {file.mimeType.split("/")[1] || file.mimeType}
                        </span>
                      </TableCell>
                      <TableCell>
                        {isAdmin && new Date(file.createdAt).toLocaleDateString()}
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

      {/* Footer */}
      <footer className="border-t mt-12">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center text-sm text-muted-foreground">
            {/* 空的footer，保留结构 */}
          </div>
        </div>
      </footer>
    </div>
  )
}