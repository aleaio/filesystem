"use client"

import { Fragment, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Download,
  File,
  FileImage,
  FileVideo,
  FileAudio,
  FileText,
  FileArchive,
  HardDrive,
  Folder,
  FolderOpen,
  ChevronRight,
  Copy,
  Check,
  Trash2,
  FileArchive as ZipIcon,
} from "lucide-react"
import { cn, formatFileSize, listDirectory } from "@/lib/utils"
import { toast } from "sonner"

export interface FileItem {
  id: string
  filename: string
  originalName: string
  size: number
  mimeType: string
  createdAt: string
}

const getFileVisual = (mimeType: string) => {
  if (mimeType.startsWith("image/")) return { Icon: FileImage, color: "text-blue-500" }
  if (mimeType.startsWith("video/")) return { Icon: FileVideo, color: "text-rose-500" }
  if (mimeType.startsWith("audio/")) return { Icon: FileAudio, color: "text-amber-500" }
  if (mimeType.includes("pdf")) return { Icon: FileText, color: "text-red-500" }
  if (
    mimeType.includes("zip") ||
    mimeType.includes("archive") ||
    mimeType.includes("compressed") ||
    mimeType.includes("tar") ||
    mimeType.includes("rar")
  )
    return { Icon: FileArchive, color: "text-yellow-600" }
  if (mimeType.includes("iso") || mimeType.includes("disk")) return { Icon: HardDrive, color: "text-purple-500" }
  if (mimeType.includes("text") || mimeType.includes("json") || mimeType.includes("xml"))
    return { Icon: FileText, color: "text-slate-500" }
  return { Icon: File, color: "text-muted-foreground" }
}

interface FileExplorerProps {
  files: FileItem[]
  searchTerm?: string
  /** 是否显示「上传时间」列 */
  showDate?: boolean
  /** 是否可删除文件（管理后台） */
  canManage?: boolean
  /** 删除等变更后回调，便于父级刷新列表 */
  onChanged?: () => void
}

export function FileExplorer({
  files,
  searchTerm = "",
  showDate = false,
  canManage = false,
  onChanged,
}: FileExplorerProps) {
  const [currentPath, setCurrentPath] = useState<string[]>([])
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const isSearching = searchTerm.trim().length > 0
  const term = searchTerm.trim().toLowerCase()
  const searchResults = isSearching
    ? files.filter((f) => f.originalName.toLowerCase().includes(term))
    : []
  const listing = listDirectory(files, currentPath)
  const prefix = currentPath.length ? currentPath.join("/") + "/" : ""
  const colCount = 3 + (showDate ? 1 : 0) + 1

  const handleDownload = (fileId: string) => {
    window.open(`/api/files/${fileId}/download`, "_blank")
  }

  const handleDownloadFolder = (folderPath: string) => {
    window.open(`/api/files/folder/download?path=${encodeURIComponent(folderPath)}`, "_blank")
  }

  const handleCopyLink = async (fileId: string, label: string) => {
    const downloadUrl = `${window.location.origin}/api/files/${fileId}/download`
    try {
      await navigator.clipboard.writeText(downloadUrl)
      setCopiedId(fileId)
      toast.success(`下载链接已复制: ${label}`)
      setTimeout(() => setCopiedId(null), 3000)
    } catch (error) {
      const textArea = document.createElement("textarea")
      textArea.value = downloadUrl
      document.body.appendChild(textArea)
      textArea.select()
      try {
        document.execCommand("copy")
        setCopiedId(fileId)
        toast.success(`下载链接已复制: ${label}`)
        setTimeout(() => setCopiedId(null), 3000)
      } catch (err) {
        toast.error("复制失败，请手动复制链接")
      }
      document.body.removeChild(textArea)
    }
  }

  const handleDelete = async (fileId: string) => {
    if (!confirm("确定要删除这个文件吗？此操作不可恢复。")) return
    try {
      const token = localStorage.getItem("adminToken")
      const response = await fetch(`/api/files/${fileId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        toast.success("文件已删除")
        onChanged?.()
      } else {
        const data = await response.json().catch(() => ({}))
        toast.error(data.error || "删除失败")
      }
    } catch (error) {
      toast.error("网络错误，请重试")
    }
  }

  const renderFileRow = (file: FileItem, displayName: string, indent = false) => {
    const { Icon, color } = getFileVisual(file.mimeType)
    return (
      <TableRow key={file.id} className="transition-colors">
        <TableCell className={cn("pl-6 font-medium", indent && "pl-14")}>
          <div className="flex items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-md border bg-muted/50">
              <Icon className={cn("size-4", color)} />
            </div>
            <span className="max-w-[260px] truncate" title={displayName}>
              {displayName}
            </span>
          </div>
        </TableCell>
        <TableCell className="text-muted-foreground tabular-nums">{formatFileSize(file.size)}</TableCell>
        <TableCell>
          <Badge variant="secondary" className="font-normal">
            {file.mimeType.split("/")[1] || file.mimeType || "文件"}
          </Badge>
        </TableCell>
        {showDate && (
          <TableCell className="text-muted-foreground tabular-nums">
            {new Date(file.createdAt).toLocaleDateString()}
          </TableCell>
        )}
        <TableCell className="pr-6 text-right">
          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              variant="outline"
              className="min-w-28"
              onClick={() => handleCopyLink(file.id, displayName)}
              title="复制下载链接"
            >
              {copiedId === file.id ? (
                <>
                  <Check className="size-4 text-green-500" />
                  已复制
                </>
              ) : (
                <>
                  <Copy className="size-4" />
                  复制链接
                </>
              )}
            </Button>
            <Button size="sm" variant={canManage ? "outline" : "default"} onClick={() => handleDownload(file.id)} title="下载文件">
              <Download className="size-4" />
              下载
            </Button>
            {canManage && (
              <Button size="sm" variant="destructive" onClick={() => handleDelete(file.id)} title="删除文件">
                <Trash2 className="size-4" />
                删除
              </Button>
            )}
          </div>
        </TableCell>
      </TableRow>
    )
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        {isSearching ? (
          <>
            <CardTitle>搜索结果</CardTitle>
            <p className="text-sm text-muted-foreground">
              “{searchTerm}” · {searchResults.length} 个匹配
            </p>
          </>
        ) : (
          <nav className="flex flex-wrap items-center gap-0.5 text-sm">
            <button
              type="button"
              onClick={() => setCurrentPath([])}
              className={cn(
                "inline-flex items-center gap-1.5 rounded px-1.5 py-1 transition-colors hover:bg-muted",
                currentPath.length === 0 ? "font-medium text-foreground" : "text-muted-foreground"
              )}
            >
              <HardDrive className="size-4" />
              全部文件
            </button>
            {currentPath.map((seg, i) => (
              <Fragment key={i}>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground/60" />
                <button
                  type="button"
                  onClick={() => setCurrentPath(currentPath.slice(0, i + 1))}
                  className={cn(
                    "max-w-[200px] truncate rounded px-1.5 py-1 transition-colors hover:bg-muted",
                    i === currentPath.length - 1 ? "font-medium text-foreground" : "text-muted-foreground"
                  )}
                  title={seg}
                >
                  {seg}
                </button>
              </Fragment>
            ))}
          </nav>
        )}
      </CardHeader>
      <CardContent className="px-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-6">名称</TableHead>
              <TableHead>大小</TableHead>
              <TableHead>类型</TableHead>
              {showDate && <TableHead>上传时间</TableHead>}
              <TableHead className="pr-6 text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isSearching ? (
              searchResults.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={colCount} className="h-24 text-center text-muted-foreground">
                    没有找到匹配的文件
                  </TableCell>
                </TableRow>
              ) : (
                searchResults.map((file) => renderFileRow(file, file.originalName))
              )
            ) : listing.folders.length === 0 && listing.files.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={colCount} className="h-24 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <FolderOpen className="size-8" />
                    <span>该文件夹为空</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              <>
                {listing.folders.map((folder) => (
                  <TableRow
                    key={`dir-${folder.path}`}
                    className="cursor-pointer transition-colors"
                    onClick={() => setCurrentPath(folder.path.split("/"))}
                  >
                    <TableCell className="pl-6 font-medium">
                      <div className="flex items-center gap-3">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-md border bg-muted/50">
                          <Folder className="size-4 text-yellow-600" />
                        </div>
                        <span className="max-w-[260px] truncate" title={folder.name}>
                          {folder.name}
                        </span>
                        <ChevronRight className="size-4 shrink-0 text-muted-foreground/50" />
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground tabular-nums">{formatFileSize(folder.size)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-normal">
                        文件夹 · {folder.count}
                      </Badge>
                    </TableCell>
                    {showDate && <TableCell />}
                    <TableCell className="pr-6 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDownloadFolder(folder.path)
                          }}
                          title="打包下载该文件夹"
                        >
                          <ZipIcon className="size-4" />
                          下载 ZIP
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {listing.files.map((file) => renderFileRow(file, file.originalName.slice(prefix.length)))}
              </>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
