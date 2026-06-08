import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes"

  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

// 当前目录下的子文件夹（聚合了其内全部文件，递归统计）
export interface DirFolder {
  name: string // 该层目录名，如 "证书"
  path: string // 从根到此目录的完整路径，如 "证书" 或 "证书/子目录"
  count: number // 目录内文件总数（递归）
  size: number // 目录内文件总大小（递归）
}

export interface DirListing<T> {
  folders: DirFolder[]
  files: T[] // 直接位于当前目录下的文件
}

/**
 * 像资源管理器那样，列出某个路径下的内容。
 * 文件的 originalName 形如 "证书/子目录/文件.pem"。
 * @param files 全部文件
 * @param path  当前所在路径的分段数组，[] 表示根目录
 */
export function listDirectory<T extends { originalName: string; size: number }>(
  files: T[],
  path: string[] = []
): DirListing<T> {
  const prefix = path.length ? path.join("/") + "/" : ""
  const folderMap = new Map<string, DirFolder>()
  const dirFiles: T[] = []

  for (const file of files) {
    if (prefix && !file.originalName.startsWith(prefix)) continue
    const rest = file.originalName.slice(prefix.length)
    if (rest.length === 0) continue

    const slashAt = rest.indexOf("/")
    if (slashAt === -1) {
      // 直接位于当前目录
      dirFiles.push(file)
    } else {
      // 属于某个子文件夹
      const name = rest.slice(0, slashAt)
      let folder = folderMap.get(name)
      if (!folder) {
        folder = { name, path: prefix + name, count: 0, size: 0 }
        folderMap.set(name, folder)
      }
      folder.count += 1
      folder.size += file.size
    }
  }

  const folders = Array.from(folderMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name, "zh-Hans-CN")
  )

  return { folders, files: dirFiles }
}
